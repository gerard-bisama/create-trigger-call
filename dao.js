var mongoose = require('mongoose');
//var autoIncrement = require('mongoose-auto-increment'); 
 
mongoose.connect('mongodb://localhost:27017/rptrigger');
var Schema=mongoose.Schema;

var Counter = new Schema({
  groupName:String,
  count: {type:Number,default:0}
});

//autoIncrement.initialize(mongoose.connection);
var Counter = mongoose.model('Counter', Counter);

var saveGroupInfo=function (_groupeName,callback)
{
	var groupToAdd=new Counter({groupName:_groupeName});
	var requestResult=groupToAdd.save(function(err,result){
		if(err) return handleError(err);
		if(result!==null) 
		{
			return callback(true);
		}
		else
		{
			return callback(false);
		}
	});
}
var updateCounter=function(_groupeName,callback)
{
	var requestResult=Counter.update({"groupName":_groupeName},{$inc: {count:1}},function(error,res){
		if(error)
		{
			console.error(error);
			return callback(-1);
		} 
		return callback(true);
	});
}
var getCounter	= function(_groupeName,callback){
	var requestResult=Counter.findOne({"groupName":_groupeName}).exec(function(error,msgs){
		if(error) return handleError(err);
		return callback(msgs.count);
		});
}
exports.saveGroupInfo=saveGroupInfo;
exports.updateCounter=updateCounter;
exports.getCounter=getCounter;
