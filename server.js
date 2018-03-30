var express = require('express');
var path = require('path');
var app = express();
var fs = require("fs");
var bodyParser=require('body-parser')
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

//Variable initialization
const URLRAPIDROAPI ="http://localhost:8000/api/v2";
var tokenRP="Authorization: Token "+ "df2b0dc9ba1a030c221777b8cdcb9455f6f7db2b";

// set the view engine to ejs
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
const offsetTimeZone=1";


//function section
function incrementHoursByOffSet(originalDate)
{
	if(originalDate.includes("T")==true)
	{
		var dateComponants=dateCorrected.split("T"); 
		var partTime=dateComponants[1];   
		var hours= partTime.split(":")[0]; 
		var modifierHours=parseInt(hours)+1;
	}
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
	request.setRequestHeader('Authorization','Token df2b0dc9ba1a030c221777b8cdcb9455f6f7db2b');
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
function getListOfFlows(callback)
{
	var urlRequest=`${URLRAPIDROAPI}/flows.json`;
	var request = new XMLHttpRequest();
	request.open('GET',urlRequest, true);
	request.setRequestHeader('Content-Type','application/json');	
	//request.setRequestHeader(tokenRP);
	request.setRequestHeader('Authorization','Token df2b0dc9ba1a030c221777b8cdcb9455f6f7db2b');
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
	request.setRequestHeader('Authorization','Token df2b0dc9ba1a030c221777b8cdcb9455f6f7db2b');
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
app.get('/', function(req, res) {
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
    //res.render('index',{groups:groups});
});
app.post('/startflows', function(req, res) {
	//console.log(req.body)
	var groupUID=req.body.group_select;
	var flowUID=req.body.flow_select;
	var interval= parseInt(req.body.interval_select);
	//var currentDate=new Date();
	//console.log(interval)
	const { Pool, Client } = require('pg');
	const connectionString = 'postgresql://temba:temba@localhost:5432/temba'
	getListOfContact(groupUID,function(listContacts)
	{
		var contacts=[];
		contacts=listContacts;
		var contactIDToAdd=[];
		var flowid=-1;
		//console.log("Flow id :"+flowUID);
		//build query string
		var queryString='';
		for(var i=0;i<contacts.length;i++)
		{
			if(i==0)
			{
				queryString+='\''+contacts[i].uuid+'\'';
			}
			else
			{
				queryString+=',\''+contacts[i].uuid+'\'';
			}
			
		}
		const client = new Client({connectionString: connectionString,});
		client.connect();
		//console.log('SELECT id,uuid from contacts_contact where  uuid in ('+queryString+')');
		
		client.query('SELECT id,uuid from flows_flow where  uuid = \''+flowUID+'\'', (err, res) => {
			if(err)
			{
				console.log(err, res)
			}
			else
			{
				//console.log(res.rows)
				for(var j=0;j<res.rows.length;j++)
				{
					flowid=res.rows[j].id;
				}
				
				client.query('SELECT id,uuid from contacts_contact where  uuid in ('+queryString+')', (err, res) => {
					if(err)
					{
						console.log(err, res)
					}
					else
					{
						var currentDate=new Date();
						console.log(currentDate);
						//console.log(res.rows)
						for(var j=0;j<res.rows.length;j++)
						{
							
							
							var contactId=res.rows[j].id;
							//console.log("Contact_id "+contactId);
							//Check if the contact for this flow has been already scheduled
							client.query('select tgt.schedule_id,tgc.contact_id as contact_id from triggers_trigger as tgt \
								join schedules_schedule as sch on sch.id=tgt.schedule_id \
								join triggers_trigger_contacts as tgc on tgc.trigger_id=tgt.id \
								where tgt.flow_id='+flowid+' and tgc.contact_id='+contactId
							, (err, res) => {
								if(err)
								{
									console.log(err, res)
								}
								else
								{
									//console.log(res.rows)
									var scheduleId=-1;
									if(res.rows.length>0)
									{
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
											console.log(formatedDate);
											const queryToUpdate="update schedules_schedule set  next_fire=$1,modified_on=$2 where id=$3";
											var values =[formatedDate,logDate,scheduleId]
											/*
											client.query(queryToUpdate,values
											, (err, res) => {
												if(err)
												{
													console.log(err, res)
												}
												else
												{
													console.log(res.rowCount);
												}
											});*/
										}
										
									}
									else
									{
										console.log("Add new entry!!");
									}
									//console.log(scheduleId);
								}
							});
							
						}//End for
						//console.log("flow id :"+flowid);
					}
				});
				//console.log(contactIDToAdd);
			}
			
		  
		  //client.end()
		});
		
	});
	
	res.send(200);
});

app.listen(8001);
console.log('App running on port 8001');
