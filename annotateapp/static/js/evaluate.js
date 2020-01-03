function menu_to_straight(){
	$('.menu-layer').css({
		"-webkit-transition": "all .4s linear",
		"transition": "all .4s linear",
		"opacity": "0",
		"visibility": "hidden",
		"display": "none",
	});
	$('.straight-layer').css({
		"-webkit-transition": "all .6s linear",
		"transition": "all .6s linear",
		"opacity": "1",
		"visibility": "visible",
		"display":"inline",
	});
	$('.twist-key-icons').css({
		"opacity": "0",
		"visibility": "hidden",
		"display":"none",
	});
}

function straight_to_twist(){
	$('.straight-layer').css({
		"-webkit-transition": "opacity .6s linear",
		"transition": "opacity .6s linear",
		"opacity": "0",
		"visibility": "hidden",
		"display":"none",
	});
	$('.twist-layer').css({
		"-webkit-transition": "opacity .6s linear",
		"transition": "opacity .6s linear",
		"opacity": "1",
		"visibility": "visible",
		"display":"inline",
	});
}

function flash_bank_green(){
	// $('#lives-in-bank').css({
	// "-webkit-box-shadow": "inset 0px 0px 15px 10px rgba(126,211,33,1)",
	// "-moz-box-shadow": "inset 0px 0px 15px 10px rgba(126,211,33,1)",
	// "box-shadow": "inset 0px 0px 15px 10px rgba(126,211,33,1)",
	// });
	// setTimeout(function(){
	// 	$('#lives-in-bank').css({
	// 	"-webkit-box-shadow": "none",
	// 	"-moz-box-shadow": "none",
	// 	"box-shadow": "none",
	// 	});
	// }, 300);
	$('#lives-in-bank').addClass('box-flash-green');
	setTimeout(function(){
		$('#lives-in-bank').removeClass('box-flash-green');
	}, 300);
}