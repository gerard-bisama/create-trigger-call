var express = require('express');
var path = require('path');
var app = express();
var fs = require("fs");
var bodyParser=require('body-parser')
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var session = require('express-session');

const manifest = ReadJSONFile("create-trigger-call/manifest.webapp");

//console.log(manifest);

var userNamePassord=manifest.usersNamePassword;

//Variable initialization
const URLRAPIDROAPI =manifest.activities.rapidpro.apiurl;
//var tokenRP="Authorization: Token "+ "d3b0914fc43759e011ae6235262b668561e55a9a";
var tokenRP=manifest.activities.rapidpro.token;

// set the view engine to ejs
app.use(session({secret: '2C44774A-D649-4D44-9535-46E296EF984F'}));
// Authentication middleware
  app.use(function(req, res, next) {
	if (req.session && req.session.admin)
	res.locals.admin = true;
	next();
  });
// Authorization Middleware
  var authorize = function(req, res, next) {
	if (req.session && req.session.admin)
	return next();
	else
	return res.send(401);
  };
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(errorHandler);
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
//offset time is used to increase the time by offset in order to  manage time zone offset
const offsetTimeZone=-1;
const createdByAndModifiedById=3;
const orgID=1;


//function section
function errorHandler(err, req, res, next) {
	  if (res.headersSent) {
		return next(err);
	  }
	  res.status(500);
	  res.render('error', { error: err });
	}
function ReadJSONFile(fileName)
{
	var arrayPath=__dirname.split('/');
	var parentDirectory="/";
	for(var i=0;i<(arrayPath.length)-1;i++)
	{
		parentDirectory+=arrayPath[i]+"/";
	}
	//console.log("-------------");
	var filePath=path.resolve(path.join(parentDirectory, "/", fileName));
	//console.log(filePath);
	
	var contents = fs.readFileSync(filePath);
	console.log(filePath);
	var jsonContent = JSON.parse(contents);
	return jsonContent;
}
function incrementHoursByOffSet(originalDate)
{
	if(originalDate.includes("T")==true)
	{
		var dateComponants=originalDate.split("T"); 
		var partTime=dateComponants[1];   
		var partTimeSplitted=partTime.split(":");
		var hours= partTimeSplitted[0]; 
		var modifiedHours=parseInt(hours)+1;
		//rebuild partTimeofDate
		 var rebuiltTime="";
		for(var i=0;i<partTimeSplitted.length;i++)
		{
			if(i==0)
			{
				rebuiltTime+=modifiedHours;
			}
			else
			{
				rebuiltTime+=":"+partTimeSplitted[i];
			}
		}
		var rebuiltDate=dateComponants[0]+"T"+rebuiltTime;
		return rebuiltDate;
	}
	return null;
}
function formatDateInZform(originalDate)
{
	var formatedDate="";
	var dateComponants=[];
	//Check if at least it is timedate format
	var dateCorrected="";
	if(originalDate.includes("T")==false)
	{
		dateCorrected=originalDate.replace(" ","T");    
		//console.log("date: "+originalDate);                 
	}
	else
	{
		dateCorrected=originalDate;
	}
	var dateComponants=dateCorrected.split("+");
	if(dateComponants.length>0)
	{
		formatedDate=dateComponants[0];//+"+00:00"
		//formatedDate+="+00:00";
		if(formatedDate.includes("Z")||formatedDate.includes("z"))
		{
			var dateComponant2=formatedDate.split("Z");
			formatedDate=dateComponant2[0];
		}
		
	}
	return formatedDate;
}

function getListOfGroup(callback)
{
	var urlRequest=`${URLRAPIDROAPI}/groups.json`;
	var request = new XMLHttpRequest();
	request.open('GET',urlRequest, true);
	request.setRequestHeader('Content-Type','application/json');	
	//request.setRequestHeader(tokenRP);
	//request.setRequestHeader('Authorization','Token d3b0914fc43759e011ae6235262b668561e55a9a');
	request.setRequestHeader('Authorization','Token '+tokenRP);
	request.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
			//console.log("res sms : "+this.responseText);
			var myArr=null;
			if(this.responseText!="")
			{
				var myArr = JSON.parse(this.responseText);
			}
			
			//var modifiedArray = [myArr];
			//console.log(myArr);
			return callback(myArr);
			}
			else if (this.readyState == 4 && this.status != 200)
			{
				console.log("Error is here !!!");
				console.log(this.responseText);
			}
		};
		request.send();
}
function getGroupByName(nameOfTheGroup,callback)
{
	var urlRequest=`${URLRAPIDROAPI}/groups.json?name=${nameOfTheGroup}`;
	var request = new XMLHttpRequest();
	request.open('GET',urlRequest, true);
	request.setRequestHeader('Content-Type','application/json');	
	//request.setRequestHeader(tokenRP);
	//request.setRequestHeader('Authorization','Token d3b0914fc43759e011ae6235262b668561e55a9a');
	request.setRequestHeader('Authorization','Token '+tokenRP);
	request.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
			//console.log("res sms : "+this.responseText);
			var myArr=null;
			if(this.responseText!="")
			{
				var myArr = JSON.parse(this.responseText);
			}
			
			//var modifiedArray = [myArr];
			//console.log(myArr);
			return callback(myArr);
			}
			else if (this.readyState == 4 && this.status != 200)
			{
				console.log("Group by name : Error is here !!!");
				console.log(this.responseText);
			}
		};
		request.send();
}
function createGroup(nameOfTheGroup,callback)
{
	var urlRequest=`${URLRAPIDROAPI}/groups.json?name=${nameOfTheGroup}`;
	var request = new XMLHttpRequest();
	request.open('POST',urlRequest, true);
	request.setRequestHeader('Content-Type','application/json');
	//request.setRequestHeader(tokenRP);
	//request.setRequestHeader('Authorization','Token d3b0914fc43759e011ae6235262b668561e55a9a');
	request.setRequestHeader('Authorization','Token '+tokenRP);
	
	request.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
			//console.log("res sms : "+this.responseText);
			var myArr=null;
			if(this.responseText!="")
			{
				var myArr = JSON.parse(this.responseText);
			}
			
			//var modifiedArray = [myArr];
			//console.log(myArr);
			return callback(myArr);
			}
			else if (this.readyState == 4 && this.status != 200)
			{
				console.log("Create group :Error is here !!!");
				console.log(this.responseText);
			}
		};
		//request.send();
		request.send(JSON.stringify({responses:{name:nameOfTheGroup}}));
}
function getListOfFlows(callback)
{
	var urlRequest=`${URLRAPIDROAPI}/flows.json`;
	var request = new XMLHttpRequest();
	request.open('GET',urlRequest, true);
	request.setRequestHeader('Content-Type','application/json');	
	//request.setRequestHeader(tokenRP);
	//request.setRequestHeader('Authorization','Token d3b0914fc43759e011ae6235262b668561e55a9a');
	request.setRequestHeader('Authorization','Token '+tokenRP);
	request.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
			//console.log("res sms : "+this.responseText);
			var myArr=null;
			if(this.responseText!="")
			{
				var myArr = JSON.parse(this.responseText);
			}
			
			//var modifiedArray = [myArr];
			//console.log(myArr);
			return callback(myArr);
			}
			else if (this.readyState == 4 && this.status != 200)
			{
				console.log(this.responseText);
			}
		};
		request.send();
}
function getListOfContact(groupUId,callback)
{
	var urlRequest=`${URLRAPIDROAPI}/contacts.json`;
	var request = new XMLHttpRequest();
	request.open('GET',urlRequest, true);
	request.setRequestHeader('Content-Type','application/json');
	//request.setRequestHeader('Authorization','Token d3b0914fc43759e011ae6235262b668561e55a9a');
	request.setRequestHeader('Authorization','Token '+tokenRP);
	request.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
			//console.log("res sms : "+this.responseText);
			var listContactGroup=[];
			if(this.responseText!="")
			{
				var listContacts=JSON.parse(this.responseText).results;
				for(var i=0;i<listContacts.length;i++)
				{
					if (listContacts[i].groups.length>0)
					{
						for(var j=0;j<listContacts[i].groups.length;j++)
						{
							if(listContacts[i].groups[j].uuid==groupUId)
							{
								listContactGroup.push(listContacts[i]);
							}
						}
					}
				}
			}
			
			//var modifiedArray = [myArr];
			//console.log(myArr);
			return callback(listContactGroup);
			}
			else if (this.readyState == 4 && this.status != 200)
			{
				console.log(this.responseText);
			}
		};
		request.send();
}

//template section
app.get ("/", function (req,res,next)
{
	res.render('login',{error:null});
});
app.get ("/login", function (req,res,next)
{
	res.render('login',{error:null});
});
app.get ("/logout", function (req,res,next)
{
	req.session.destroy();
	res.redirect('/');
});
app.get ("/logout", function (req,res,next)
{
	req.session.destroy();
	res.redirect('/');
});
app.get ('/recordNewContact', function(req, res)
{
	var currentDateTime = new Date().toJSON();
	var currentDate=currentDateTime.split("T")[0];
	
	res.json(JSON.stringify({responses:{name:currentDate}}));
	/*
	getGroupByName(currentDate,function(listGroups)
	{
		var groups=[];
		var flows=[];
		if(listGroups!=null)
		{
			groups=listGroups.results;
			if(groups.length==0)//The group does not exist, create a new one
			{
				//Create the new group
				createGroup(currentDate,function(createdGroup) 
				{
					console.log(createdGroup);
					res.json(JSON.stringify({date:currentDate}));
				});
			}
			else //The group exist already
			{
				console.log("Get the group");
				res.json("{{'date':'2018-04-20'}}");
			}
		}
		
	});
	*/	
	
});

app.get('/index',authorize, function(req, res) {
	getListOfGroup(function(listGroups)
	{
		var groups=[];
		var flows=[];
		if(listGroups!=null)
		{
			groups=listGroups.results;
			//for
			
			//console.log(listGroups);
			getListOfFlows(function (listFlows)
			{
				if(listFlows!=null)
				{
					flows=listFlows.results;
				}
				res.render('index',{groups:groups,flows:flows});
			});
			
		}
		//res.render('index',{groups:groups});
	});
	//res.send("Message test");
	
    //res.render('index',{groups:groups});
});
app.post('/startflows', function(req, resRequest) {
	//console.log(req.body)
	var groupUID=req.body.group_select;
	var flowUID=req.body.flow_select;
	var interval= parseInt(req.body.interval_select);
	var dateSelect=req.body.date_select;
	
	//var currentDate=new Date(dateSelect);
	//console.log(dateSelect=="");
	//console.log("-------------");
	//return;
	//check parameter errors
	if(groupUID=="")
	{
		return resRequest.render('error', {
		menu:"error",error: 'Veuillez selectionner un groupe des contacts!',
		});
	}
	if(flowUID=="")
	{
		return resRequest.render('error', {
		menu:"error",error: 'Veuillez selectionner un flux!',
		});
	}
	if(interval==0)
	{
		return resRequest.render('error', {
		menu:"error",error: 'Veuillez selectionner un intervalle de temps!',
		});
	}
	if(dateSelect=="")
	{
		return resRequest.render('error', {
		menu:"error",error: 'Veuillez entrer la date du prochain lancement!',
		});
	}
	var currentDate=new Date(dateSelect);
	currentDate.setHours(currentDate.getHours()+offsetTimeZone);
	//var currentDate=new Date();
	//console.log(interval)
	const { Pool, Client } = require('pg');
	const connectionString = 'postgresql://temba:temba@localhost:5432/temba';
	//Get the flow id
	const client = new Client({connectionString: connectionString,});
	client.connect();
	client.query('SELECT id,uuid from flows_flow where  uuid = \''+flowUID+'\'', (err, res) => {
		if(err)
		{
			console.log(err, res);
		}
		else
		{
			var flowid=res.rows[0].id;
			//Get the list of contact within a group
			getListOfContact(groupUID,function(listContacts)
			{
				var contacts=[];
				contacts=listContacts;
				//var currentDate=new Date();
				for(var i=0;i<contacts.length;i++)
				{
					client.query('SELECT id,uuid from contacts_contact where  uuid=\''+contacts[i].uuid+'\'', (err, res) => {
						if(err)
						{
							console.log(err, res)
						}
						else
						{
							
							var contactId=res.rows[0].id;
							console.log("contact id :"+contactId);
							console.log("------------------------");
							//Check if the contact for this flow has been already scheduled
							client.query('select tgt.schedule_id,tgc.contact_id as contact_id from triggers_trigger as tgt \
								join schedules_schedule as sch on sch.id=tgt.schedule_id \
								join triggers_trigger_contacts as tgc on tgc.trigger_id=tgt.id \
								where tgt.flow_id='+flowid+' and tgc.contact_id='+contactId
								, (err, res) => {
									if(err)
									{
										console.log(err, res);
									}
									else
									{
										//console.log("----Get schedule ----");
										//console.log(res.rows);
										var scheduleId=-1;
										//Contact already scheduled with that flow
										if(res.rows.length>0)
										{
											console.log("Contact already scheduled with that flow");
											for(var j=0;j<res.rows.length;j++)
											{
												scheduleId=res.rows[j].schedule_id;
											}
											if(scheduleId!=-1)
											{
												var logDate=formatDateInZform(new Date().toJSON());
												currentDate.setMinutes(currentDate.getMinutes()+interval);
												//console.log(currentDate);
												var formatedDate=formatDateInZform(currentDate.toJSON());
												//console.log("formatted date :"+formatedDate);
												//console.log("Rebuilt date :"+incrementHoursByOffSet(formatedDate));
												var rebuiltDate=incrementHoursByOffSet(formatedDate);
												console.log(rebuiltDate);
												const queryToUpdate="update schedules_schedule set  next_fire=$1,modified_on=$2 where id=$3";
												var values =[rebuiltDate,logDate,scheduleId];
												client.query(queryToUpdate,values
												, (err, res) => {
													if(err)
													{
														console.log(err, res);
													}
												});
											}
										}
										//Contact is new to the flow
										else
										{
											console.log("Add new entry!!");
											var logDate=formatDateInZform(new Date().toJSON());
											currentDate.setMinutes(currentDate.getMinutes()+interval);
											//console.log(currentDate);
											var formatedDate=formatDateInZform(currentDate.toJSON());
											//console.log("formatted date :"+formatedDate);
											//console.log("Rebuilt date :"+incrementHoursByOffSet(formatedDate));
											var rebuiltDate=incrementHoursByOffSet(formatedDate);
											//Now create new entries for triggers;
											//Start by creating the schedule
											const queryToInsertSchedule="insert into schedules_schedule (is_active,created_on,modified_on,status,next_fire\
											,created_by_id,modified_by_id,repeat_period,repeat_days) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id";
											var values=[true,logDate,logDate,'S',rebuiltDate,createdByAndModifiedById,createdByAndModifiedById,0,0];
											client.query(queryToInsertSchedule,values
												, (err, res) => {
													if(err)
													{
														console.log(err, res);
													}
													else
													{
														scheduleIDAdded=res.rows[0].id;
														var logDate=formatDateInZform(new Date().toJSON());
														//Now insert the conresponding triggers entry
														const queryToInsertTrigger="insert into triggers_trigger (is_active,created_on,modified_on,trigger_count,is_archived\
														,trigger_type,created_by_id,flow_id,modified_by_id,org_id,schedule_id,match_type) \
														values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id";
														values=[true,logDate,logDate,0,false,'S',createdByAndModifiedById,flowid,createdByAndModifiedById,orgID,scheduleIDAdded,'F'];
														client.query(queryToInsertTrigger,values
															, (err, res) => {
																if(err)
																{
																	console.log(err, res);
																}
																else
																{
																	var triggerIdAdded=res.rows[0].id;
																	const queryToInsertTriggercontact="insert into triggers_trigger_contacts(trigger_id,contact_id) \
																	values ($1,$2)";
																	values=[triggerIdAdded,contactId];
																	client.query(queryToInsertTriggercontact,values
																	, (err, res) => {
																		if(err)
																		{
																			console.log(err, res);
																		}
																		else
																		{
																			
																		}
																	}); //end 
																	
																}
															});
															
													}
												});
										}//end of else contact in the flow
									}//end of else query triggres_triggers
								});//end of client query trigger_triggers
						}//end of else query contacts_contact
					});//end of client query contacts_contact
					var message="Création du trigger "+i+"sur "+contacts.length;
					//res.send(200);
				}//end of for contacts
				resRequest.render('finish_createtrigger');
				
			});//end of getist contacts
		}//end of else select flows_flow
	});//end of client query flows_flow
	
	//res.send(200);
});
app.post ("/login", function (req,res,next)
{
		var username=req.body.username;
		var password=req.body.password;
		if(password=="" || username=="")
		{
			res.render('login',{error:"Paramètres de connexion non valides"});
		}
		else
		{
			var find=false;
			for(var i=0;i<userNamePassord.length;i++)
			{
				if(userNamePassord[i].username==username && userNamePassord[i].password==password)
				{
					find=true;
				}
				else
				{
					continue;
				}
			}
			if (find==false)
			{
				res.render('login',{error:"Paramètres de connexion non valides"});
			}
			else
			{
				req.session.user=req.body.username;
				req.session.admin=true;
				res.redirect('/index');
			}
			
		}
		
		//console.log(req.body.password);
	});
//app.listen(8001);
//console.log('App running on port 8001');
server = app.listen(process.env.PORT || 8001, function() {
    return console.log("Create trigger call apps  is running on port:" + (server.address().port));
  });
