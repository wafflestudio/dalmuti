$(function(){
	$('#entrance_form').ajaxForm({
		beforeSubmit:function(arr, $form, options){
			var form_hash = form_arr_to_hash(arr);
			var nickname = form_hash.nickname;

			if (nickname.trim() == ""){
				alert("Enter your nickname");
				return false;
			}
			//enter!
			socket.emit('enter_lobby', {uid:uid, nickname:nickname});

			return false;
		},
		success:function(result){
			alert(1);
		}
	});
});
