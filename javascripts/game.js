console = {};
console.log = function(m){};

function getUrlVars()
{
	var vars = [], hash;
	var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for(var i = 0; i < hashes.length; i++)
	{
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}

function form_arr_to_hash(arr)
{
	var result = {};
	for (var i=0;i<arr.length;i++){
		result[arr[i].name] = arr[i].value;
	}
	return result;
}

function show_alert_message(message)
{
	modal_alert.dialog('close');
	$('#modal_alert .alert-message').text(message);
	modal_alert.dialog('open');
}
//alert = show_alert_message;
function alert(m) {show_alert_message(m);}

function show_error_message(message)
{
	$('#top_wrapper').fadeOut(1000, function(){$('#top_wrapper').remove();});
	$('#modal_error .error-message').text(message);
	modal_error.dialog('open');
	socket.disconnect();
}

function init_dialogs()
{
	modal_loading = $('#modal_loading').dialog({
		modal:true,
		show:{effect: "fade", duration:500},
		hide:{effect: "fade", duration:500},
		resizable:false,
		dialogClass:"no-title",
		draggable:false,
//		closeOnEscape:false,
		close:function(){
		$('#top_wrapper').fadeIn(500);
		}
	});
	modal_error = $('#modal_error').dialog({
		modal:true,
		show:{effect: "fade", duration:1000},
		hide:{effect: "fade", duration:1000},
		resizable:false,
		dialogClass:"no-title",
		draggable:false,
		closeOnEscape:false,
		autoOpen:false
	});
	modal_alert = $('#modal_alert').dialog({
		modal:true,
		resizable:false,
		dialogClass:"no-title",
		draggable:false,
		closeOnEscape:true,
		buttons: {
			OK:function(){
				$(this).dialog("close");
			}
		},
		autoOpen:false
	});
	dialog_create_room = $('#dialog_create_room').dialog({
		modal:true,
		resizable:false,
		dialogClass:"no-title",
		draggable:false,
		autoOpen:false,
		position:['center', 200],
		width:400,
		open:function(){
			$('#room_title').val("").focus();
			$('#room_password').val("");
			create_room_dialog_opened = true;
			$('#room_is_secret').prop('checked', false).button('refresh').trigger('change');
			$('#room_allowing_observer').prop('checked', true).button('refresh').trigger('change');
		},
		close:function(){
			$('#room_title').val("");
			$('#room_password').val("");
			create_room_dialog_opened = false;
			$('#room_is_secret').prop('checked', false).button('refresh').trigger('change');
		}
	});

	dialog_enter_password = $('#dialog_enter_password').dialog({
		modal:true,
		resizable:false,
		title:"",
		draggable:false,
		autoOpen:false,
		position:['center', 200],
		width:400,
		open:function(){
			$('#enter_password').val("").focus();
			enter_password_dialog_opened = true;
		},
		close:function(){
			$('#enter_password').val("");
			enter_password_dialog_opened = false;
		}
	});

	modal_leaderboard = $('#modal_leaderboard').dialog({
		modal:true,
		show:{effect: "fade", duration:1000},
		hide:{effect: "fade", duration:1000},
		resizable:false,
		title:"Leaderboard",
//		dialogClass:"no-title",
		draggable:false,
		autoOpen:false,
		width:400,
		open: function(event, ui) { $(".ui-dialog-titlebar-close", ui.dialog || ui).hide(); },
		buttons: {
			OK:function(){
				$(this).dialog("close");
			}
		}
	});

	modal_howtoplay = $('#modal_howtoplay').dialog({
		modal:true,
		resizable:false,
		title:"How to play",
		draggable:false,
		autoOpen:false,
		width:635,
		height:455,
		position:['center', 70],
		open: function(){
			howtoplay_page = 1;
			$('#howtoplay_1').show();
			$('#howtoplay_2').hide();
			$('#howtoplay_3').hide();
			modal_howtoplay.dialog('option', 'title', "How to play (1/3)");
		},
		buttons: {
			Prev:function(){
				if (howtoplay_page > 1){
					$('#howtoplay_1').hide();
					$('#howtoplay_2').hide();
					$('#howtoplay_3').hide();
					howtoplay_page--;
					if (howtoplay_page == 1) $('#howtoplay_1').show();
					if (howtoplay_page == 2) $('#howtoplay_2').show();
					if (howtoplay_page == 3) $('#howtoplay_3').show();

					modal_howtoplay.dialog('option', 'title', "How to play (" + String(howtoplay_page) + "/3)");
				}
			},
			Next:function(){
				if (howtoplay_page < 3){
					$('#howtoplay_1').hide();
					$('#howtoplay_2').hide();
					$('#howtoplay_3').hide();
					howtoplay_page++;
					if (howtoplay_page == 1) $('#howtoplay_1').show();
					if (howtoplay_page == 2) $('#howtoplay_2').show();
					if (howtoplay_page == 3) $('#howtoplay_3').show();
					modal_howtoplay.dialog('option', 'title', "How to play (" + String(howtoplay_page) + "/3)");
				}
			},
			Close:function(){
				$(this).dialog("close");
			}
		}
	});
}

var howtoplay_page = 1;
var exact_viewport = "transition";
function change_viewport(new_viewport)
{
	if (viewport == "entrance" && new_viewport == "lobby"){
		exact_viewport = "trasition";
		$('#entrance_wrapper').fadeOut(500, function(){
			$('#lobby_wrapper').fadeIn(500, function(){exact_viewport = "lobby";});
			//scrollbar
			$('#lobby_chat_message_list').tinyscrollbar_update('bottom');
			$('#room_list').tinyscrollbar_update();
			$('#user_list').tinyscrollbar_update();
		});
		viewport = "lobby";
		//clear chat-message list
		$('#lobby_chat_message_list .overview div.lobby-chat').remove();

		$('#entrance_wrapper input').attr('disabled', 'disabled');
	}
	else if (viewport == "lobby" && new_viewport == "room"){
		$('.room-player-list-container').remove(); //close player contextmenu
		exact_viewport = "trasition";
		$('#lobby_wrapper').fadeOut(500, function(){
			$('#room_wrapper').fadeIn(500, function(){exact_viewport = "room"});
			$('#room_chat_message_list').tinyscrollbar_update();
			$('#room_wrapper input').removeAttr('disabled');
		});
		viewport = "room";

		$('#room_chat_message_list .overview div.room-chat').remove();

		$('#create_room_form input').attr('disabled', 'disabled');
		$('#lobby_wrapper input').attr('disabled', 'disabled');
	}
	else if (viewport == "room" && new_viewport == "lobby"){
		exact_viewport = "trasition";
		$('#room_wrapper').fadeOut(500, function(){
			$('#lobby_wrapper').fadeIn(500, function(){exact_viewport = "lobby"});
			//scrollbar
			$('#lobby_chat_message_list').tinyscrollbar_update('bottom');
			$('#room_list').tinyscrollbar_update();
			$('#user_list').tinyscrollbar_update();
		});
		viewport = "lobby";
		//clear chat-message list
		$('#lobby_chat_message_list .overview div.lobby-chat').remove();

		$('#lobby_wrapper input').removeAttr('disabled');
	}
	else {
		show_error_message("Denied access");
	}
}

function refresh_connecting_users_count()
{
	$('.connecting_users_count').text(connecting_users_count);
}

//GLOBAL VARIABLES
var uid;
var where; //0:lobby else:room_id
var nickname;
var socket;
var modal_loading;
var modal_error;
var modal_alert;
var modal_leaderboard;
var dialog_create_room;
var dialog_enter_password;
var viewport;
var connecting_users_count;
var create_room_dialog_opened = false;
var enter_password_dialog_opened = false;

$(function(){
	$('#wrapper').removeAttr('style'); //in order to remove 'display:none' style
	//socket init... show modal view until completed.
	$('#entrance input:submit').button({});
	init_dialogs();

	//page leave prevention
	/*
	$(window).bind('beforeunload', function(){
		return "Do you want to quit?";
	});
	*/

	//uid init
	uid = SHA1(String(new Date()) + String(Math.random()));

	//before loading, every viewport has to be hidden.
	$('#top_wrapper').hide();
	$('#entrance_wrapper').show();
	$('#lobby_wrapper').hide();
	$('#room_wrapper').hide();
	$('#howtoplay_2').hide();
	$('#howtoplay_3').hide();

	//keydown -> chat text
	$('*').keydown(function(event){
		if (event.keyCode != '13'){ //enter
			//lobby
			if (where == "0"){
				//creating room
				if (create_room_dialog_opened){
					//$('#room_title').focus();
				}
				else if (enter_password_dialog_opened){
				}
				else
					$('#lobby_chat_text').focus();
			}
			//room
			else
				$('#room_chat_text').focus();
		}
	});

	//shortcut registration
	var isCtrl = false;
	$(document).keyup(function (e) {
		if(e.which == 17) isCtrl=false;
	}).keydown(function (e) {
		if(e.which == 17) isCtrl=true;
		/*
		if(e.which == 81 && isCtrl == true && exact_viewport == "room") {
			$('#room_quit_button').trigger('click');
			return false;
		}
		*/
		if(e.which == 67 && isCtrl == true && exact_viewport == "lobby") {
			$('#create_room_button').trigger('click');
			return false;
		}
		if(e.which == 83 && isCtrl == true && exact_viewport == "room") {
			$('#game_start_button').trigger('click');
			return false;
		}
	});


	socket = io.connect();
	socket.on('init_client', function(data){
		//loading complete
		modal_loading.dialog('close');
		viewport = "entrance";
		connecting_users_count = data.count;
		refresh_connecting_users_count();
	});
	socket.on('connecting_users_count', function(data){
		connecting_users_count = data.count;
		refresh_connecting_users_count();
		console.log(data);
	});
	socket.on('disconnect', function(){
		show_error_message("Disconnected");
		console.log('Disconnected!');
	});
	socket.on('error', function(data){
		show_error_message(data.message);
		console.log('socket on error');
	});
});
