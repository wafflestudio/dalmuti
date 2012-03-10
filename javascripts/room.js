function refresh_room_users(users)
{
	console.log('BROADCAST USER INFO');
	console.log(users);
	$('.room-user-kick').hide();
	$('.room-user').each(function(i){
		var ele = $(this);
		if (i < users.length){
			ele.removeClass('no-user').removeClass('my-user');
			if (users[i].uid == uid)
				ele.addClass('my-user');
			else
				ele.addClass('ok-user');
			ele.children('.room-nickname').text(users[i].nickname);
			ele.children('.room-cards').text("");
			ele.children('.room-user-uid').text(users[i].uid);
			if (users[0].uid == uid && uid != users[i].uid && room_state == 0)
				ele.children('.room-user-kick').show();
			//ele.enableContextMenu(); //context menu
		}
		else {
			ele.removeClass('ok-user').removeClass('my-user');
			ele.addClass('no-user');
			ele.children('.room-nickname').text("");
			ele.children('.room-cards').text("");
			ele.children('.room-user-uid').text("");
			//ele.disableContextMenu(); //context menu
		}
	});
}

//Define jquery library();
(function($){
	//draw in room-user
	$.fn.appendToRoomUser = function(index){
		var ele = this;
		var width = ele.width();
		var height = ele.height();
		var user_width = $($('.room-user').get(index)).width();
		var user_height = $($('.room-user').get(index)).height();
		var user_left = $($('.room-user').get(index)).position().left;
		var user_top = $($('.room-user').get(index)).parent().position().top;

		var user_center = (2*user_left + user_width) / 2;
		var user_middle = (2*user_top + user_height) / 2;

		ele.appendTo($('#room_wrapper'));
		ele.css('position', 'absolute');
		ele.css('left', user_center - (width/2));
		ele.css('top', user_middle - (height/2));

		return ele;
	};

	$.fn.writeComment = function(message){
		var ele = this;
		var absolute_div = $('<div></div>').addClass('absolute').appendTo(ele).addClass('comment-div');
		var msg_div = $('<div></div>').addClass('comment-div').width(ele.width()).appendTo(absolute_div).text(message);

		return msg_div;
	};

	$.fn.appendToCardTable = function(){
		var ele = this;
		var width = ele.width();
		var height = ele.height();
		var table_width = $('#room_table').width();
		var table_height = $('#room_table').height();
		var table_left = $('#room_table').position().left;
		var table_top = $('#room_table').position().top;

		var table_center = (2*table_left + table_width) / 2;
		var table_middle = (2*table_top + table_height) / 2;

		ele.appendTo($('#room_wrapper'));
		ele.css('position', 'absolute');
		ele.css('left', table_center - (width/2));
		ele.css('top', table_middle - (height/2));

		return ele;
	};

	$.fn.giveToUser = function(index){
		if (!(index >= 0 && index < 10)) return this;
		var ele = this;
		var width = 60;
		var height = 90;

		var target_left = 0;
		var target_top = 0;
		var duration = 700;

		var user_div = $($('.room-user').get(index));
		var user_top = user_div.parent().position().top;
		var user_left = user_div.position().left;
		var user_width = user_div.width();
		var user_height = user_div.height();

		target_left = (2*user_left + user_width)/2 - (width/2);
		target_top = (2*user_top + user_height)/2 - (height/2);

		ele.children('img').stop(true, true).animate({width:width, height:height}, duration);
		ele.stop(true, true).animate({left:target_left, top:target_top, width:width, height:height}, duration, 
			function(){
				ele.fadeOut(500, function(){$(this).remove();});
			}
		);

		return ele;
	};

	$.fn.collectCard = function() {
		var ele = this;
		var width = 120;
		var height = 180;

		var target_left = 0;
		var target_top = 0;
		var duration = 700;

		var table_div = $('#room_table');
		var table_top = table_div.position().top;
		var table_left = table_div.position().left;
		var table_width = table_div.width();
		var table_height = table_div.height();

		target_left = (2*table_left + table_width)/2 - (width/2);
		target_top = (2*table_top + table_height)/2 - (height/2);

		ele.children('img').animate({width:width, height:height}, duration);
		ele.animate({left:target_left, top:target_top, width:width, height:height}, duration, 
			function(){
				ele.fadeOut(500, function(){$(this).remove();});
			}
		);

		return ele;
	};

	$.fn.block = function(){
		var ele = this;

		var block_div = $('<div></div>').addClass('block-div');
		block_div.width(ele.width()).height(ele.height()).css('left', ele.position().left).css('top', ele.position().top);
		ele.after(block_div);

		return block_div;
	};
})(jQuery);

function show_leaderboard(user_arr)
{
	play_effect('leaderboard');
	var tbody = $('#leaderboard_table tbody');
	tbody.children().remove();
	for (var i=0;i<user_arr.length;i++){
		var tr = $('<tr></tr>').appendTo(tbody);
		var ranking = $('<td></td>').text(i+1).appendTo(tr);
		var nickname = $('<td></td>').text(user_arr[i].nickname).appendTo(tr);

		if (user_arr[i].uid == uid){
			ranking.addClass('leaderboard-my-ranking');
			nickname.addClass('leaderboard-my-nickname');
		}
	}

	modal_leaderboard.dialog('open');
}

//create and return jqeury object, with {number, width, height, className}
function createCard(options)
{
	options = options || {}
	var number = options["number"] || 0; //default 0(back of the card)
	var width= options["width"] || 120;	//default 120
	var height = options["height"] || 180; //default 180
	var className = options["className"];
	//number : 0 ~ 13 (0:back)
	var result = $('<div></div>').addClass('card-container').width(width).height(height).attr('number', number);
	if (className)
		result.addClass(className);

	var block_div = $('<div></div>').addClass('block-div').width(width).height(height).appendTo(result).css('left', -1).css('top', -1).hide().attr('state', 0);

	$('<img src="/images/card_' + number + '.jpg " />').width(width).height(height).appendTo(result);

	return result;
}

//return jquery Object (wrapper of my cards)
function createMyCardSet()
{
	var col_max = 13;
	function get_rows()
	{
		var col = 0;
		var row = 0;
		for (var i=0;i<cards.my_cards.length;i++){
			col++;
			if (i<cards.my_cards.length-1 && cards.my_cards[i] != cards.my_cards[i+1])
				col++;
			if (col >= col_max){
				col = 0; row++;
			}
		}
		return row;
	}
	var card_set = $('<div></div>').addClass('card-set');
	var col_p = 0;
	var row_p = 0;

	var col_interval = 15;
	var row_interval = 0;
	if (get_rows() > 0) row_interval = 130 / get_rows();

	for (var i=0;i<cards.my_cards.length;i++){
		var card = createCard({
			number:cards.my_cards[i],
			width:80,
			height:120
		}).css('left', col_p*col_interval).css('top', row_p*row_interval).appendTo(card_set);
		col_p++;

		if (card.attr('number') == 13)
			card.addClass('joker-card');

		if (i<cards.my_cards.length-1 && cards.my_cards[i] != cards.my_cards[i+1])
			col_p++;
		if (col_p >= col_max){
			col_p = 0;
			row_p++;
		}
	}
	return card_set;
}

function adjustMyCardSet()
{
	//adjust position of my card set
	var col_max = 13;
	var containers = my_card_set.children('.card-container');
	function get_rows()
	{
		var col = 0;
		var row = 0;
		for (var i=0;i<containers.size();i++){
			col++;
			if (i<containers.size()-1 && $(containers.get(i)).attr('number') != $(containers.get(i+1)).attr('number'))
				col++;
			if (col >= col_max){
				col = 0; row++;
			}
		}
		return row;
	}
	var col_p = 0;
	var row_p = 0;

	var col_interval = 15;
	var row_interval = 0;
	if (get_rows() > 0) row_interval = 130 / get_rows();

	for (var i=0;i<containers.length;i++){
		var card = $(containers.get(i));
		card.animate({
			left:col_p*col_interval,
			top:row_p*row_interval
		}, 1000);
		col_p++;

		if (i<containers.size()-1 && $(containers.get(i)).attr('number') != $(containers.get(i+1)).attr('number'))
			col_p++;
		if (col_p >= col_max){
			col_p = 0;
			row_p++;
		}
	}
}

function giveUsersCard(arr1, callback)
{
	var count = 0;
	function recurProc(arr){
		//array of {index, count}
		if (arr.length > 0){
			giveUserCard(arr[0].index, arr[0].count, function(){
				arr.splice(0, 1);
				recurProc(arr);
			});
		}
		else {
			count++;
			if (count == 2 && callback)
				callback();
		}
	}
	var arr2 = [];
	if (arr1.length > 1){
		var arr2 = arr1.splice(0, arr1.length/2);
	}
	recurProc(arr2);
	recurProc(arr1.reverse());
}

function collectCards(arr1, callback)
{
	var count = 0;
	function recurProc(arr){
		//array of {index, count}
		if (arr.length > 0){
			collectCard(arr[0].index, 0, arr[0].count, function(){
				arr.splice(0, 1);
				recurProc(arr);
			});
		}
		else {
			count++;
			if (count == 2 && callback)
				callback();
		}
	}
	var arr2 = [];
	if (arr1.length > 1){
		var arr2 = arr1.splice(0, arr1.length/2);
	}
	recurProc(arr2);
	recurProc(arr1.reverse());
}

function giveUserCard(index, count, callback)
{
	count = count || 1;
	var max_count = Math.max(80 / (players.length + 2), 7);
	if (count > max_count) count = max_count;
	
	var timer = setInterval(function(){
		if (room_state == 0){clearInterval(timer);}
		else {
			if (count <= 1){
				clearInterval(timer);
				if (callback) callback();
			}
			createCard({
				count:0,
				width:120,
				height:180,
				className:"selected-number-card"
			}).appendToCardTable().giveToUser(index);

			count--;
		}
	}, 100);
}

function collectCard(index, number, count, callback)
{
	count = count || 1;
	var max_count = Math.max(80 / (players.length + 2), 7);
	if (count > max_count) count = max_count;
	
	var timer = setInterval(function(){
		if (room_state == 0){clearInterval(timer);}
		else {
			if (count <= 1){
				clearInterval(timer);
				if (callback) callback();
			}
			createCard({
				number:number,
				count:0,
				width:60,
				height:90,
				className:"selected-number-card"
			}).appendToRoomUser(index).collectCard();

			count--;
		}
	}, 100);
}

function get_user_index_by_uid(uid)
{
	for (var i=0;i<players.length;i++){
		if (players[i].uid == uid)
			return i;
	}
}

function get_card_count_by_uid(g_uid)
{
	//it returns the number of cards that user(found by uid) has
	for (var i=0;i<players.length;i++){
		if (players[i].uid == g_uid && g_uid == uid) //my cards
			return cards.my_cards.length;
		else if (players[i].uid == g_uid){ //other cards
			for (o_uid in cards.other_cards){
				if (o_uid == g_uid)
					return cards.other_cards[o_uid];
			}
		}
	}
	return 0;
}

function refresh_card_count(blank)
{
	//refresh each user's ramaining card count
	if (blank){
		$('.room-cards').text("");
	}
	else {
		$('.room-user').each(function(i){
			var ele = $(this);
			if (i < players.length){
				ele.children('.room-cards').text(get_card_count_by_uid(players[i].uid));
			}
			else{
				ele.children('.room-cards').text("");
			}
		});
	}
}

function cancel_card_container_hover()
{
	$('#room_mycards .card-container').removeClass('selected-card').removeClass('selected-number-card').removeClass('nonselected-card');
	$('.block-div').attr('state', 0).stop(true,true).fadeOut(300);
	$('#room_mycards .card-container').unbind('mouseenter').unbind('click');
	$('#room_mycards').unbind('mouseleave');
	$('#select_card_ok_button').unbind('click');
	$('#select_card_no_button').unbind('click');
	$('#select_card_pass_button').unbind('click');
	$('#room_mycards .comment-div').remove();
}

function refresh_card_container_hover()
{
	cancel_card_container_hover();
	//card container hover
	$('#room_mycards .card-container').mouseenter(function(){
		$('#room_mycards .card-container').removeClass('selected-card').removeClass('selected-number-card').removeClass('nonselected-card');
		$('#room_mycards .comment-div').remove();

		//moseover
		var containers = $('#room_mycards .card-container');
		var ele = $(this);

		var flag = true;
		var selected_count = 0;
		//selecting cards that have same number as this card and are back of this card.
		for (var i=0;i<containers.size();i++){
			var container = $(containers.get(i));
			var block_div = container.children('.block-div');
			if (container.attr('number') == ele.attr('number')){
				container.addClass('selected-number-card');
				if (flag){
					container.addClass('selected-card');
					selected_count++;
				}
				if (block_div.attr('state') == 1){
					block_div.stop(true,true).fadeOut(300);
					block_div.attr('state', 0);
				}
			}
			else {
				container.addClass('nonselected-card');
				if (block_div.attr("state") == 0){
					block_div.stop(true,true).fadeIn(300);
					block_div.attr('state', 1);
				}
			}

			if (ele.position().left == container.position().left && ele.position().top == container.position().top)
				flag = false;
		}
		ele.writeComment(String(selected_count+joker_count));

	}).mouseleave(function(){
	});

	$('#room_mycards .card-container').click(function(){
		var ele = $(this);
		var selection_count = get_card_inner_index(ele) + 1;
		var selection_number = ele.attr('number');

		var card_arr = [];
		for (var i=0;i<selection_count;i++)
			card_arr.push(selection_number);
		//add joker
		if (selection_number == 13){
			joker_count = get_card_inner_index(ele) + 1;
		}
		else {
			for (var i=0;i<joker_count;i++)
				card_arr.push(13);
		}
		current_cards = card_arr; //refresh current_cards
		
		var del_cards = $('.current-cards-wrapper').fadeOut(500, function(){
			del_cards.remove();
		});
		draw_current_cards(card_arr).hide().fadeIn(500);
	});

	$('#room_mycards').mouseleave(function(){
		$('#room_mycards .card-container').removeClass('selected-card').removeClass('selected-number-card').removeClass('nonselected-card');
		$('.block-div').attr('state', 0).stop(true,true).fadeOut(300);
		$('#room_mycards .comment-div').remove();
	});

	//select card ok button
	$('#select_card_ok_button').click(function(){
		socket.emit('submit_card', {
			uid:uid,	
			rid:where,
			cards:current_cards
		});
		$(this).attr('disabled', 'disabled');
	});
	$('#select_card_no_button').click(function(){
		current_cards = [];
		joker_count = 0;
		var current_cards_wrapper = $('.current-cards-wrapper').fadeOut(500, function(){
			current_cards_wrapper.remove();
		});
	});
	//select card pass button
	$('#select_card_pass_button').click(function(){
		current_cards = [];
		socket.emit('submit_card', {
			uid:uid,	
			rid:where,
			cards:current_cards
		});
		$(this).attr('disabled', 'disabled');
	});
} 

function add_card_to_card_set(number)
{
	var card = createCard({
		number:number,
		width:80,
		height:120
	}).css('left', 180).css('top', 130);

	var target;
	var containers = my_card_set.children('.card-container');
	if (containers.first().attr('number') > number){ //smallest card
		containers.first().before(card);
	}
	else {
		containers.each(function(i){
			var ele = $(this);
			if (ele.attr('number') <= number)
				target = ele;
		});
		target.after(card);
	}

	return card;
}

function remove_card_from_card_set(number)
{
	var containers = my_card_set.children('.card-container');
	var target;
	var flag = true;
	containers.each(function(i){
		var ele = $(this);
		if (flag && ele.attr('number') == number){
			target = ele;
			flag = false;
		}
	});
	target.addClass('card-container-deleted').removeClass('card-container');
	target.fadeOut(500, function(){
		target.remove();
	});
}

function get_card_inner_index(container)
{
	//if you enter the jQuery card container Object [1,1,1,"1",1,1] this function will return 3
	var containers = $('#room_mycards .card-container');
	var result = 0;
	var flag = false;
	for (var i=0;i<containers.size();i++){
		var ele = $(containers.get(i));
		if (ele.attr('number') == container.attr('number')) flag = true;
		if (ele.css('left') == container.css('left') && ele.css('top') == container.css('top')) break;

		if (flag && ele.attr('number') == container.attr('number')) result++;
	}
	return result;
}

//GLOBAL VARIABLES
var players = []; //array of {:nickname, :uid}
var cards = {};
var current_cards = [];
var previous_cards = [];
var my_card_set; //jquery Object(wrapper of my cards)
var room_state = 0;
var turn_uid;
var joker_count = 0; //selected joker_count
var room_timer_seconds = 0;
var room_timer;

$(function(){
	$('#room_wrapper input:button').button();
	$("#room_wrapper input:submit").button();
	$('#room_chat_message_list').tinyscrollbar();

	//quit room button click
	$('#room_quit_button').click(function(){
		if ($(this).attr('disabled') != "disabled"){
			$('#room_wrapper input').attr('disabled', 'disabled');
			socket.emit('quit_room', {uid:uid});
		}
		return false;
	});

	//game start button click
	$('#game_start_button').click(function(){
		socket.emit('start_game', {uid:uid, rid:where});
		return false;
	});

	//room chat ajaxForm
	$('#room_chat_form').ajaxForm({
		beforeSubmit:function(arr, $form, options){
			var form_hash = form_arr_to_hash(arr);
			var message = form_hash.message;

			if (message.trim() == ""){
				$('#room_chat_text').focus();
				return false;
			}
			//condition satisfied
			socket.emit('input_room_chat_message', {
				rid:where,
				uid:uid,
				message:message
			});
			$('#room_chat_text').val("");
			$('#room_chat_text').focus();
			return false;
		}
	});

	//room chat clean
	$('#room_chat_clean_button').click(function(){
		$('#room_chat_message_list .overview div.room-chat').remove();
		$('#room_chat_message_list').tinyscrollbar_update('bottom');
		$('#room_chat_text').focus();
		return false;
	});

	//taxation_ok_button
	$('#taxation_ok_button').click(function(){
		var taxation_cards = [];
		$('.selected-taxation-card').each(function(i){
			var ele = $(this);
			taxation_cards.push(ele.attr('number'));
		});
		socket.emit('submit_taxation', {
			uid:uid,
			cards:taxation_cards
		});
	});

	//revolution
	$('#taxation_revolution_button').click(function(){
		socket.emit('revolution', {
			uid:uid
		});
	});

	//kicking
	$('.room-user-kick').click(function(){
		var ele = $(this);
		var kick_uid = ele.parent().children('.room-user-uid').text();
		socket.emit('kick_user', {rid:where, uid:uid, kick_uid:kick_uid});
	});

	//context menu
	/*
	$('.room-user').contextMenu({
		menu:"myMenu"
	}, function(action, el, pos){
	});
	*/

	//room chat message
	socket.on('room_chat_message', function(data){
		var nickname = data.nickname;
		var message = data.message;
		var container = $('<div></div>').addClass('room-chat');
		if (data.uid == uid)
			$('<div></div>').addClass('room-chat-my-nickname').text(nickname).appendTo(container);
		else
			$('<div></div>').addClass('room-chat-nickname').text(nickname).appendTo(container);
		$('<div></div>').addClass('room-chat-message').text(message).appendTo(container);
		container.appendTo($('#room_chat_message_list .overview'));
		$('#room_chat_message_list').tinyscrollbar_update('bottom');
	});

	//room info message
	socket.on('room_info_message', function(data){
		var nickname = data.nickname;
		var message = data.message;
		var container = $('<div></div>').addClass('room-chat');
		$('<div></div>').addClass('room-info-message').text(message).appendTo(container);
		container.appendTo($('#room_chat_message_list .overview'));
		$('#room_chat_message_list').tinyscrollbar_update('bottom');
	});
	
	//enter room complete
	socket.on('enter_room_complete', function(data){
		$('#room_wrapper input').removeAttr('disabled');
		$('.room-player-list-container').remove(); //remove room-player-list
		//initialize room
		where = data.rid;
		room_state = 0;
		dialog_enter_password.dialog('close');
		$('.current-turn').removeAttr('style').removeClass('current-turn');
		$('#room_mycards_wrapper').hide();
		$('#room_table').hide();
		$('.previous-cards-wrapper').remove();
		$('.current-cards-wrapper').remove();
		$('#card_selection_buttons input').attr('disabled', 'disabled').hide();
		$('.card-container').remove();
		$('#room_right h3.room-title').text(data.number +". " + data.title);
		$('#taxation_wrapper').hide();
		$('#taxation_wrapper_background').hide();
		if (room_timer) clearInterval(room_timer);
		room_timer = null;
		room_timer_seconds = 0;
		refresh_room_timer_seconds(); //init timer
		$('#room_turn_master').text(""); //init turn_master_nickname

		cards = {};
		players = [];
		previous_cards = [];
		current_cards = [];
		refresh_previous_cards_number();

		if (my_card_set)
			my_card_set.remove();
		change_viewport('room');

		console.log('enter room complete');
		console.log(data);
	});

	//room user info
	socket.on('room_user_info', function(data){
		console.log('room_user_info');
		console.log(data);
		refresh_room_users(data);
	});

	//game start complete
	socket.on('start_game_complete', function(data){
		players = data.users; //refresh players
		cards = data.cards; //refresh cards info
		room_state = data.state; //change state
		$('.room-user-kick').hide(); //hide user-kick

		console.log("START GAME COMPLETE");
		console.log(data);

		if (my_card_set) my_card_set.remove();
		my_card_set = createMyCardSet().appendTo($('#room_mycards')).hide();
		$('#room_table').fadeIn(1000);
		$('#room_mycards_wrapper').fadeIn(1000); //game start
		$('#card_selection_buttons input').attr('disabled', 'disabled').hide();

		//GAME START after taxation
		if (!data.init && data.state == 2)
			start_game(data);
		else {
			play_bgm('playing_game'); //play bgm
			play_effect('startgame');
			//distribute cards
			var tmp_card = createCard({number:0, width:120, height:180}).appendToCardTable().hide().fadeIn(1000, function (){
				var distribution_arr = [];
				for (var i=0;i<players.length;i++)
					distribution_arr.push({index:i, count:get_card_count_by_uid(players[i].uid)});
				giveUsersCard(distribution_arr, function(){
					tmp_card.fadeOut(1000, function(){ tmp_card.remove();});
					setTimeout(function(){
						refresh_card_count();
						if (data.state == 1)
							set_taxation_board(data.status);
						else if (data.state == 2){
							//GAME START without taxation
							start_game(data);
						}
					}, 700);
				});
			});
			//else end
		}

	});

	//game start fail
	socket.on('start_game_fail', function(data){
		alert(data.message);
	});

	//game quit user
	socket.on('game_quit_user', function(data){
		console.log('GAME QUIT USER');
		console.log(data);
		refresh_card_count("blank");
		//stop!!
		cancel_card_container_hover();
		$('#card_selection_buttons input').attr('disabled', 'disabled').fadeOut(500);
		var del_cards_prev = $('.previous-cards-wrapper').fadeOut(500, function(){
			del_cards_prev.remove();
		});
		var del_cards = $('.current-cards-wrapper').fadeOut(500, function(){
			del_cards.remove();
		});
		//
		players = data.users;
		refresh_room_users(players);
		refresh_card_count();

		start_turn({
			turn_uid:data.turn,
			turn_nickname:data.nickname,
			turn_master:data.turn_master,
			previous_cards:data.previous_cards,
			previous_cards_genuine:data.previous_cards,
			timer_seconds:data.timer_seconds
		});
		/*
		var tmp_card = createCard({number:0, width:120, height:180}).appendToCardTable().hide().fadeIn(1000, function (){
			collectCard(get_user_index_by_uid(data.uid), 0, data.card_count, function(){
				var distribution_arr = [];
				for (each_uid in data.each_user_card_count){
					distribution_arr.push({index:get_user_index_by_uid(each_uid), count:data.each_user_card_count[each_uid]});
				}

				giveUsersCard(distribution_arr, function(){
					setTimeout(function(){
						cards = data.cards; //update cards
						players = data.users;
						refresh_room_users(players);
						refresh_card_count();
						//card distribution end
						//add cards to my cardset
						for (var i=0;i<data.distribution_result.my_cards.length;i++){
							add_card_to_card_set(data.distribution_result.my_cards[i]);
						}
						adjustMyCardSet();
						start_turn({
							turn_uid:data.turn,
							turn_nickname:data.nickname,
							turn_master:data.turn_master,
							previous_cards:data.previous_cards,
							previous_cards_genuine:data.previous_cards,
							timer_seconds:data.timer_seconds
						});

					}, 1000);
					tmp_card.fadeOut(1000, function(){ tmp_card.remove();});
				});

			});
		});
		*/
		//
	});

	socket.on('submit_card_fail', function(data){
		$('#select_card_ok_button').removeAttr('disabled');
		alert(data.message);
	});

	socket.on('change_turn', function(data){
		cancel_card_container_hover();
		$('#card_selection_buttons input').attr('disabled', 'disabled').fadeOut(500);
		cards = data.cards;
		start_turn({
			turn_uid:data.turn,
			turn_nickname:data.nickname,
			turn_master:data.turn_master,
			turn_master_nickname:data.turn_master_nickname,
			previous_cards:data.previous_cards,
			previous_cards_genuine:data.previous_cards_genuine,
			cards:data.cards,
			timer_seconds:data.timer_seconds
		});
	});

	socket.on('end_game', function(data){
		clearInterval(room_timer);
		room_timer_seconds = 0;
		refresh_room_timer_seconds();

		console.log('end game');
		show_leaderboard(data.leaderboard);
		setTimeout(function(){
			$('#room_wrapper input').removeAttr('disabled');
			//initialize room
			room_state = 0;
			$('.current-turn').removeAttr('style').removeClass('current-turn');
			$('#room_mycards_wrapper').fadeOut(1000);
			$('#room_table').fadeOut(1000);
			$('.previous-cards-wrapper').fadeOut(1000, function(){ $(this).remove();});
			$('.current-cards-wrapper').fadeOut(1000, function(){ $(this).remove();});
			$('#card_selection_buttons input').attr('disabled', 'disabled').fadeOut(1000);
			$('.card-container').fadeOut(1000, function(){ $(this).remove();});
			$('#taxation_wrapper').fadeOut(1000);
			$('#taxation_wrapper_background').fadeOut(1000);
			refresh_room_users(data.leaderboard); //for kick button
			cards = {};
			players = [];
			refresh_card_count();
			previous_cards = [];
			current_cards = [];
			refresh_previous_cards_number();

			if (my_card_set)
				my_card_set.remove();
		}, 1500);

		play_bgm('waiting_game');
	});
	
	socket.on('submit_taxation_fail', function(data){
		alert(data.message);
	});

	//submit taxation complete
	socket.on('submit_taxation_complete', function(data){
		$('.selected-taxation-card').giveToUser(get_user_index_by_uid(data.target_uid));
		$('#taxation_bottom').fadeOut(1000);
		$('#taxation_wrapper h3').fadeOut(1000);
		$('.taxation-card').fadeOut(1000, function(){ $(this).remove();});

		console.log('submit_taxation_complete');
		console.log(data);
	});

	socket.on('give_cards', function(data){
		var from_index = get_user_index_by_uid(data.from_uid);
		var to_index = get_user_index_by_uid(data.to_uid);
		var given_cards = data.cards;
		giveCardsFromUserToUser(from_index, to_index, given_cards);
		console.log(data);
	});

	socket.on('kick_message', function(data){
		alert(data.message);
	});

	socket.on('revolution_complete', function(data){
		$('#taxation_bottom').fadeOut(1000);
		$('#taxation_wrapper h3').fadeOut(1000);
		$('.taxation-card').fadeOut(1000, function(){ $(this).remove();});
		alert(data.message);
	});

	socket.on('revolution_fail', function(data){
		alert(data.message);
	});

});

//functions related with proceeding game...
function start_turn(options)
{
	//bomb sound! (when current and previous cards are different)
	var bomb_sound = false;
	if (options.previous_cards.length != 0 && options.previous_cards.join("") != previous_cards.join(""))
		bomb_sound = true;

	room_timer_seconds = options.timer_seconds;

	console.log(options.turn_nickname + ':TURN');
	previous_cards = options.previous_cards;
	var prev_turn_uid = turn_uid;
	var previous_cards_genuine = options.previous_cards_genuine;
	joker_count = 0; //init selected joker count
	refresh_card_count();
	//start turn!
	turn_uid = options["turn_uid"]; //refresh turn_uid

	//refresh state of room-user
	$('.room-user').each(function(index){
		var ele = $(this);
		if (get_user_index_by_uid(turn_uid) == index){
			ele.addClass('current-turn');
			ele.animate({"background-color":"#ffd700"}, 1000);
		}
		else {
			if (ele.hasClass('ok-user') || ele.hasClass('my-user'))
				ele.animate({"background-color":"#444"}, 1000, function(){$(this).removeAttr('style').removeClass('current-turn');});
			else
				ele.animate({"background-color":"#111"}, 1000, function(){$(this).removeAttr('style').removeClass('current-turn');});
		}
	});

	//refresh # of previous cards
	refresh_previous_cards_number();

	var del_cards = $('.previous-cards-wrapper').fadeOut(500, function(){
		if (del_cards)
			del_cards.remove();
	});
	var current_cards_wrapper = $('.current-cards-wrapper').fadeOut(500, function(){
		if (current_cards_wrapper)
			current_cards_wrapper.remove();
	});

	//refresh turn_master_nickname
	if (previous_cards.length == 0)
		$('#room_turn_master').text("");
	else
		$('#room_turn_master').text(options.turn_master_nickname);

	//start_turn procedure
	function start_turn_proc()
	{
		if (bomb_sound) play_effect('card');
		//if preivous turn was me, adjust cards
		if (prev_turn_uid == uid && previous_cards_genuine.length > 0){
			for (var i=0;i<current_cards.length;i++)
				remove_card_from_card_set(current_cards[i]);
			adjustMyCardSet();
			draw_previous_cards(previous_cards).hide().fadeIn(500, function(){
				//who's turn?
				if (turn_uid == uid)
					my_turn();
				else
					wait_turn();
			});
		}
		else {
			draw_previous_cards(previous_cards).hide().fadeIn(500, function(){
				//who's turn?
				if (turn_uid == uid)
					my_turn();
				else
					wait_turn();
			});
		}
	}

	//collectCard Effect!
	var prev_card_number = previous_cards[0];
	var prev_joker_count = 0;
	for (var i=0;i<previous_cards.length;i++){
		if (previous_cards[i] == 13) prev_joker_count++;
	}
	var prev_card_count = previous_cards.length - prev_joker_count;

	if (previous_cards_genuine.length > 0){
		if (prev_card_count > 0){
			collectCard(get_user_index_by_uid(prev_turn_uid), prev_card_number, prev_card_count, function(){
				if (prev_joker_count > 0)
					collectCard(get_user_index_by_uid(prev_turn_uid), 13, prev_joker_count, function(){setTimeout(start_turn_proc, 700);});
				else{
					setTimeout(start_turn_proc, 700);
				}
			});
		}else if (prev_joker_count >0){
			collectCard(get_user_index_by_uid(prev_turn_uid), 13, prev_joker_count, function(){setTimeout(start_turn_proc, 700);});
		}
		else start_turn_proc();
	}else {
		start_turn_proc();
	}

}

function my_turn()
{
	play_effect('myturn');
	console.log("Your turn!");
	current_cards = [];
	refresh_card_container_hover();
	$('#card_selection_buttons input').removeAttr('disabled').fadeIn(500);
}

function wait_turn()
{
	console.log("Other's turn!");
	cancel_card_container_hover();
	$('#card_selection_buttons input').attr('disabled', 'disabled').fadeOut(500);
}

function draw_previous_cards(arr)
{
	//arr : [12, 12, 12 ...]
	var wrapper = $('<div></div>').addClass('previous-cards-wrapper');
	var wrapper_width = 170;
	var card_width = 120;
	var card_height = 180;

	var count = arr.length;
	if (count == 1){
		var last_card = createCard({
			number:arr[0],
			width:card_width,
			height:card_height
		}).appendTo(wrapper).css('left', wrapper_width/2 - card_width/2);
	}
	else if (count > 1){
		var last_left = wrapper_width - card_width;
		var interval = (last_left / (count-1));
		var last_card;
		for (var i=0;i<arr.length;i++){
			last_card = createCard({
				number:arr[i],
				width:120,
				height:180
			}).appendTo(wrapper).css('left', interval * i);
		}
	}
	wrapper.appendTo($('#previous_cards'));

	return wrapper;
}

function draw_current_cards(arr)
{
	//arr : [12, 12, 12 ...]
	var wrapper = $('<div></div>').addClass('current-cards-wrapper');
	var wrapper_width = 170;
	var card_width = 120;
	var card_height = 180;

	var count = arr.length;
	if (count == 1){
		var card = createCard({
			number:arr[0],
			width:card_width,
			height:card_height
		}).appendTo(wrapper).css('left', wrapper_width/2 - card_width/2);
	}
	else if (count > 1){
		var last_left = wrapper_width - card_width;
		var interval = (last_left / (count-1));
		for (var i=0;i<arr.length;i++){
			var card = createCard({
				number:arr[i],
				width:120,
				height:180
			}).appendTo(wrapper).css('left', interval * i);
		}
	}
	wrapper.appendTo($('#current_cards'));

	return wrapper;
}

function clear_taxation_card_hover()
{
	$('.taxation-card').unbind('mouseenter').unbind('mouseleave').unbind('click');
}
var taxation_card_top = 223;
function refresh_texation_card_hover()
{
	clear_taxation_card_hover();
	$('.taxation-card').hover(function(){
		//mouseenter
		var ele = $(this);
		if (!ele.hasClass('selected-taxation-card'))
			ele.stop(true,true).animate({top:taxation_card_top-30}, 100);
		return false;
	}, function(){
		//mouseleave
		var ele = $(this)
		if (!ele.hasClass('selected-taxation-card'))
			ele.stop(true,true).animate({top:taxation_card_top}, 100);
		return false;
	}).click(function(){
		var ele = $(this);
		if (ele.hasClass('selected-taxation-card'))
			ele.removeClass('selected-taxation-card');
		else
			ele.addClass('selected-taxation-card');
	});
} 
function createTaxationCardSet(cards)
{
	var room_wrapper = $('#room_wrapper');
	var list_width = 540;
	var list_left = 30;
	var list_top = taxation_card_top;
	var card_width = 120;
	var card_height = 180;
	var interval = (list_width - card_width) / (cards.length - 1);

	for (var i=0;i<cards.length;i++){ var card = createCard({
			number:cards[i],
			width:card_width,
			height:card_height
		}).css('top', list_top).css('left', list_left + interval*i).addClass('taxation-card').appendTo(room_wrapper);
	}
	refresh_texation_card_hover();

	return $('.taxation-card');
}

function giveCardsFromUserToUser(from_index, to_index, card_arr)
{
	var arr = [];
	for (var i=0;i<card_arr.length;i++) arr.push(card_arr[i]);
	var timer = setInterval(function(){
		if (arr.length <= 1) {
			clearInterval(timer);
		}
		var card = createCard({
			number:arr[0],
			width:60,
			height:90
		}).appendToRoomUser(from_index).giveToUser(to_index);
		arr.splice(0, 1);
	}, 300);
}

function start_game(data)
{
	//GAME START!
	//start timer
	if (room_timer) clearInterval(room_timer);
	room_timer = setInterval(room_timer_interval_function, 1000);

	$('#taxation_wrapper').fadeOut(1000);
	$('#taxation_wrapper_background').fadeOut(1000);
	my_card_set.fadeIn(1000, function(){
		start_turn({
			turn_uid:data.turn,
			turn_nickname:data.nickname,
			turn_master:data.turn_master,
			previous_cards:data.previous_cards,
			previous_cards_genuine:[],
			timer_seconds:data.timer_seconds
		});
	});
}

function set_taxation_board(status)
{
	//TAXATION TIME!
	$('#room_table').fadeOut(1000);
	$('#room_mycards_wrapper').fadeOut(1000);
	$('#taxation_bottom').show();
	$('#taxation_wrapper h3').show();
	$('#taxation_wrapper').fadeIn(1000);
	$('#taxation_wrapper_background').fadeIn(1000);
	$('#taxation_revolution_button').hide();

	//revolution button
	var my_joker_count = 0;
	for (var i=0;i<cards.my_cards.length;i++){
		if (cards.my_cards[i] == 13) my_joker_count++;
	}
	if (status == 5 && my_joker_count == 2){
		$('#taxation_revolution_button').show();
	}

	//Setting explanation expression
	if (players.length == 4 && status == 1)
		$('#taxation_explain').text("You are The Greater Dalmuti! Choose one cards that will be given to The Great Beggar.");
	else if (players.length == 4 && status == 5)
		$('#taxation_explain').text("You are The Greater Beggar! You have to pay the best one card that will be given to The Greater Dalmuti.");
	else if (status == 1)
		$('#taxation_explain').text("You are The Greater Dalmuti! Choose two cards that will be given to The Great Beggar.");
	else if (status == 2)
		$('#taxation_explain').text("You are The Lesser Dalmuti! Choose one card that will be given to The Lesser Beggar.");
	else if (status == 3)
		$('#taxation_explain').text("You are a normal player. Wait for other players.");
	else if (status == 4)
		$('#taxation_explain').text("You are The Lesser Beggar! You have to pay the best one card that will be given to The Lesser Dalmuti.");
	else if (status == 5)
		$('#taxation_explain').text("You are The Greater Beggar! You have to pay the best two cards that will be given to The Greater Dalmuti.");

	//hide for normal people
	if (status == 3){
		$('#taxation_wrapper h3').hide();
		$('#taxation_bottom').hide();
		$('#taxation_wrapper h3').hide();
	}
	else { //normal people don't pay tax
		createTaxationCardSet(cards.my_cards).hide().fadeIn(1000, function(){
			//Pre selection
			//if Great Beggar
			if (status == 4 || (status == 5 && players.length == 4)){
				$($('.taxation-card').get(0)).animate({top:taxation_card_top-30}).addClass('selected-taxation-card');
				$('.taxation-card').unbind('click');
			}
			else if (status == 5){
				$($('.taxation-card').get(0)).animate({top:taxation_card_top-30}).addClass('selected-taxation-card');
				$($('.taxation-card').get(1)).animate({top:taxation_card_top-30}).addClass('selected-taxation-card');
				$('.taxation-card').unbind('click');
			}
		});
	}
}

function room_timer_interval_function()
{
	if (room_timer_seconds > 0)
		room_timer_seconds--;
	refresh_room_timer_seconds();
}

function refresh_room_timer_seconds()
{
	var t1 = parseInt(room_timer_seconds / 10);
	var t2 = parseInt(room_timer_seconds % 10);

	$('#room_timer_1').text(t1);
	$('#room_timer_2').text(t2);
}

function refresh_previous_cards_number()
{
	var n1 = parseInt(previous_cards.length / 10);
	var n2 = parseInt(previous_cards.length % 10);

	$('#room_pcn_1').text(n1);
	$('#room_pcn_2').text(n2);
}
