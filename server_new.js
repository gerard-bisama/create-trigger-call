var express = require('express');
var path = require('path');
var app = express();
var fs = require("fs");
var bodyParser=require('body-parser')
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var session = require('express-session');
 var dao =require ("./dao");

const manifest = ReadJSONFile("create-trigger-call/manifest.webapp");

//console.log(manifest);
var prefixeGroupPrestataire=manifest.prefixeGroupPrestataire;
var intervalBetweenCall=manifest.intervalBetweenCall;
var intervalBetweenCall4Prest=manifest.intervalBetweenCall4Prest
var userNamePassord=manifest.usersNamePassword;//interval between each call in minutes
var startCallTime=manifest.startCallTime;//Time to start the call
var startCallTime4Prest=manifest.startCallTime4Prest;
var listfluxParamsForCall=manifest.arrayfluxParamsForCall;
var listfluxParamsForCall4Prest=manifest.arrayfluxParamsForCall4Prest;

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
const offsetTimeZone= manifest.offsetTimeZone;//-1
const createdByAndModifiedById= manifest.createdByAndModifiedById;
const orgID=manifest.orgID;


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
		var modifiedHours=parseInt(hours)+offsetTimeZone;
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
			if (this.readyState == 4 && (this.status >= 200 && this.status < 300)) {
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
			else if (this.readyState == 4 && (this.status < 200 && this.status > 299))
			{
				console.log("Error is here !!!");
				console.log(this.responseText);
			}
		};
		request.send();
}
function getNbrContactsInGroup(groupeName,callback)
{
	var counter=0;
	var urlRequest=`${URLRAPIDROAPI}/contacts.json`;
	var request = new XMLHttpRequest();
	request.open('GET',urlRequest, true);
	request.setRequestHeader('Content-Type','application/json');	
	//request.setRequestHeader(tokenRP);
	//request.setRequestHeader('Authorization','Token d3b0914fc43759e011ae6235262b668561e55a9a');
	request.setRequestHeader('Authorization','Token '+tokenRP);
	request.onreadystatechange = function() {
			if (this.readyState == 4 && (this.status >= 200 && this.status < 300)) {
			//console.log("res sms : "+this.responseText);
			var listContact=null;
			if(this.responseText!="")
			{
				listContact = JSON.parse(this.responseText);
			}
			
			for(var j=0;j<listContact.results;j++)
			{
				if(listContact.results[j].groups.length>0)
				{
					console.log(`#############Contact ${j}  with group################# `)
					console.log()
					for(var k=0;k<listContact.results[j].groups.length;k++)
					{
						if(listContact.results[j].groups[k].name==groupeName)
						{
							counter++;
						}
					}
				}
			}
			
			//var modifiedArray = [myArr];
			//console.log(myArr);
			return callback(counter);
			}
			else if (this.readyState == 4 && (this.status < 200 && this.status > 299))
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
			if (this.readyState == 4 && (this.status >= 200 && this.status < 300 )) {
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
			else if (this.readyState == 4 && (this.status < 200 && this.status > 299))
			{
				console.log("Group by name : Error is here !!!");
				console.log(this.responseText);
			}
		};
		request.send();
}
function getContactByUUID(contactUUID,callback)
{
	var urlRequest=`${URLRAPIDROAPI}/contacts.json?uuid=${contactUUID}`;
	var request = new XMLHttpRequest();
	request.open('GET',urlRequest, true);
	request.setRequestHeader('Content-Type','application/json');	
	//request.setRequestHeader(tokenRP);
	//request.setRequestHeader('Authorization','Token d3b0914fc43759e011ae6235262b668561e55a9a');
	request.setRequestHeader('Authorization','Token '+tokenRP);
	request.onreadystatechange = function() {
			if (this.readyState == 4 && (this.status >= 200 && this.status < 300 )) {
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
			else if (this.readyState == 4 && (this.status < 200 && this.status > 299))
			{
				console.log("Group by name : Error is here !!!");
				console.log(this.responseText);
			}
		};
		request.send();
}
function createGroup(nameOfTheGroup,callback)
{
	var urlRequest=`${URLRAPIDROAPI}/groups.json`;
	//console.log(urlRequest);
	var request = new XMLHttpRequest();
	request.open('POST',urlRequest, true);
	request.setRequestHeader('Content-Type','application/json');
	//request.setRequestHeader(tokenRP);
	//request.setRequestHeader('Authorization','Token d3b0914fc43759e011ae6235262b668561e55a9a');
	request.setRequestHeader('Authorization','Token '+tokenRP);
	
	request.onreadystatechange = function() {
		//console.log("readyState="+this.readyState+" and status="+this.status);
			if (this.readyState == 4 && (this.status >= 200 && this.status < 300 )) {
			//console.log("res sms : "+this.responseText);
			var myArr=null;
			if(this.responseText!="")
			{
				var myArr = JSON.parse(this.responseText);
			}
			//console.log("---------response--------");
			//console.log(myArr);
			//var modifiedArray = [myArr];
			//console.log(myArr);
			//return callback(JSON.stringify({"groupe":nameOfTheGroup}));
			return callback(myArr);
			}
			else if (this.readyState == 4 && (this.status < 200 && this.status > 299))
			//else
			{
				console.log("Create group :Error is here !!!");
				console.log(this.responseText);
			}
		};
		request.send(JSON.stringify({"name":nameOfTheGroup}));
		//request.send(JSON.stringify({"groupe":nameOfTheGroup}));
}
function updateContactGroup(contactUUID,contactGroups,callback)
{
	var urlRequest=`${URLRAPIDROAPI}/contacts.json?uuid=${contactUUID}`;
	var request = new XMLHttpRequest();
	request.open('POST',urlRequest, true);
	request.setRequestHeader('Content-Type','application/json');
	//request.setRequestHeader(tokenRP);
	//request.setRequestHeader('Authorization','Token d3b0914fc43759e011ae6235262b668561e55a9a');
	request.setRequestHeader('Authorization','Token '+tokenRP);
	
	request.onreadystatechange = function() {
			if (this.readyState == 4 && (this.status >= 200 && this.status < 300 )) {
			//console.log("res sms : "+this.responseText);
			var myArr=null;
			if(this.responseText!="")
			{
				var myArr = JSON.parse(this.responseText);
			}
			//console.log("---------response--------");
			//console.log(myArr);
			//var modifiedArray = [myArr];
			//console.log(myArr);
			//return callback(JSON.stringify({"groupe":nameOfTheGroup}));
			return callback(JSON.stringify(myArr));
			}
			else if (this.readyState == 4 && (this.status < 200 && this.status > 299))
			//else
			{
				console.log("Update contact :Error is here !!!");
				console.log(this.responseText);
			}
		};
		request.send(JSON.stringify({"groups":contactGroups}));
		//request.send(JSON.stringify({"groupe":nameOfTheGroup}));
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
app.get ('/testdb', function(req, res)
{
	var groupName="2018-05-14";
	/*
	dao.saveGroupInfo(groupName,function(resSave)
	{
		console.log(resSave);
		dao.updateCounter(groupName,function(resUpdate)
		{
			console.log(`res update ${resUpdate}`);
		});
	});
	* */
	dao.getCounter(groupName,function(resCount)
	{
		console.log(resCount);
	});
	
});
app.get ('/recordNewContact/uuid=:uuid', function(req, res)
{
	var currentDateTime = new Date().toJSON();
	var currentDate=currentDateTime.split("T")[0];
	//console.log(JSON.stringify({send:{name:currentDate}}));
	//res.send(JSON.stringify({ name:currentDate }));
	//res.send(JSON.stringify({ a: 1 }));
	//console.log("phone :"+req.params.tel);
	//console.log(req.params.tel);
	var contactUUID=req.params.uuid;
	getContactByUUID(contactUUID,function(contact)
	{
		//console.log("----Contact by UUID----");
		//console.log(contact);
		if(contact.results.length>0)
		{
			contactGroups=contact.results[0].groups;
			var contactGroups=[];
			for(var i=0;i<contact.results[0].groups.length;i++)
			{
				contactGroups.push(contact.results[0].groups[i].uuid);
			}
		//Get nbre of contact by group,wetheir the group exist or not
		
			getGroupByName(currentDate,function(listGroups)
			{
				console.log(`Enter group section!!`);
				var groups=[];
				var flows=[];
				if(listGroups!=null)
				{
					
					groups=listGroups.results;
					if(groups.length==0)//The group does not exist, create a new one
					{
						var exitedWithError=false;
						console.log("###############Creation of a new group#####################");
						createGroup(currentDate,function(createdGroup) 
						{
							
							//console.log(createdGroup.name);
							//res.send(createdGroup);
							//assing the contact to the group
							var groupInfo=JSON.parse(JSON.stringify({name:createdGroup.name,uuid:createdGroup.uuid}));
							contactGroups.push(groupInfo.uuid);
							var nbrContact=0;
							dao.saveGroupInfo(currentDate,function(resCreateGroup)
							{
								if(!resCreateGroup)
								{
									res.send(JSON.stringify({"register":0}));
								}
								else
								{
									updateContactGroup(contactUUID,contactGroups,function(updatedContact)
									{
										var Client = require('pg-native');
										var client = new Client();
										const connectionString = 'postgresql://temba:temba@localhost:5432/temba';
										client.connectSync(connectionString);
										/*********Pg Query section*************/
										var queryFindContactId='SELECT id,uuid from contacts_contact where  uuid=\''+contactUUID+'\'';
										var rows = client.querySync(queryFindContactId);
										var contactId=rows[0].id;
										var nowDate=new Date().toJSON().split("T")[0];
										var currentDateString=nowDate+"T"+startCallTime;
										var interval=0;
										for(var i=0;i<listfluxParamsForCall.length;i++)
										{
											var todayDate=new Date(currentDateString);
											todayDate.setHours(todayDate.getHours()+offsetTimeZone);
											if(i==(listfluxParamsForCall[i].index-1))
											{
												var flowUID=listfluxParamsForCall[i].uuid;
												var timeNextTrigger=listfluxParamsForCall[i].timeNextTrigger;
												var timeUnit=listfluxParamsForCall[i].timeUnit;
												/*********Pg Query section*************/
												var queryFindFlowId='SELECT id,uuid from flows_flow where  uuid = \''+flowUID+'\'';
												rowsFlowId = client.querySync(queryFindFlowId);
												var flowid=rowsFlowId[0].id;
												//Check if the contact for this flow has been already scheduled
												/*********Pg Query section*************/
												var queryFindScheduleId='select tgt.schedule_id,tgc.contact_id as contact_id from triggers_trigger as tgt \
															join schedules_schedule as sch on sch.id=tgt.schedule_id \
															join triggers_trigger_contacts as tgc on tgc.trigger_id=tgt.id \
															where tgt.flow_id='+flowid+' and tgc.contact_id='+contactId;
												rowsScheduleContact = client.querySync(queryFindScheduleId);
												var scheduleId=-1;
												//scheduleId=
												//if the contact already in existing update it
												if(rowsScheduleContact.length>0)
												{
													exitedWithError=true;
													scheduleId=rowsScheduleContact[0].schedule_id;
													res.end(JSON.stringify({"register":2}));
													break;
												}
												//if not in an existing schedule create a new schedule
												else
												{
													console.log("Add new entry!!");
													var logDate=formatDateInZform(new Date().toJSON());
													switch(timeUnit)
													{
														case "d"://for days
															var hours=timeNextTrigger*24;//transform day to 
															todayDate.setHours(todayDate.getHours()+hours);
														break;
														case "h"://for hours
															todayDate.setHours(todayDate.getHours()+timeNextTrigger);
														break;
														case "m":
															todayDate.setMinutes(todayDate.getMinutes()+timeNextTrigger);
														break;
														default:
															todayDate.setHours(todayDate.getHours()+timeNextTrigger);
													}
													todayDate.setMinutes(todayDate.getMinutes()+interval);
													console.log(`nexttime: ${todayDate} and nextimeTrigger=${timeNextTrigger}`);
													var formatedDate=formatDateInZform(todayDate.toJSON());
													console.log(`formatedDate: ${formatedDate}`);
													/*********Pg Query section*************/
													const queryToInsertSchedule="insert into schedules_schedule (is_active,created_on,modified_on,status,next_fire\
													,created_by_id,modified_by_id,repeat_period,repeat_days) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id";
													var values=[true,logDate,logDate,'S',formatedDate,createdByAndModifiedById,createdByAndModifiedById,0,0];
													var rowsSchedule = client.querySync(queryToInsertSchedule,values);
													var scheduleIDAdded=rowsSchedule[0].id;
													var logDate=formatDateInZform(new Date().toJSON());
													//Now insert the conresponding triggers entry
													/*********Pg Query section*************/
													const queryToInsertTrigger="insert into triggers_trigger (is_active,created_on,modified_on,trigger_count,is_archived\
													,trigger_type,created_by_id,flow_id,modified_by_id,org_id,schedule_id,match_type) \
													values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id";
													values=[true,logDate,logDate,0,false,'S',createdByAndModifiedById,flowid,createdByAndModifiedById,orgID,scheduleIDAdded,'F'];
													var rowsTrigger = client.querySync(queryToInsertTrigger,values);
													var triggerIdAdded=rowsTrigger[0].id;
													/*********Pg Query section*************/
													const queryToInsertTriggercontact="insert into triggers_trigger_contacts(trigger_id,contact_id) \
																						values ($1,$2)";
													values=[triggerIdAdded,contactId];
													rowsTriggerContact = client.querySync(queryToInsertTriggercontact,values);
													
												}
												
											}
										}//End for
										//Then update the counter
										//res.send(JSON.stringify({"register":1}));
										if(!exitedWithError)
										{
											dao.updateCounter(currentDate,function(resUpdate)
											{
												if(resUpdate==true)
												{
													console.log('update done!')
													res.send(JSON.stringify({"register":1}));
												}
												else
												{
													res.send(JSON.stringify({"register":0}));
												}
											});
										}
										
										
									});
							
								}
							});
							//and tail mongo create group
						});
						
					}
					else //The group exist already
					{
						var exitedWithError=false;
						//console.log("Get the group");
						console.log("###############Assignment to an existing group#####################");
						//res.send(JSON.stringify({ "groupe":currentDate }));
						var groupeUUID=listGroups.results[0].uuid;
						contactGroups.push(groupeUUID);
						//get Number of contacts in the group
						dao.getCounter(currentDate,function(_nbrContact)
						{
							var nbrContact=_nbrContact;
							console.log(`Existing contact=${nbrContact}`);
							updateContactGroup(contactUUID,contactGroups,function(updatedContact)
							{
								var Client = require('pg-native');
								var client = new Client();
								const connectionString = 'postgresql://temba:temba@localhost:5432/temba';
								client.connectSync(connectionString);
								/*********Pg Query section*************/
								var queryFindContactId='SELECT id,uuid from contacts_contact where  uuid=\''+contactUUID+'\'';
								var rowsContact = client.querySync(queryFindContactId);
								var contactId=rowsContact[0].id;
								var nowDate=new Date().toJSON().split("T")[0];
								var currentDateString=nowDate+"T"+startCallTime;
								
								
								for(var i=0;i<listfluxParamsForCall.length;i++)
								{
									var todayDate=new Date(currentDateString);
									todayDate.setHours(todayDate.getHours()+offsetTimeZone);
									if(i==(listfluxParamsForCall[i].index-1))
									{
										
										var flowUID=listfluxParamsForCall[i].uuid;
										var timeNextTrigger=listfluxParamsForCall[i].timeNextTrigger;
										var timeUnit=listfluxParamsForCall[i].timeUnit;
										/*********Pg Query section*************/
										var queryFindFlowId='SELECT id,uuid from flows_flow where  uuid = \''+flowUID+'\'';
										var rowsFlows = client.querySync(queryFindFlowId);
										var flowid=rowsFlows[0].id;
										//Check if the contact for this flow has been already scheduled
										/*********Pg Query section*************/
										var queryFindScheduleId='select tgt.schedule_id,tgc.contact_id as contact_id from triggers_trigger as tgt \
													join schedules_schedule as sch on sch.id=tgt.schedule_id \
													join triggers_trigger_contacts as tgc on tgc.trigger_id=tgt.id \
													where tgt.flow_id='+flowid+' and tgc.contact_id='+contactId;
										var rowsScheduleContact = client.querySync(queryFindScheduleId);
										var scheduleId=-1;
										//rows = client.querySync(queryFindScheduleId);
										if(rowsScheduleContact.length>0)
										{
											exitedWithError=true;
											scheduleId=rowsScheduleContact[0].schedule_id;
											res.end(JSON.stringify({"register":2}));//flux deja programmé
											break;
											//return;
										}
										else
										{
											console.log("Add new entry!!");
											var logDate=formatDateInZform(new Date().toJSON());
											//var interval=((nbrContact)*intervalBetweenCall)+timeNextTrigger;
											var interval=((nbrContact)*intervalBetweenCall);
											switch(timeUnit)
											{
												case "d"://for days
													var hours=timeNextTrigger*24;//transform day to 
													todayDate.setHours(todayDate.getHours()+hours);
												break;
												case "h"://for hours
													todayDate.setHours(todayDate.getHours()+timeNextTrigger);
												break;
												case "m":
													todayDate.setMinutes(todayDate.getMinutes()+timeNextTrigger);
													break;
												default:
													todayDate.setHours(todayDate.getHours()+timeNextTrigger);
											}
											todayDate.setMinutes(todayDate.getMinutes()+interval);
											var formatedDate=formatDateInZform(todayDate.toJSON());
											/*********Pg Query section*************/
											const queryToInsertSchedule="insert into schedules_schedule (is_active,created_on,modified_on,status,next_fire\
											,created_by_id,modified_by_id,repeat_period,repeat_days) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id";
											var values=[true,logDate,logDate,'S',formatedDate,createdByAndModifiedById,createdByAndModifiedById,0,0];
											var rowSchedule = client.querySync(queryToInsertSchedule,values);
											var scheduleIDAdded=rowSchedule[0].id;
											var logDate=formatDateInZform(new Date().toJSON());
											//Now insert the conresponding triggers entry
											/*********Pg Query section*************/
											const queryToInsertTrigger="insert into triggers_trigger (is_active,created_on,modified_on,trigger_count,is_archived\
											,trigger_type,created_by_id,flow_id,modified_by_id,org_id,schedule_id,match_type) \
											values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id";
											values=[true,logDate,logDate,0,false,'S',createdByAndModifiedById,flowid,createdByAndModifiedById,orgID,scheduleIDAdded,'F'];
											var rowsTrigger = client.querySync(queryToInsertTrigger,values);
											var triggerIdAdded=rowsTrigger[0].id;
											/*********Pg Query section*************/
											const queryToInsertTriggercontact="insert into triggers_trigger_contacts(trigger_id,contact_id) \
											values ($1,$2)";
											values=[triggerIdAdded,contactId];
											var rowTriggerContact = client.querySync(queryToInsertTriggercontact,values);
										}
										
									}
								}//End for
								if(!exitedWithError)
								{
									dao.updateCounter(currentDate,function(resUpdate)
									{
										if(resUpdate==true)
										{
											console.log('update done!')
											res.send(JSON.stringify({"register":1}));//1 pour ok,0 pour erreur creation of groupe,2 pour flux deja programmé
										}
										else
										{
											res.send(JSON.stringify({"register":0}));
										}
									});
								}
							});
						});
						//res.send(JSON.stringify({ "groupe":currentDate }));
					}
				}
				
			});
	
		}//end if contact.results
		else
		{
			res.send(JSON.stringify({"register":0}));
		}
		
		//res.send(JSON.stringify({"register":1}));
	});
	
		
	
});
app.get ('/recordNewWorker/uuid=:uuid', function(req, res)
{
	var currentDateTime = new Date().toJSON();
	var currentDate=prefixeGroupPrestataire+"_"+currentDateTime.split("T")[0];
	
	var contactUUID=req.params.uuid;
	getContactByUUID(contactUUID,function(contact)
	{
		if(contact.results.length>0)
		{
			contactGroups=contact.results[0].groups;
			var contactGroups=[];
			for(var i=0;i<contact.results[0].groups.length;i++)
			{
				contactGroups.push(contact.results[0].groups[i].uuid);
			}
		
			getGroupByName(currentDate,function(listGroups)
			{
				console.log(`Enter group section!!`);
				var groups=[];
				var flows=[];
				if(listGroups!=null)
				{
					
					groups=listGroups.results;
					if(groups.length==0)//The group does not exist, create a new one
					{
						var exitedWithError=false;
						console.log("###############Creation of a new group#####################");
						createGroup(currentDate,function(createdGroup) 
						{
							
							//console.log(createdGroup.name);
							//res.send(createdGroup);
							//assing the contact to the group
							var groupInfo=JSON.parse(JSON.stringify({name:createdGroup.name,uuid:createdGroup.uuid}));
							contactGroups.push(groupInfo.uuid);
							var nbrContact=0;
							dao.saveGroupInfo(currentDate,function(resCreateGroup)
							{
								if(!resCreateGroup)
								{
									res.send(JSON.stringify({"register":0}));
								}
								else
								{
									updateContactGroup(contactUUID,contactGroups,function(updatedContact)
									{
										var Client = require('pg-native');
										var client = new Client();
										const connectionString = 'postgresql://temba:temba@localhost:5432/temba';
										client.connectSync(connectionString);
										/*********Pg Query section*************/
										var queryFindContactId='SELECT id,uuid from contacts_contact where  uuid=\''+contactUUID+'\'';
										var rows = client.querySync(queryFindContactId);
										var contactId=rows[0].id;
										var nowDate=new Date().toJSON().split("T")[0];
										var currentDateString=nowDate+"T"+startCallTime4Prest;
										var interval=0;
										for(var i=0;i<listfluxParamsForCall4Prest.length;i++)
										{
											var todayDate=new Date(currentDateString);
											todayDate.setHours(todayDate.getHours()+offsetTimeZone);
											if(i==(listfluxParamsForCall4Prest[i].index-1))
											{
												var flowUID=listfluxParamsForCall4Prest[i].uuid;
												var timeNextTrigger=listfluxParamsForCall4Prest[i].timeNextTrigger;
												var timeUnit=listfluxParamsForCall4Prest[i].timeUnit;
												/*********Pg Query section*************/
												var queryFindFlowId='SELECT id,uuid from flows_flow where  uuid = \''+flowUID+'\'';
												rowsFlowId = client.querySync(queryFindFlowId);
												var flowid=rowsFlowId[0].id;
												//Check if the contact for this flow has been already scheduled
												/*********Pg Query section*************/
												var queryFindScheduleId='select tgt.schedule_id,tgc.contact_id as contact_id from triggers_trigger as tgt \
															join schedules_schedule as sch on sch.id=tgt.schedule_id \
															join triggers_trigger_contacts as tgc on tgc.trigger_id=tgt.id \
															where tgt.flow_id='+flowid+' and tgc.contact_id='+contactId;
												rowsScheduleContact = client.querySync(queryFindScheduleId);
												var scheduleId=-1;
												//scheduleId=
												//if the contact already in existing update it
												if(rowsScheduleContact.length>0)
												{
													exitedWithError=true;
													scheduleId=rowsScheduleContact[0].schedule_id;
													res.end(JSON.stringify({"register":2}));
													break;
												}
												//if not in an existing schedule create a new schedule
												else
												{
													console.log("Add new entry!!");
													var logDate=formatDateInZform(new Date().toJSON());
													switch(timeUnit)
													{
														case "d"://for days
															var hours=timeNextTrigger*24;//transform day to 
															todayDate.setHours(todayDate.getHours()+hours);
														break;
														case "h"://for hours
															todayDate.setHours(todayDate.getHours()+timeNextTrigger);
														break;
														case "m":
															todayDate.setMinutes(todayDate.getMinutes()+timeNextTrigger);
														break;
														default:
															todayDate.setHours(todayDate.getHours()+timeNextTrigger);
													}
													todayDate.setMinutes(todayDate.getMinutes()+interval);
													console.log(`nexttime: ${todayDate} and nextimeTrigger=${timeNextTrigger}`);
													var formatedDate=formatDateInZform(todayDate.toJSON());
													console.log(`formatedDate: ${formatedDate}`);
													/*********Pg Query section*************/
													const queryToInsertSchedule="insert into schedules_schedule (is_active,created_on,modified_on,status,next_fire\
													,created_by_id,modified_by_id,repeat_period,repeat_days) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id";
													var values=[true,logDate,logDate,'S',formatedDate,createdByAndModifiedById,createdByAndModifiedById,0,0];
													var rowsSchedule = client.querySync(queryToInsertSchedule,values);
													var scheduleIDAdded=rowsSchedule[0].id;
													var logDate=formatDateInZform(new Date().toJSON());
													//Now insert the conresponding triggers entry
													/*********Pg Query section*************/
													const queryToInsertTrigger="insert into triggers_trigger (is_active,created_on,modified_on,trigger_count,is_archived\
													,trigger_type,created_by_id,flow_id,modified_by_id,org_id,schedule_id,match_type) \
													values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id";
													values=[true,logDate,logDate,0,false,'S',createdByAndModifiedById,flowid,createdByAndModifiedById,orgID,scheduleIDAdded,'F'];
													var rowsTrigger = client.querySync(queryToInsertTrigger,values);
													var triggerIdAdded=rowsTrigger[0].id;
													/*********Pg Query section*************/
													const queryToInsertTriggercontact="insert into triggers_trigger_contacts(trigger_id,contact_id) \
																						values ($1,$2)";
													values=[triggerIdAdded,contactId];
													rowsTriggerContact = client.querySync(queryToInsertTriggercontact,values);
													
												}
												
											}
										}//End for
										//Then update the counter
										//res.send(JSON.stringify({"register":1}));
										if(!exitedWithError)
										{
											dao.updateCounter(currentDate,function(resUpdate)
											{
												if(resUpdate==true)
												{
													console.log('update done!')
													res.send(JSON.stringify({"register":1}));
												}
												else
												{
													res.send(JSON.stringify({"register":0}));
												}
											});
										}
										
										
									});
							
								}
							});
							//and tail mongo create group
						});
						
					}
					else //The group exist already
					{
						var exitedWithError=false;
						//console.log("Get the group");
						console.log("###############Assignment to an existing group#####################");
						//res.send(JSON.stringify({ "groupe":currentDate }));
						var groupeUUID=listGroups.results[0].uuid;
						contactGroups.push(groupeUUID);
						//get Number of contacts in the group
						dao.getCounter(currentDate,function(_nbrContact)
						{
							var nbrContact=_nbrContact;
							console.log(`Existing contact=${nbrContact}`);
							updateContactGroup(contactUUID,contactGroups,function(updatedContact)
							{
								var Client = require('pg-native');
								var client = new Client();
								const connectionString = 'postgresql://temba:temba@localhost:5432/temba';
								client.connectSync(connectionString);
								/*********Pg Query section*************/
								var queryFindContactId='SELECT id,uuid from contacts_contact where  uuid=\''+contactUUID+'\'';
								var rowsContact = client.querySync(queryFindContactId);
								var contactId=rowsContact[0].id;
								var nowDate=new Date().toJSON().split("T")[0];
								var currentDateString=nowDate+"T"+startCallTime4Prest;
								
								
								for(var i=0;i<listfluxParamsForCall4Prest.length;i++)
								{
									var todayDate=new Date(currentDateString);
									todayDate.setHours(todayDate.getHours()+offsetTimeZone);
									if(i==(listfluxParamsForCall4Prest[i].index-1))
									{
										
										var flowUID=listfluxParamsForCall4Prest[i].uuid;
										var timeNextTrigger=listfluxParamsForCall4Prest[i].timeNextTrigger;
										var timeUnit=listfluxParamsForCall4Prest[i].timeUnit;
										/*********Pg Query section*************/
										var queryFindFlowId='SELECT id,uuid from flows_flow where  uuid = \''+flowUID+'\'';
										var rowsFlows = client.querySync(queryFindFlowId);
										var flowid=rowsFlows[0].id;
										//Check if the contact for this flow has been already scheduled
										/*********Pg Query section*************/
										var queryFindScheduleId='select tgt.schedule_id,tgc.contact_id as contact_id from triggers_trigger as tgt \
													join schedules_schedule as sch on sch.id=tgt.schedule_id \
													join triggers_trigger_contacts as tgc on tgc.trigger_id=tgt.id \
													where tgt.flow_id='+flowid+' and tgc.contact_id='+contactId;
										var rowsScheduleContact = client.querySync(queryFindScheduleId);
										var scheduleId=-1;
										//rows = client.querySync(queryFindScheduleId);
										if(rowsScheduleContact.length>0)
										{
											exitedWithError=true;
											scheduleId=rowsScheduleContact[0].schedule_id;
											res.end(JSON.stringify({"register":2}));//flux deja programmé
											break;
											//return;
										}
										else
										{
											console.log("Add new entry!!");
											var logDate=formatDateInZform(new Date().toJSON());
											//var interval=((nbrContact)*intervalBetweenCall)+timeNextTrigger;
											var interval=((nbrContact)*intervalBetweenCall4Prest);
											switch(timeUnit)
											{
												case "d"://for days
													var hours=timeNextTrigger*24;//transform day to 
													todayDate.setHours(todayDate.getHours()+hours);
												break;
												case "h"://for hours
													todayDate.setHours(todayDate.getHours()+timeNextTrigger);
												break;
												case "m":
													todayDate.setMinutes(todayDate.getMinutes()+timeNextTrigger);
													break;
												default:
													todayDate.setHours(todayDate.getHours()+timeNextTrigger);
											}
											todayDate.setMinutes(todayDate.getMinutes()+interval);
											var formatedDate=formatDateInZform(todayDate.toJSON());
											/*********Pg Query section*************/
											const queryToInsertSchedule="insert into schedules_schedule (is_active,created_on,modified_on,status,next_fire\
											,created_by_id,modified_by_id,repeat_period,repeat_days) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id";
											var values=[true,logDate,logDate,'S',formatedDate,createdByAndModifiedById,createdByAndModifiedById,0,0];
											var rowSchedule = client.querySync(queryToInsertSchedule,values);
											var scheduleIDAdded=rowSchedule[0].id;
											var logDate=formatDateInZform(new Date().toJSON());
											//Now insert the conresponding triggers entry
											/*********Pg Query section*************/
											const queryToInsertTrigger="insert into triggers_trigger (is_active,created_on,modified_on,trigger_count,is_archived\
											,trigger_type,created_by_id,flow_id,modified_by_id,org_id,schedule_id,match_type) \
											values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id";
											values=[true,logDate,logDate,0,false,'S',createdByAndModifiedById,flowid,createdByAndModifiedById,orgID,scheduleIDAdded,'F'];
											var rowsTrigger = client.querySync(queryToInsertTrigger,values);
											var triggerIdAdded=rowsTrigger[0].id;
											/*********Pg Query section*************/
											const queryToInsertTriggercontact="insert into triggers_trigger_contacts(trigger_id,contact_id) \
											values ($1,$2)";
											values=[triggerIdAdded,contactId];
											var rowTriggerContact = client.querySync(queryToInsertTriggercontact,values);
										}
										
									}
								}//End for
								if(!exitedWithError)
								{
									dao.updateCounter(currentDate,function(resUpdate)
									{
										if(resUpdate==true)
										{
											console.log('update done!')
											res.send(JSON.stringify({"register":1}));//1 pour ok,0 pour erreur creation of groupe,2 pour flux deja programmé
										}
										else
										{
											res.send(JSON.stringify({"register":0}));
										}
									});
								}
							});
						});
						//res.send(JSON.stringify({ "groupe":currentDate }));
					}
				}
				
			});
	
		}//end if contact.results
		else
		{
			res.send(JSON.stringify({"register":0}));
		}
		
		//res.send(JSON.stringify({"register":1}));
	});
	
		
	
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
					//console.log(listFlows.results);
					//console.log(listFlows.length);
					//flows.push()
					for(var i=0;i<listFlows.results.length;i++)
					{
						//console.log(listFlows.results[i].archived);
						if(listFlows.results[i].archived==false)
						{
							flows.push(listFlows.results[i]);
						}
						else
						{
							continue;
						}
					}
					//flows=listFlows.results;
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
	var Client = require('pg-native');
	var client = new Client();
	const connectionString = 'postgresql://temba:temba@localhost:5432/temba';
	client.connectSync(connectionString);
	/*********Pg Query section*************/
	var queryFindFlowId='SELECT id,uuid from flows_flow where  uuid = \''+flowUID+'\'';
	var rows = client.querySync(queryFindFlowId);
	var flowid=rows[0].id;
	getListOfContact(groupUID,function(listContacts)
	{
		var contacts=[];
		contacts=listContacts;
		var listContactUUID=[];
		var listContactString="("
		for(var i=0;i<contacts.length;i++)
		{
			if(i==0)
			{
				listContactString+="'"+contacts[i].uuid+"'";
			}
			else
			{
				listContactString+=",'"+contacts[i].uuid+"'";
			}
		}
		listContactString+=")"
		/*********Pg Query section*************/
		var queryFindContactIds='SELECT id,uuid from contacts_contact where uuid in '+listContactString;
		//console.log(queryFindContactIds);
		rows=client.querySync(queryFindContactIds);
		if(rows.length>0)
		{
			//console.log(`row length ${rows.length}`);
			for(var i=0;i<rows.length;i++)
			{
				console.log(`programmation du contact ${rows[i].id}`);
				var contactId=rows[i].id;
				var queryFindScheduleId='select tgt.schedule_id,tgc.contact_id as contact_id from triggers_trigger as tgt \
							join schedules_schedule as sch on sch.id=tgt.schedule_id \
							join triggers_trigger_contacts as tgc on tgc.trigger_id=tgt.id \
							where tgt.flow_id='+flowid+' and tgc.contact_id='+contactId;
				
				var scheduleId=-1;
				var rowsSchedule = client.querySync(queryFindScheduleId);
				if(rowsSchedule.length>0)//Contact already schedule with the flow, update the nextfire
				{
					scheduleId=rowsSchedule[0].schedule_id;
					var logDate=formatDateInZform(new Date().toJSON());
					if(i>0)
					{
						currentDate.setMinutes(currentDate.getMinutes()+interval);
					}
					var formatedDate=formatDateInZform(currentDate.toJSON());
					/*********Pg Query section*************/
					const queryToUpdate="update schedules_schedule set  next_fire=$1,modified_on=$2 where id=$3";
					var values =[formatedDate,logDate,scheduleId];
					var rowsUpdateSchedule = client.querySync(queryToUpdate,values);
				}
				else //New schedule
				{
					console.log("Add new entry!!");
					var logDate=formatDateInZform(new Date().toJSON());
					if(i>0)
					{
						currentDate.setMinutes(currentDate.getMinutes()+interval);
					}
					
					var formatedDate=formatDateInZform(currentDate.toJSON());
					/*********Pg Query section*************/
					const queryToInsertSchedule="insert into schedules_schedule (is_active,created_on,modified_on,status,next_fire\
						,created_by_id,modified_by_id,repeat_period,repeat_days) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id";
					var values=[true,logDate,logDate,'S',formatedDate,createdByAndModifiedById,createdByAndModifiedById,0,0];
					var rowsSchedule = client.querySync(queryToInsertSchedule,values);
					var scheduleIDAdded=rowsSchedule[0].id;
					
					/*********Pg Query section*************/
					var logDate=formatDateInZform(new Date().toJSON());
					const queryToInsertTrigger="insert into triggers_trigger (is_active,created_on,modified_on,trigger_count,is_archived\
					,trigger_type,created_by_id,flow_id,modified_by_id,org_id,schedule_id,match_type) \
					values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id";
					values=[true,logDate,logDate,0,false,'S',createdByAndModifiedById,flowid,createdByAndModifiedById,orgID,scheduleIDAdded,'F'];
					var rowsTrigger = client.querySync(queryToInsertTrigger,values);
					var triggerIdAdded=rowsTrigger[0].id;
					/*********Pg Query section*************/
					const queryToInsertTriggercontact="insert into triggers_trigger_contacts(trigger_id,contact_id) \
					values ($1,$2)";
					values=[triggerIdAdded,contactId];
					var rowsTriggerContact = client.querySync(queryToInsertTriggercontact,values);
				}
			}//End for
			resRequest.render('finish_createtrigger');
		}
		else//non contact available for this group return an error message
		{
			return resRequest.render('error', {
			menu:"error",error: 'Ce groupe ne contient pas des contacts!',
			});
		}
	});
	
	
	
	
	
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
