//DEFINE ARRAY FUNCTIONALITIES
Array.prototype.remove = function(ele){
	var index = this.indexOf(ele);
	if (index != -1)
		this.splice(index, 1);
	return index;
}
Array.prototype.removeIndex = function(index){
	if (index >= 0 && index < this.length){
		this.splice(index, 1);
		return true;
	}
	return false;
}
Array.prototype.find = function(ele){
	var index = this.indexOf(ele);
	if (index == -1)
		return null;
	return ele;
}

Array.prototype.shuffle = function() {
	var len = this.length;
	var i = len;
	while (i--) {
		var p = parseInt(Math.random()*len);
		var t = this[i];
		this[i] = this[p];
		this[p] = t;
	}
	return this;
};

Array.prototype.clone = function(){
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};


function sortASC(a, b){return a-b};


var app = require('http').createServer(handler),
		url = require('url'),
		path = require('path'),
		io = require('socket.io').listen(app),
		fs = require('fs'),
		mime = require('mime'),
		utils = require('./utils.js');

//DB Connection setting
/*
var Client = require('mysql').Client;
var client = new Client();
client.user = 'secury';
client.password = 'dlwhdals';
client.database = 'secury_dalmuti';
*/

var port = process.env.PORT || 3783;
app.listen(port);
console.log("Listening on " + port);

function handler (req, res) { //http server handler 
	var uri = url.parse(req.url).pathname; 
	var filename = path.join(process.cwd(), uri);
	var user_agent = req.headers['user-agent'];
	var not_support = (/msie 6.0/i.test(user_agent)) || (/msie 7.0/i.test(user_agent)) || (/msie 8.0/i.test(user_agent));

	//supporting browser
	if (uri == "/"){
		//not supporting browser
		if (not_support){
			fs.readFile(__dirname + "/not_support.htm", function(err, data){
				if (err){
					res.writeHead(200);
					return res.end("ERROR");
				}
				res.writeHead(200, {'Content-Type' : mime.lookup(__dirname + "/not_support.htm")});
				res.end(data);
			});
		}
		else{
			fs.readFile(__dirname + "/dalmuti.htm", function(err, data){
				if (err){
					res.writeHead(200);
					return res.end("ERROR");
				}
				res.writeHead(200, {'Content-Type' : mime.lookup(__dirname + "/dalmuti.htm")});
				res.end(data);
			});
		}
	}
	else{
		fs.readFile(__dirname + uri, function(err, data){
			if (err){
				res.writeHead(200);
				return res.end("ERROR");
			}
			//write header
			var filestat = fs.statSync(filename);
			var filemime = mime.lookup(filename);
			if (filemime == "audio/mpeg" || filemime == "audio/ogg"){
				var range = req.headers.range || ("bytes=0-" + (data.length-1));
				var total = data.length; 
				var parts = range.replace(/bytes=/, "").split("-"); 
				var partial_start = parts[0]; 
				var partial_end = parts[1]; 

				var start_index = parseInt(partial_start); 
				var end_index = (partial_end ? parseInt(partial_end) : total-1);
				var chunksize = (end_index - start_index) + 1;
				//console.log(req.headers);
				//console.log(filename);

				var header = {
					"Accept-Ranges": "bytes", 
					"Content-Range": "bytes " + start_index + "-" + end_index + "/" + total, 
					"Content-Length": chunksize,

					'Content-Type' : filemime,
					'Transfer-Encoding' : "chunked",
					//'Content-Length' : filestat.size
				};
				//console.log(header);
				//console.log("-------------------");

				res.writeHead(206, header);
				res.end(data.slice(start_index, end_index+1));
			}
			else {
				res.writeHead(200, {
					'Content-Type' : filemime,
					'Content-Length' : filestat.size
				});
				res.end(data);
			}
		});
	}
}

function get_user_by_uid(uid)
{
	for (var i=0;i<users.length;i++){
		if (users[i].uid == uid)
			return users[i];
	}
	return null;
}

function get_room_by_rid(rid)
{
	for (var i=0;i<rooms.length;i++){
		if (rooms[i].rid == rid)
			return rooms[i];
	}
	return null;
}

//Card object
function Card(options){
	options = options || {};
	this.number = options["number"];
	this.uid = options["uid"];
}

//Room object
function Room(options){
	options = options || {};
	this.rid = utils.SHA1(String(new Date()) + String(Math.random()));
	this.number = room_cnt++;
	this.title = options["title"];
	this.master = get_user_by_uid(options.master_uid); //creator
	this.users = []; //connected users in this room
	this.capacity = 10; //maximum # of users
	this.state = 0; //0:waiting, 1:playing(choosing cards to send), 2:playing
	this.turn = 0; //index of user
	this.turn_master = 0; //who was first at this turn? (user index)
	this.previous_cards = [];
	this.previous_show_cards = []; //not empty, not related to game process, just for showing
	this.cards = [];
	this.ranking_count = 1;
	this.timer; //setTimeout variable
	this.timer_seconds = 30;
	this.password = options["password"] || "";
	this.is_secret = options["is_secret"] || false;
	this.allowing_observer = options["allowing_observer"] || false;
	//console.log(options);
	//console.log(this);

	//init cards
	for (var i=1;i<=12;i++){
		for (var j=1;j<=i;j++)
			this.cards.push(new Card({number:i}));
	}
	this.cards.push(new Card({number:13}));
	this.cards.push(new Card({number:13}));

	//setMaster
	this.setMaster = function(){
		this.master = this.users[0];
	};

	//Enter user
	this.enterUser = function(user){
		this.users.push(user);
		this.setMaster();

		clean_users();
		broadcast_room_list();
		broadcast_lobby_user_list();
		this.broadcastUserInfo();
		this.broadcastRoomInfoMessage("<" + user.nickname + "> came.");
	};

	//get status (king ? peon ?)
	this.getStatus = function(user){
		for (var i=0;i<this.users.length;i++){
			if (this.users[i].uid == user.uid){
				if (this.users.length == 4 && (i == 1 || i == 2)) return 3;
				else if (i == 0) return 1; //GD
				else if (i == this.users.length - 1) return 5; //GB
				else if (i == 1) return 2; //LD
				else if (i == this.users.length - 2) return 4; //LB
				else return 3; //normal
			}
		}
	};

	//Start game
	this.startGame = function(init){
		if (init){
			//init user ranking, taxation cards
			for (var i=0;i<this.users.length;i++){
				this.users[i].ranking = 100;
				this.users[i].taxation_cards = [];
				if (i == 0 || i == 1 || i == this.users.length -1 || i == this.users.length - 2)
					this.users[i].taxation_complete = false;
				else
					this.users[i].taxation_complete = true;
				if (this.users.length == 4 && (i == 1 || i == 2)) //exception for 4 players
					this.users[i].taxation_complete = true;
				
			}
			this.ranking_count = 1;
			
			//Distribute cards
			var user_count = this.users.length;
			var user_p = user_count*800 - 1;
			this.cards.shuffle();
			for (var i=0;i<80;i++){
				this.cards[i].uid = this.users[(user_p--) % user_count].uid;
			}
			//////////////////for revolution test
			//this.cards[79].uid = this.users[this.users.length - 1].uid;
			//this.cards[78].uid = this.users[this.users.length - 1].uid;
			//////////////////for revolution test

			//Decide state
			this.state = 1; //Taxation time
			if (user_count < 4)
				this.state = 2; //Really game start!
			//this.state = 1; //just for test.. this will be deleted!!
			this.turn = 0;
			this.turn_master = 0;
			this.previous_cards = [];
		}

		if (this.state == 2){
			var thisRoom = this;
			this.timer = setTimeout(function(){
				thisRoom.changeTurn([]);
			}, this.timer_seconds * 1000 + 3000);
		}

		//broadcast user game started
		for (var i=0;i<this.users.length;i++){
			this.users[i].socket.emit('start_game_complete', {
				init:init,
				state:this.state, 
				status:this.getStatus(this.users[i]),
				turn:this.users[this.turn].uid,
				nickname:this.users[this.turn].nickname,
				turn_master:this.users[this.turn_master].uid,
				previous_cards:this.previous_cards,
				cards:get_card_list(this.users[i].uid), 
				users:this.users.map(function(user){
					return {
						uid:user.uid,
						nickname:user.nickname
					};
				}),
				timer_seconds:this.timer_seconds,
			});
			this.users[i].sendCardList();
		}
		broadcast_room_list();

	};

	this.endGame = function(){
		//clear timer
		clearTimeout(this.timer);

		//Make leaderboard
		this.users.sort(function(a, b){
			return a.ranking - b.ranking;
		});
		for (var i=0;i<this.users.length;i++){
			this.users[i].socket.emit('end_game', {
				leaderboard:this.users.map(function(user){ return {uid:user.uid, nickname:user.nickname}; })
			});
		}
		this.state = 0;
		this.setMaster();
		broadcast_room_list();
		this.broadcastUserInfo();
	};

	//Change turn
	this.changeTurn = function(cards){
		//set timeout (30 seconds)
		if (this.timer)
			clearTimeout(this.timer);
		var thisRoom = this;
		this.timer = setTimeout(function(){
			thisRoom.changeTurn([]);
		}, this.timer_seconds * 1000);

		var current_turn_master = this.turn_master;
		//console.log('CHANGE TURN');

		//change turn_master if prev turn master ends the game..
		if (this.users[this.turn_master].ranking != 100 && cards.length == 0){
			while (1){
				this.turn_master = (this.turn_master + 1) % this.users.length; //increase turn
				if (this.users[this.turn_master].ranking == 100) break;
			}
		}

		//is there any users newly ended?
		//console.log('RANKING');
		for (var i=0;i<this.users.length;i++){
			var user = this.users[i];
			var end = true;
			if (user.ranking != 100) end = false;
			for (var j=0;j<this.cards.length;j++){
				if (this.cards[j].uid == user.uid) end = false;
			}
			if (end){
				user.ranking = this.ranking_count++;
			}
		}

		//is game ended?
		var playing_user_count = 0;
		for (var i=0;i<this.users.length;i++){
			if (this.users[i].ranking == 100) playing_user_count++;
		}
		if (playing_user_count <= 1){
			this.endGame();
		}

		while (1){
			this.turn = (this.turn + 1) % this.users.length; //increase turn
			if (this.users[this.turn].ranking == 100) break;
		}
		this.previous_cards = cards.sort(sortASC);
		//set previous_show_cards
		if (this.turn == current_turn_master)
			this.previous_show_cards = [];
		else if (this.previous_cards.length > 0)
			this.previous_show_cards = this.previous_cards;

		for (var i=0;i<this.users.length;i++){
			this.users[i].socket.emit('change_turn', {
				turn:this.users[this.turn].uid,
				nickname:this.users[this.turn].nickname,
				turn_master:this.users[this.turn_master].uid,
				turn_master_nickname:this.users[this.turn_master].nickname,
				previous_cards:this.previous_show_cards,
				previous_cards_genuine:this.previous_cards,
				cards:get_card_list(this.users[i].uid),
				timer_seconds:this.timer_seconds,
			});
		}
	};

	//Quit user
	this.quitUser = function(user){
		//Ready state
		if (this.state == 0){
			if (this.users.remove(user) != -1){
				this.setMaster();
				//room remove!
				if (this.users.length == 0)
					rooms.remove(this);

				//console.log('USER QUIT FROM ROOM');
			}
		}
		//Taxation time
		else if (this.state == 1){
			if (this.users.remove(user) != -1){
				this.setMaster();
				//room remove!
				if (this.users.length == 0)
					rooms.remove(this);

				//console.log('USER QUIT FROM ROOM - taxation time');
			}
			this.endGame();
		}
		//Game state
		else if (this.state == 2){
			var turn_master_uid = this.users[this.turn_master].uid;
			var quit_user_index;
			if ((quit_user_index = this.users.remove(user)) != -1){
				//A [B] C -> when A quit, turn should be maintained to B.
				if (this.turn > quit_user_index){
					this.turn--;
				}
				
				//set turn and turn master
				this.turn = (this.turn % this.users.length);
				if (user.uid == turn_master_uid)
					this.turn_master = this.turn;
				else {
					for (var i=0;i<this.users.length;i++){
						if (this.users[i].uid == turn_master_uid)
							this.turn_master = i;
					}
				}

				this.setMaster();
				//room remove!
				if (this.users.length == 0)
					rooms.remove(this);
				else {
					/*
					//Distribute cards which this user has
					this.cards.shuffle();
					var distribution_result = {}; //{uid:[cards]}
					var user_count = this.users.length;
					var user_p = user_count*800 - 1;
					var card_count = 0;
					var each_user_card_count = {};
					//init each_user_card_count
					for (var i=0;i<this.users.length;i++)
						each_user_card_count[this.users[i].uid] = 0;
					//
					for (var i=0;i<80;i++){
						if (this.cards[i].uid == user.uid){
							if (!distribution_result[this.users[(user_p) % user_count].uid]) //if null
								distribution_result[this.users[(user_p) % user_count].uid] = [];
							distribution_result[this.users[(user_p) % user_count].uid].push(this.cards[i].number);
							this.cards[i].uid = this.users[(user_p--) % user_count].uid;

							each_user_card_count[this.cards[i].uid]++;
							card_count++;
						}
					}

					function process_distribution_result(distribution_result, uid)
					{
						var result = {my_cards:[], other_cards:{}}; //other_cards = array of {uid:number}
						for (dis_uid in distribution_result){
							if (dis_uid == uid)
								result.my_cards = distribution_result[dis_uid].sort(sortASC);
							else
								result.other_cards[dis_uid] = distribution_result[dis_uid].length;
						}
						return result;
					}
					*/
					var card_count = 0;
					for (var i=0;i<80;i++){
						if (this.cards[i].uid == user.uid){
							card_count++;
							this.cards[i].uid = 0; //added 12.03.05
						}
					}

					//reset timer
					if (this.timer)
						clearTimeout(this.timer);
					var thisRoom = this;
					this.timer = setTimeout(function(){
						thisRoom.changeTurn([]);
					}, this.timer_seconds * 1000);

					for (var i=0;i<this.users.length;i++){
						this.users[i].socket.emit('game_quit_user', {
							uid:user.uid, 
							card_count:card_count, 
							//distribution_result:process_distribution_result(distribution_result, this.users[i].uid), 
							//each_user_card_count:each_user_card_count,
							turn:this.users[this.turn].uid,
							nickname:this.users[this.turn].nickname,
							turn_master:this.users[this.turn_master].uid,
							previous_cards:this.previous_cards,
							users:this.users.map(function(user){
								return {
									uid:user.uid,
									nickname:user.nickname
								};
							}),
							timer_seconds:this.timer_seconds,
						});
					}
					//console.log('===QUIT ROOM(DISTRIBUTE CARDS)');

					//is game ended?
					var playing_user_count = 0;
					for (var i=0;i<this.users.length;i++){
						if (this.users[i].ranking == 100) playing_user_count++;
					}
					if (playing_user_count <= 1){
						this.endGame();
					}
					//end game
				}
			}
		}
		broadcast_room_list();
		this.broadcastUserInfo();
		this.broadcastRoomInfoMessage("<" + user.nickname + "> left.");
	};

	//Broadcast users info
	this.broadcastUserInfo = function(){
		for (var i=0;i<this.users.length;i++){
			this.users[i].socket.emit('room_user_info', this.users.map(function(user){
				return {
					uid:user.uid,
					nickname:user.nickname
				};
			}));
		}
	};
	
	this.broadcastRoomChatMessage = function(data){
		var sender = get_user_by_uid(data.uid);
		if (sender){
			for (var i=0;i<this.users.length;i++){
				this.users[i].socket.emit('room_chat_message', {
					uid:sender.uid,
					nickname:sender.nickname,
					message:data.message
				});
			}
		}
	};

	this.broadcastRoomInfoMessage = function(message){
		for (var i=0;i<this.users.length;i++){
			this.users[i].socket.emit('room_info_message', {
				message:message
			});
		}
	};

	this.getProgress = function(){
		var count = 0;
		for (var i=0;i<this.cards.length;i++){
			if (this.cards[i].uid == 0) count++;
		}
		return parseInt(count/80*100);
	};

	this.getStateString = function(){
		if (this.state == 0) return "Waiting";
		else return "Playing";
	};

	this.revolution = function(){
		this.users.reverse();
		this.broadcastUserInfo();
		this.state = 2;
		this.startGame(false);

		for (var i=0;i<this.users.length;i++){
			this.users[i].socket.emit('revolution_complete', {
				message:"Revolution took place!"
			});
		}
	};
}

//User object
function User(options){
	options = options || {};
	this.socket = options["socket"];
	this.uid = options["uid"];
	this.nickname = options["nickname"];
	this.where = "0"; //0 : lobby, else : room_id
	this.ranking = 100; //game ranking
	this.taxation_cards = [];
	this.taxation_complete = false;

	//Send room list
	this.sendRoomList = function(){
		this.socket.emit('room_list', rooms.map(function(room){
			return {
				rid:room.rid,
				number:room.number,
				title:room.title,
				is_secret:room.is_secret,
				master:(room.master) ? {uid:room.master.uid, nickname:room.master.nickname} : {uid:null, nickname:null}, 
				users:room.users.map(function(user){return {uid:user.uid, nickname:user.nickname}}),
				state:room.getStateString(),
				capacity:room.capacity,
				progress:room.getProgress()
			};
		}));
	};
	//Send connecting users count
	this.sendUserCount = function(){
		this.socket.emit('connecting_users_count', {count: users.length});
	};

	//Send lobby users
	this.sendLobbyUserList = function(){
		var lobby_users = [];
		for (var i=0;i<users.length;i++){
			if (users[i].where == "0")
				lobby_users.push(users[i]);
		}
		this.socket.emit('lobby_user_list', lobby_users.map(function(user){return {nickname:user.nickname, uid:user.uid}}));
	};

	//Enter room
	this.enterRoom = function(room){
		if (!room){
			this.socket.emit('enter_room_fail', {message:"There is no such room"});
			console.log('ENTER ROOM FAIL - 1');
		}
		else if (room.state != 0){
			this.socket.emit('enter_room_fail', {message:"The room is already started"});
			console.log('ENTER ROOM FAIL - 2');
		}
		else if (room.users.length >= room.capacity){
			this.socket.emit('enter_room_fail', {message:"The room was full"});
			console.log('ENTER ROOM FAIL - 3');
		}
		else if (this.where != "0"){
			this.socket.emit('enter_room_fail', {message:"You are already in some other room"});
			console.log('ENTER ROOM FAIL - 3');
		}
		else {
			room.enterUser(this);
			this.where = room.rid;
			this.socket.emit('enter_room_complete', {
				rid: room.rid, 
				number: room.number, 
				title: room.title, 
				master:(room.master) ? {uid:room.master.uid, nickname:room.master.nickname} : {uid:null, nickname:null}, 
				users: room.users.map(function(user){return {uid:user.uid, nickname:user.nickname}})
			});
		}
		broadcast_lobby_user_list();
	}

	//Quit room
	this.quitRoom = function(){
		console.log('USER.QUIT_ROOM');
		var room = get_room_by_rid(this.where);
		if (room)	room.quitUser(this);
		this.where = "0";
		this.socket.emit('quit_room_complete', {message:"OK"}); //Room to lobby
		this.sendRoomList();
		broadcast_lobby_user_list();

		return room;
	};

	//Send card list
	this.sendCardList = function(){
		this.socket.emit('card_list', get_card_list(this.uid));
	};

	//Kick 
	this.kickRoom = function(){
		this.socket.emit('kick_message', {message:"You got kicked."});
		this.quitRoom();
	};

	//sendAdminMessage
	this.sendAdminMessage = function(message){
		this.socket.emit('set_admin_message', {message:String(message)});
	};
}

var users = [];
var rooms = [];
var room_cnt = 1;
var admin_message_text = "";
function broadcast_connecting_users()
{
	console.log("BROADCAST CONNECTING USERS");
	//console.log(users);
	//broadcast # of connecting users to clients
	for (var i=0;i<users.length;i++){
		users[i].sendUserCount();
	}
}

function broadcast_lobby_user_list()
{
	for (var i=0;i<users.length;i++){
		if (users[i].where == "0")
			users[i].sendLobbyUserList();
	}
}

function broadcast_room_list()
{
	console.log("BROADCAST CONNECTING ROOMS");
	//console.log(rooms);
	for (var i=0;i<users.length;i++){
		var user = users[i];
		if (user.where == "0"){
			user.sendRoomList();
		}
	}
}

function broadcast_lobby_chat_message(data)
{
	var sender = get_user_by_uid(data.uid);
	if (sender){
		for (var i=0;i<users.length;i++){
			if (users[i].where == "0"){
				users[i].socket.emit('lobby_chat_message', {
					uid:sender.uid,
					nickname:sender.nickname,
					message:data.message
				});
			}
		}
	}
}

function clean_users()
{
	var deleted = false;
	var flag;
	do {
		flag = false;
		for (var i=0;i<users.length;i++){
			if (users[i].socket.disconnected){
				if (users[i].where != "0"){
					var room = users[i].quitRoom();
					if (room && !room.users.find(users[i]))
						users.removeIndex(i);
				}
				else {
					users.removeIndex(i);
				}
				flag = true;
				deleted = true;
			}
		}
	}while(flag);

	if (deleted){
		broadcast_connecting_users();
		broadcast_lobby_user_list();
		broadcast_room_list();
	}
}

setInterval(clean_users, 1000);

function get_card_list(uid)
{
	//result : {my_cards:[cards], other_cards:{{uid:count, uid:count ... }}}
	var user = get_user_by_uid(uid);
	var room = get_room_by_rid(user.where);
	if (room){
		var cards = {};
		var result = {my_cards:[], other_cards:{}};
		for (var i=0;i<room.cards.length;i++){
			if (!cards[ room.cards[i].uid ])
				cards[ room.cards[i].uid ] = [room.cards[i].number];
			else
				cards[ room.cards[i].uid ].push(room.cards[i].number);
		}
		//order by card number
		for (hash_key in cards){
			cards[hash_key].sort(sortASC); //ascending integer sort
			if (hash_key == uid)
				result.my_cards = cards[hash_key];
			else
				result.other_cards[hash_key] = cards[hash_key].length;
		}
		return result;
	}
	return null;
}

function broadcast_admin_message(message)
{
	for (var i=0;i<users.length;i++){
		users[i].sendAdminMessage(message);
	}
}

io.sockets.on('connection', function (socket) {
	socket.emit('init_client', {count: users.length });

	//ENTER LOBBY
  socket.on('enter_lobby', function (data) {
		if (!get_user_by_uid(data.uid)){
			//저장된 소켓이 없을 때에만 저장!
			var user = new User({
					socket : socket,
					uid : data.uid,
					nickname : data.nickname
				})
			users.push(user);
			socket.emit('enter_lobby_complete', {message:"OK"});
			clean_users();
			broadcast_connecting_users();
			broadcast_lobby_user_list();

			//Send room_list to user that is connected now
			user.sendRoomList();
			user.sendAdminMessage(admin_message_text);
		}
		else {
			console.log('error : duplicated connection');
			socket.emit('error', {message:'duplicated connection'});
		}
  });

	//CREATE ROOM
	socket.on('create_room', function(data){
			console.log(data);
		var room = new Room({
			title:data.title,
			master_uid:data.uid,
			uid:data.uid,
			is_secret:data.is_secret,
			password:data.password,
			uid:data.password,
			allowing_observer:data.allowing_observer
		});
		rooms.push(room);
		socket.emit('create_room_complete', {rid:room.rid});
		clean_users();
		broadcast_room_list();
	});

	//ENTER ROOM
	socket.on('enter_room', function(data){
		console.log('===ENTER ROOM!');
		var user = get_user_by_uid(data.uid);
		var room = get_room_by_rid(data.rid);

		if (!user)
			socket.emit('error', {message:'Disconnected'});
		else if (room.master && room.master.uid != user.uid && room.is_secret && room.password != data.password){
			user.socket.emit('enter_room_fail', {message:"Password is incorrect"});
			console.log('ENTER ROOM FAIL - PW');
		}
		else
			user.enterRoom(room);
		console.log('===ENTER ROOM END');
	});

	//QUIT ROOM
	socket.on('quit_room', function(data){
		console.log('====QUIT ROOM!');
		var user = get_user_by_uid(data.uid);
		user.quitRoom();
	});

	//DISCONNECT
	socket.on('disconnect', function(){
		console.log("USER DISCONNECT");
		clean_users();
	});

	//LOBBY CHAT
	socket.on('input_lobby_chat_message', function(data){
		broadcast_lobby_chat_message(data);
	});

	//ROOM CHAT
	socket.on('input_room_chat_message', function(data){
		var room = get_room_by_rid(data.rid);
		if (room) room.broadcastRoomChatMessage(data);
	});

	//GAME START
	socket.on('start_game', function(data){
		console.log('START GAME SOCKET');
		var user = get_user_by_uid(data.uid);
		var room = get_room_by_rid(data.rid);

		if (user && room){
			if (room.users.length <= 1){
				socket.emit('start_game_fail', {message:"At least two players are needed"});
			}
			else if (room.master != user){
				socket.emit('start_game_fail', {message:"Only master of the room can start the game"});
			}
			else if (room.state != 0){
				socket.emit('start_game_fail', {message:"Game was already started"});
			}
			else{
				room.startGame(true);
			}
		}
	});

	//IN GAME
	socket.on('submit_card', function(data){
		var user = get_user_by_uid(data.uid);
		var room = get_room_by_rid(data.rid);
		var room_cards = room.cards;
		var cards = data.cards.clone();

		if (user && room && room.state == 2){
			var tmp_uid = utils.SHA1(String(new Date()) + String(Math.random()));
			var is_all_same = true;
			var is_owned = true; 
			var is_same_length = (data.cards.length == room.previous_show_cards.length);
			var is_smaller = true;
			var is_your_turn = (room.users[room.turn].uid == data.uid);
			//check whether all cards have same number
			cards = data.cards.clone().sort(sortASC); //given cards
			var given_card_number = cards[0]; //number of given cards
			cards = cards.map(function(card){if(card == 13) return given_card_number; else return card}); //jocker(13) is exception
			for (var i=0;i<cards.length-1;i++){
				if (cards[i] != cards[i+1]) is_all_same = false;
			}
			is_smaller = (parseInt(room.previous_show_cards[0]) > parseInt(given_card_number));
			
			//check whether the user has given cards
			cards = data.cards.clone().sort(sortASC); //given cards
			while (cards.length > 0){
				var number = cards[0];
				var is_found = false;
				for (var i=0;i<room_cards.length;i++){
					var room_card = room_cards[i];
					if (room_card.uid == user.uid && room_card.number == number){
						is_found = true;
						room_card.uid = tmp_uid;
						break;
					}
				}
				if (!is_found) {is_owned = false; break;}
				cards.removeIndex(0);
			}

			function rollback_from_tmp_to_origin_uid()
			{
				//rollback from tmp_uid to user_uid
				for (var i=0;i<room_cards.length;i++){
					if (room_cards[i].uid == tmp_uid)
						room_cards[i].uid = user.uid;
				}
			}
			if (!is_your_turn){
				rollback_from_tmp_to_origin_uid()
				socket.emit('submit_card_fail', {message:"Not your turn"});
			}
			else if (!is_owned){
				rollback_from_tmp_to_origin_uid()
				socket.emit('submit_card_fail', {message:"You don't have these cards."});
			}
			else if (room.turn_master != room.turn && room.previous_show_cards.length > 0){
				//pass!
				if (data.cards.length == 0){
					room.changeTurn(data.cards);
				}
				//
				else if (!is_same_length){
					rollback_from_tmp_to_origin_uid()
					socket.emit('submit_card_fail', {message:"You have to submit " + room.previous_show_cards.length + " cards"});
				}
				else if (!is_smaller){
					rollback_from_tmp_to_origin_uid()
					socket.emit('submit_card_fail', {message:"You have to submit cards smaller than given ones"});
				}
				else if (!is_all_same){
					rollback_from_tmp_to_origin_uid()
					socket.emit('submit_card_fail', {message:"You have to submit cards that all have same number"});
				}
				else {
					//delete given cards from room cards
					for (var i=0;i<room_cards.length;i++){
						if (room_cards[i].uid == tmp_uid)
							room_cards[i].uid = 0;
					}
					//if you submit cards, you will be a turn master
					if (data.cards.length > 0){
						for (var i=0;i<room.users.length;i++){
							if (user.uid == room.users[i].uid)
								room.turn_master = i;
						}
					}
					room.changeTurn(data.cards);
				}
			}
			else {
				//delete given cards from room cards
				for (var i=0;i<room_cards.length;i++){
					if (room_cards[i].uid == tmp_uid)
						room_cards[i].uid = 0;
				}
				//if you submit cards, you will be a turn master
				if (data.cards.length > 0){
					for (var i=0;i<room.users.length;i++){
						if (user.uid == room.users[i].uid)
							room.turn_master = i;
					}
				}
				room.changeTurn(data.cards);
			}
		}
		else {
			console.log('USER OR ROOM INVALID. ERROR');
		}
	});

	//SUBMIT TAXTATION
	socket.on('submit_taxation', function(data){
		var user = get_user_by_uid(data.uid);
		var room = get_room_by_rid(user.where);
		console.log('SUBMIT TAXATION');
		if (user && room){
			var cards = data.cards;
			var user_status = room.getStatus(user);
			var user_cards = [];
			for (var i=0;i<room.cards.length;i++){
				if (room.cards[i].uid == user.uid) user_cards.push(room.cards[i].number);
			}
			user_cards.sort(sortASC);
			//check whether the user has given cards
			console.log('===CHECK WHETHER THE USER HAS GIVEN CARDS');
			console.log(cards);
			console.log(user_cards);
			var ownership_check = true;
			for (var i=0;i<cards.length;i++){
				if (!user_cards.find(parseInt(cards[i]))) ownership_check = false;
			}
			
			//taxation process
			if (user.taxation_complete){
				console.log('SUBMIT TAXATION FAIL - 1');
				socket.emit('submit_taxation_fail', {message:"Already paid tax"});
			}
			else if (ownership_check == false){
				console.log('SUBMIT TAXATION FAIL - 1-2');
				socket.emit('submit_taxation_fail', {message:"You don't have these cards"});
			}
			//4 players
			else if (room.users.length == 4 && user_status == 1 && cards.length != 1){
				console.log('SUBMIT TAXATION FAIL - 3');
				socket.emit('submit_taxation_fail', {message:"You have to choose one card"});
			}
			else if (room.users.length == 4 && user_status == 5 && cards.length != 1){
				console.log('SUBMIT TAXATION FAIL - 4');
				socket.emit('submit_taxation_fail', {message:"You have to choose one card"});
			}
			else if (room.users.length == 4 && user_status == 5 && cards[0] != user_cards[0]){
				console.log('SUBMIT TAXATION FAIL - 6');
				socket.emit('submit_taxation_fail', {message:"You have to choose your best card"});
			}
			//>4 players
			else if (room.users.length > 4 && user_status == 1 && cards.length != 2){
				console.log('SUBMIT TAXATION FAIL - 2');
				socket.emit('submit_taxation_fail', {message:"You have to choose two cards"});
			}
			else if (room.users.length > 4 && user_status == 2 && cards.length != 1){
				console.log('SUBMIT TAXATION FAIL - 3');
				socket.emit('submit_taxation_fail', {message:"You have to choose one card"});
			}
			else if (room.users.length > 4 && user_status == 4 && cards.length != 1){
				console.log('SUBMIT TAXATION FAIL - 4');
				socket.emit('submit_taxation_fail', {message:"You have to choose one card"});
			}
			else if (room.users.length > 4 && user_status == 5 && cards.length != 2){
				console.log('SUBMIT TAXATION FAIL - 5');
				socket.emit('submit_taxation_fail', {message:"You have to choose two card"});
			}
			else if (room.users.length > 4 && user_status == 4 && cards[0] != user_cards[0]){
				console.log('SUBMIT TAXATION FAIL - 6');
				socket.emit('submit_taxation_fail', {message:"You have to choose your best card"});
			}
			else if (room.users.length > 4 && user_status == 5 && (cards[0] != user_cards[0] || cards[1] != user_cards[1])){
				console.log('SUBMIT TAXATION FAIL - 7');
				socket.emit('submit_taxation_fail', {message:"You have to choose your best card"});
			}
			else {
				user.taxation_complete = true;
				user.taxation_cards = cards;
				var target_uid;
				if (user_status == 1) //great dalmuti
					target_uid = room.users[room.users.length-1].uid;
				else if (user_status == 2) //normal dalmuti
					target_uid = room.users[room.users.length-2].uid;
				else if (user_status == 4) //normal beggar
					target_uid = room.users[1].uid;
				else if (user_status == 5) //great beggar
					target_uid = room.users[0].uid;
				
				socket.emit('submit_taxation_complete', {
					target_uid:target_uid
				});
				for (var i=0;i<room.users.length;i++){
					if (room.users[i].uid != user.uid){
						var give_cards;
						if (room.users[i].uid == target_uid)
							give_cards = cards;
						else 
							give_cards = cards.map(function(n){return 0;}); //back of card

						room.users[i].socket.emit('give_cards', {
							from_uid:user.uid,
							to_uid:target_uid,
							cards:give_cards
						});
					}
				}
			}
			//check whether taxation process is ended
			var taxation_end = true;
			for (var i=0;i<room.users.length;i++){
				if (room.users[i].taxation_complete == false)
					taxation_end = false;
			}
			if (taxation_end){
				//give cards to each user
				for (var i=0;i<room.users.length;i++){
					var from_user = room.users[i];
					var to_user;
					if (room.getStatus(from_user) == 1)
						to_user = room.users[room.users.length - 1];
					else if (room.getStatus(from_user) == 2)
						to_user = room.users[room.users.length - 2];
					else if (room.getStatus(from_user) == 4)
						to_user = room.users[1];
					else if (room.getStatus(from_user) == 5)
						to_user = room.users[0];

					for (var j=0;j<from_user.taxation_cards.length;j++){
						var taxation_card_number = from_user.taxation_cards[j];
						for (var k=0;k<room.cards.length;k++){
							if (room.cards[k].uid == from_user.uid && room.cards[k].number == taxation_card_number){
								room.cards[k].uid = to_user.uid;
								break;
							}
						}
					}
				}
				//giving process end and game start!
				room.state = 2;
				room.startGame(false); //no init
			}
		}
	});

	socket.on('get_room_progress', function(data){
		var room = get_room_by_rid(data.rid);
		if (room && room.state == 2) {
			socket.emit('get_room_progress_result', {rid:room.rid, progress:room.getProgress()});
		}
	});

	socket.on('kick_user', function(data){
		var room = get_room_by_rid(data.rid);
		var my_user = get_user_by_uid(data.uid);
		var kick_user = get_user_by_uid(data.kick_uid);

		if (room.master.uid == my_user.uid && room.state == 0){ //only master and waiting state
			//kick user should be in given room
			var in_room = false;
			for (var i=0;i<room.users.length;i++){
				if (room.users[i].uid == kick_user.uid)
					in_room = true;
			}
			if (in_room) kick_user.kickRoom();
		}
	});

	socket.on('revolution', function(data){
		var user = get_user_by_uid(data.uid);
		if (user){
			var room = get_room_by_rid(user.where);
			//compute joker_count
			var joker_count = 0;
			for (var i=0;i<room.cards.length;i++){
				if (room.cards[i].number == 13 && room.cards[i].uid == user.uid)
					joker_count++;
			}
			//in taxation, greater beggar, two jokers
			//revolution complete
			if (room && room.state == 1 && room.users[room.users.length-1].uid == user.uid && joker_count == 2){
				room.revolution();
			}
			//revolution fail
			else {
				socket.emit('revolution_fail', {message:"Revolution conditions are not satisfied."});
			}
		}
	});

	socket.on('admin_message', function(data){
		if (data.password == '7fdc01d1d955314de221c773934148ee9eca6dfd'){
			admin_message_text = data.message;
			broadcast_admin_message(data.message);
		}
	});
});
