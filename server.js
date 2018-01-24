var express = require("express");
var bodyParser = require("body-parser"); 
var app = express(); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));  

var hostName = '127.0.0.1';
var port = 3000;
var room1 = {status: 0,meetings: []};
var room2 = {status: 0,meetings: []};
var current_time = '';
var getAllRoomsCurrentMeetings = function(){
    var room1_meeting = {};
    var room2_meeting = {};
    for(var i = 0; i < room1.meetings.length; i++){
    	var meeting = room1.meetings[i];
    	if(1 != date_compare(current_time,meeting.start_time) && 2 != date_compare(current_time,meeting.end_time)){
    		room1_meeting = meeting;
    		room1.status = 1;
    		break;
    	}
    }
    for(var i = 0; i < room2.meetings.length; i++){
    	var meeting = room2.meetings[i];
    	if(1 != date_compare(current_time,meeting.start_time) && 2 != date_compare(current_time,meeting.end_time)){
    		room2_meeting = meeting;
    		room2.status = 1;
    		break;
    	}
    }
    return {room1: room1_meeting,room2: room2_meeting};
}
function getAllRoomsInfo(){
	var allRooms = getAllRoomsCurrentMeetings();
	room1.current = allRooms.room1;
	room2.current = allRooms.room2;
	return {room1: room1,room2: room2};
}
var date_compare = function(time1,time2){//返回值: time1 比较 time2：1.早于 2.晚于 0.相等
	var time1_date_part = time1.split(' ')[0];
	var time1_time_part = time1.split(' ')[1];
	var time2_date_part = time2.split(' ')[0];
	var time2_time_part = time2.split(' ')[1];

	var time1_year = time1_date_part.split('-')[0];
	var time1_month = time1_date_part.split('-')[1];
	var time1_date = time1_date_part.split('-')[2];
	var time1_hour = time1_time_part.split(':')[0];
	var time1_minute = time1_time_part.split(':')[1];

	var time2_year = time2_date_part.split('-')[0];
	var time2_month = time2_date_part.split('-')[1];
	var time2_date = time2_date_part.split('-')[2];
	var time2_hour = time2_time_part.split(':')[0];
	var time2_minute = time2_time_part.split(':')[1];
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
	current_time = req.query.current_time;
	console.log("GET:当前时间："+current_time);
	var room1_meeting = getAllRoomsCurrentMeetings().room1;
    res.send({code: 200,room_info:getAllRoomsInfo()});
})

app.post("/",function(req,res){
	current_time = req.body.current_time;
    console.log("POST:当前时间："+current_time+",请求开始时间:"+req.body.start_time+",结束时间:"+req.body.end_time);

    var req_start_time = req.body.start_time;
	var req_end_time = req.body.end_time;

	if(req_start_time && req_end_time){
		if(1 == date_compare(req_start_time,current_time)){//TODO
			res.send({code: 300,msg: '预定会议开始时间不能早于现在'});
			return;
		}
	    if(1 == req.body.which_meeting_room){
	    	var room1_meeting = getAllRoomsCurrentMeetings().room1;
	    	//当前有会并且预定时间不合法
	    	if(1 == room1.status && 1 == date_compare(req_start_time,room1_meeting.end_time)){
	    		res.send({code: 300,msg: '预定会议时间不能与当前会议时间重叠'});
	    		return;
	    	}
	    	var other_meetings = room1.meetings.filter(meeting=>meeting.start_time != room1_meeting.start_time);
	    	//否则，验证预定时间是否与已在队列中的预定会议时间冲突
	    	for(var i = 0; i < other_meetings.length; i++){
	    		var meeting = other_meetings[i];
	    		console.log("ROOM1:队列中会议时间:"+meeting.start_time+"~"+meeting.end_time);
	    		if((1 == date_compare(req_start_time,meeting.start_time) && 2 != date_compare(req_end_time,meeting.start_time))||1 != date_compare(req_start_time,meeting.end_time)){
	    			
	    		}else{
	    			res.send({code: 300, msg: '预定会议时间不能与其他预定会议时间重叠'});
	    			return;
	    		}
	    	}
	    	//验证通过，可以预定
	    	room1.meetings.push({meeting_title: req.body.meeting_title, holder: req.body.holder, start_time: req_start_time, end_time: req_end_time});
	    	res.send({code: 200,msg:'会议室1预订成功',room1_info:room1});
	    }else if(2 == req.body.which_meeting_room){
	    	var room2_meeting = getAllRoomsCurrentMeetings().room2;
	    	//当前有会并且预定时间不合法
	    	if(1 == room2.status && 1 == date_compare(req_start_time,room2_meeting.end_time)){
	    		res.send({code: 300,msg: '预定会议时间不能与当前会议时间重叠'})
	    		return;
	    	}
	    	var other_meetings = room2.meetings.filter(meeting=>meeting.start_time != room2_meeting.start_time);
	    	//否则，验证预定时间是否与已在队列中的预定会议时间冲突
	    	for(var i = 0; i < other_meetings.length; i++){
	    		var meeting = other_meetings[i];
	    		console.log("ROOM2:队列中会议时间:"+meeting.start_time+"~"+meeting.end_time);
	    		if((1 == date_compare(req_start_time,meeting.start_time) && 2 != date_compare(req_end_time,meeting.start_time))||1 != date_compare(req_start_time,meeting.end_time)){
	    			
	    		}else{
	    			res.send({code: 300, msg: '预定会议时间不能与其他预定会议时间重叠'});
	    			return;
	    		}
	    	}
	    	//验证通过，可以预定
	    	room2.meetings.push({meeting_title: req.body.meeting_title, holder: req.body.holder, start_time: req_start_time, end_time: req_end_time});
	    	res.send({code: 200,msg:'会议室2预订成功',room2_info:room2});
	    }
	    
	}else{
		res.send({code: 300,msg: '预定会议不可以无开始或者结束时间'});
	}
});

app.listen(port,hostName,function(){

   console.log(`服务器运行在http://${hostName}:${port}`);

});