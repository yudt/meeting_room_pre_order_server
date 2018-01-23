var express = require("express");
var bodyParser = require("body-parser"); 
var app = express(); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));  
var hostName = '127.0.0.1';
var port = 3000;
var room1 = {status: 0,meetings: []};
var room2 = {status: 0,meetings: []};
var getAllRoomsCurrentMeetings = function(){
	var now = bjTime(new Date());
    var room1_meeting = {status: 2,left_time: 0};
    var room2_meeting = {status: 2,left_time: 0};
    for(var i = 0; i < room1.meetings.length; i++){
    	var meeting = room1.meetings[i];
    	if(now >= meeting.start_time && now <= meeting.end_time){
    		room1_meeting = meeting;
    		room1_meeting.status = 1;
    		room1_meeting.left_time = Number((meeting.end_time - now)/(60*1000)).toFixed(1);
    		break;
    	}
    }
    for(var i = 0; i < room2.meetings.length; i++){
    	var meeting = room2.meetings[i];
    	if(now >= meeting.start_time && now <= meeting.end_time){
    		room2_meeting = meeting;
    		room2_meeting.status = 1;
    		room2_meeting.left_time = Number((meeting.end_time - now)/(60*1000)).toFixed(1);;
    		break;
    	}
    }
    return {room1: room1_meeting,room2: room2_meeting};
}

function bjTime(time) {
    return new Date(time.getTime() + ((-480 - time.getTimezoneOffset()) * 60000));
}
var date_compare = function(time1,time2){//返回值: time1 比较 time2：1.早于 2.晚于 0.相等
	time1 = bjTime(new Date(time1));
	time2 = bjTime(new Date(time2));
	var time1_year = time1.getFullYear();
	var time1_month = time1.getMonth();
	var time1_date = time1.getDate();
	var time1_hour = time1.getHours();
	var time1_minute = time1.getMinutes();
	var time2_year = time2.getFullYear();
	var time2_month = time2.getMonth();
	var time2_date = time2.getDate();
	var time2_hour = time2.getHours();
	var time2_minute = time2.getMinutes();
	if(time1_year < time2_year){
		return 1;
	}else if(time1_year > time2_year){
		return 2;
	}
	if(time1_month < time2_month){
		return 1;
	}else if(time1_month > time2_month){
		return 2;
	}
	if(time1_date < time2_date){
		return 1;
	}else if(time1_date > time2_date){
		return 2;
	}
	if(time1_hour < time2_hour){
		return 1;
	}else if(time1_hour > time2_hour){
		return 2;
	}
	if(time1_minute < time2_minute){
		return 1;
	}else if(time1_minute == time2_minute){
		return 0;
	}else{
		return 2;
	}
} 

app.all('*', function(req, res, next) {  
    res.header("Access-Control-Allow-Origin", "*");  
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");  
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
    res.header("X-Powered-By",' 3.2.1')  
    res.header("Content-Type", "application/json;charset=utf-8");  
    next();  
});

//code: 200 成功, 300 业务逻辑出错, 400 服务器内部有问题
app.get("/",function(req,res){
	var room1_meeting = getAllRoomsCurrentMeetings().room1;
	console.log("当前日期:"+bjTime(new Date())+",当前会议时间:"+bjTime(new Date(room1_meeting.start_time))+"~"+bjTime(new Date(room1_meeting.end_time)));
    res.send({code: 200,hold_info:getAllRoomsCurrentMeetings()});
})

app.post("/",function(req,res){
	var now = bjTime(new Date());
    console.log("POST:当前时间：",now+",请求开始时间:"+bjTime(new Date(req.body.start_time))+",结束时间:"+bjTime(new Date(req.body.end_time)));

    var req_start_time = req.body.start_time;
	var req_end_time = req.body.end_time;

	if(req_start_time && req_end_time){
		if(1 == date_compare(req_start_time,now)){//TODO
			res.send({code: 300,msg: '预定会议开始时间不能早于现在'});
			return;
		}
	    if(1 == req.body.which_meeting_room){
	    	var room1_meeting = getAllRoomsCurrentMeetings().room1;
	    	//当前有会并且预定时间不合法
	    	if(1 == room1_meeting.status && 1 == date_compare(req_start_time,room1_meeting.end_time)){
	    		res.send({code: 300,msg: '预定会议时间不能与当前会议时间重叠'});
	    		return;
	    	}
	    	//否则，验证预定时间是否与已在队列中的预定会议时间冲突
	    	for(var i = 0; i < room1.meetings.length; i++){
	    		var meeting = room1.meetings[i];
	    		console.log("队列中会议时间:"+bjTime(new Date(meeting.start_time))+"~"+bjTime(new Date(meeting.end_time)));
	    		if((1 == date_compare(req_start_time,meeting.start_time) && 1 == date_compare(req_end_time,meeting.start_time))||2 == date_compare(req_start_time,meeting.end_time)){
	    			
	    		}else{
	    			res.send({code: 300, msg: '预定会议时间不能与其他预定会议时间重叠'});
	    			return;
	    		}
	    	}
	    	//验证通过，可以预定
	    	room1.meetings.push({meeting_title: req.body.meeting_title, holder: req.body.holder, start_time: req_start_time, end_time: req_end_time});
	    	res.send({code: 200,msg:'会议室1预订成功'});
	    }else if(2 == req.body.which_meeting_room){
	    	var room2_meeting = getAllRoomsCurrentMeetings().room2;
	    	//当前有会并且预定时间不合法
	    	if(1 == room2_meeting.status && 1 == date_compare(req_start_time,room2_meeting.end_time)){
	    		res.send({code: 300,msg: '预定会议时间不能与当前会议时间重叠'})
	    		return;
	    	}
	    	//否则，验证预定时间是否与已在队列中的预定会议时间冲突
	    	for(var i = 0; i < room2.meetings.length; i++){
	    		var meeting = room2.meetings[i];
	    		if((1 == date_compare(req_start_time,meeting.start_time) && 1 == date_compare(req_end_time,meeting.start_time))||2 == date_compare(req_start_time,meeting.end_time)){
	    			
	    		}else{
	    			res.send({code: 300, msg: '预定会议时间不能与其他预定会议时间重叠'});
	    			return;
	    		}
	    	}
	    	//验证通过，可以预定
	    	room2.meetings.push({meeting_title: req.body.meeting_title, holder: req.body.holder, start_time: req_start_time, end_time: req_end_time});
	    	res.send({code: 200,msg:'会议室2预订成功'});
	    }
	    
	}else{
		res.send({code: 300,msg: '预定会议不可以无开始或者结束时间'});
	}
});


app.listen(port,hostName,function(){

   console.log(`服务器运行在http://${hostName}:${port}`);

});