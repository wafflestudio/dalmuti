function refresh_room_list(rooms)
{
	console.log(rooms);
	var new_tbody = $('<tbody></tbody>');
	for(var i=0;i<rooms.length;i++){
		var new_tr = $('<tr></tr>').appendTo(new_tbody);
		var room = rooms[i];
		var players = room.users.map(function(x){return x.nickname}).join(',');
		console.log(room.users);
		
		$('<td></td>').addClass('room-no').appendTo(new_tr).text(room.number);
		var title_td = $('<td></td>').addClass('room-title').appendTo(new_tr).text(room.title);
		var players_td = $('<td></td>').addClass('room-players').appendTo(new_tr).text(room.users.length + "/" + room.capacity);
		$('<td></td>').addClass('room-master').appendTo(new_tr).text(room.master.nickname);
		var state_td = $('<td></td>').addClass('room-state').appendTo(new_tr);
		$('<div></div>').addClass('room-state-text').text(room.state).appendTo(state_td);
		var room_enter_td = $('<td></td>').addClass('room-enter').appendTo(new_tr);
		var enter_button = $('<input type="button" value="enter" />').attr('alt', room.rid).addClass('room-enter-button').attr('number', room.number).appendTo(room_enter_td); 
		//add player_list to players_td
		var player_list_ul = $('<ul></ul>').addClass('room-player-list').appendTo(players_td).hide();
		for (var j=0;j<room.users.length;j++){
			var user = room.users[j];
			$('<li></li>').addClass('room-player-container').text(user.nickname).appendTo(player_list_ul);
		}
		
		//add lock image
		if (room.is_secret){
			$('<img src="/images/lock.png" />').css('margin-left', "5px").css('vertical-align', 'middle').appendTo(title_td);
			enter_button.attr('is-secret', room.is_secret).attr('title', room.title);
		}

		//get room progress
		state_td.hover(function(){
			//mouseenter
			socket.emit('get_room_progress', {rid:room.rid});
		},function(){
			//mouseleave
			$('.room-state-text').show();
			$('.room-progress').remove();
		});
	}
	$('#room_list_table tbody').remove();
	new_tbody.appendTo($('#room_list_table'));

	//show/hide player_list
	$('td.room-enter').unbind('mouseenter').mouseenter(function(){
		//mouseenter
		var ele = $(this);
		var contextmenu_absolute = $('<div></div>').addClass('absolute').addClass('room-player-list-container').appendTo($('#wrapper'));
		var contextmenu = $('<div></div>').addClass('room-player-list').appendTo(contextmenu_absolute).css('top', ele.position().top + $('#room_list').position().top + 7);
		$('<h3></h3>').text("Players").appendTo(contextmenu);
		var contextmenu_ul = $('<ul></ul>').appendTo(contextmenu);
		var users_nickname = ele.parent().find('.room-player-list').children().map(function(i){ return $(this).text(); }).toArray();
		for (var i=0;i<users_nickname.length;i++){
			$('<li></li>').appendTo(contextmenu).text(users_nickname[i]);
		}

	}).unbind('mouseleave').mouseleave(function(){
		$('.room-player-list-container').remove();
	});

	//when room enter button is clicked
	$('.room-enter-button').click(function(){
		var rid = $(this).attr('alt');
		var number = $(this).attr('number');
		var title = $(this).attr('title');
		var is_secret = $(this).attr('is-secret');
		if (is_secret){
			$('#enter_password_rid').val(rid);
			dialog_enter_password.dialog('option', 'title', number + '. ' + title);
			dialog_enter_password.dialog('open');
		}
		else
			socket.emit('enter_room', {uid:uid, rid:rid});
	});
	$("#lobby_wrapper input:button").button();
	$('#room_list').tinyscrollbar_update();
}

function refresh_lobby_user_list(lobby_users)
{
	var new_ul = $('<ul></ul>');
	for (var i=0;i<lobby_users.length;i++){
		var user = lobby_users[i];
		var new_li = $('<li></li>').text(user.nickname).appendTo(new_ul);
		if (user.uid == uid) new_li.addClass('my-list');
	}
	$('#user_list ul').remove();
	new_ul.appendTo($('#user_list .overview'));
	$('#user_list').tinyscrollbar_update();
}

$(function(){
	$("#lobby_wrapper input:button").button();
	$("#lobby_wrapper input:submit").button();
	$("#dialog_create_room input:button").button();
	$("#dialog_create_room input:submit").button();
	$("#dialog_create_room input:checkbox").button();
	$("#dialog_enter_password input:button").button();
	$("#dialog_enter_password input:submit").button();

	$('#room_is_secret').change(function(){
		var checked = $(this).prop('checked');
		if (checked)
			$('#create_room_password_row').show();
		else
			$('#create_room_password_row').hide();
		$('#room_password').val("");
	}).trigger('change');

	//how to play click
	$('#howtoplay_button').click(function(){
		modal_howtoplay.dialog('open');
		return false;
	});

	//create room dialog
	$('#create_room_button').click(function(){
		$('#create_room_form input').removeAttr('disabled');
		dialog_create_room.dialog('open');
	});
	//cancel create room
	$('#create_room_cancel_button').click(function(){
		dialog_create_room.dialog('close');
		return false;
	});
	//cancel enter password
	$('#enter_password_cancel_button').click(function(){
		dialog_enter_password.dialog('close');
		return false;
	});

	$('#room_list').tinyscrollbar();
	$('#lobby_chat_message_list').tinyscrollbar();
	$('#user_list').tinyscrollbar();

	//create room ajaxForm
	$('#create_room_form').ajaxForm({
		beforeSubmit:function(arr, $form, options){
			//create room!
			var form_hash = form_arr_to_hash(arr);
			var title = form_hash.title;
			var is_secret = form_hash.is_secret;
			var password = form_hash.password;
			var allowing_observer = form_hash.allowing_observer;

			if (title.trim() == ""){
				alert("Enter a title");
				return false;
			}
			if (is_secret && password.trim() == ""){
				alert("Enter a password");
				return false;
			}
			//condition satisfied
			socket.emit('create_room', {
				uid : uid,
				title : title,
				is_secret : is_secret,
				password : password,
				allowing_observer: allowing_observer
			});
			$('#create_room_form input').attr('disabled', 'disabled');

			return false;
		}
	});

	//enter password ajaxForm
	$('#enter_password_form').ajaxForm({
		beforeSubmit:function(arr, $form, options){
			//create room!
			var form_hash = form_arr_to_hash(arr);
			var rid = form_hash.rid;
			var password = form_hash.password;

			if (password.trim() == ""){
				alert("Enter a password");
				return false;
			}
			//condition satisfied
			$('#enter_password').val("");
			socket.emit('enter_room', {uid:uid, rid:rid, password:password});

			return false;
		}
	});

	//lobby chat ajaxForm
	$('#lobby_chat_form').ajaxForm({
		beforeSubmit:function(arr, $form, options){
			var form_hash = form_arr_to_hash(arr);
			var message = form_hash.message;

			if (message.trim() == ""){
				$('#lobby_chat_text').focus();
				return false;
			}
			//condition satisfied
			socket.emit('input_lobby_chat_message', {
				uid:uid,
				message:message
			});
			$('#lobby_chat_text').val("");
			$('#lobby_chat_text').focus();
			return false;
		}
	});

	//lobby chat clean
	$('#lobby_chat_clean_button').click(function(){
		$('#lobby_chat_message_list .overview div.lobby-chat').remove();
		$('#lobby_chat_message_list').tinyscrollbar_update('bottom');
		$('#lobby_chat_text').focus();
		return false;
	});
	
	//lobby user list
	socket.on('lobby_user_list', function(data){
		refresh_lobby_user_list(data);
	});

	//room list
	socket.on('room_list', function(data){
		refresh_room_list(data);
	});

	//enter lobby complete
	socket.on('enter_lobby_complete', function(data){
		change_viewport("lobby");
		where = "0" //lobby
	});

	//create room complete
	socket.on('create_room_complete', function(data){
		dialog_create_room.dialog('close');
		console.log(data);
		socket.emit('enter_room', {uid:uid, rid:data.rid});
	});

	//enter room fail
	socket.on('enter_room_fail', function(data){
		alert(data.message);
	});

	//quit room complete
	socket.on('quit_room_complete', function(data){
		change_viewport('lobby');
		where = "0";
		console.log(data);
	});

	socket.on('lobby_chat_message', function(data){
		var nickname = data.nickname;
		var message = data.message;
		var container = $('<div></div>').addClass('lobby-chat');
		if (data.uid == uid)
			$('<div></div>').addClass('lobby-chat-my-nickname').text(nickname).appendTo(container);
		else
			$('<div></div>').addClass('lobby-chat-nickname').text(nickname).appendTo(container);
		$('<div></div>').addClass('lobby-chat-message').text(message).appendTo(container);
		container.appendTo($('#lobby_chat_message_list .overview'));
		$('#lobby_chat_message_list').tinyscrollbar_update('bottom');
	});

	socket.on('get_room_progress_result', function(data){
		var room_progress_div = $('<div></div>').addClass('room-progress').text(data.progress + " %");
		$('#room_list_table tbody tr').each(function(i){
			var ele = $(this);
			var rid = ele.find('.room-enter-button').attr('alt');
			if (rid == data.rid){
				ele.find('.room-state-text').hide();
				room_progress_div.appendTo(ele.find('.room-state'));
			}
		});
	});

});
