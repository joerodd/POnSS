// This function gets cookie with a given name
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');

/*
The functions below will create a header with csrftoken
*/

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
function sameOrigin(url) {
    // test that a given url is a same-origin URL
    // url could be relative or scheme relative or absolute
    var host = document.location.host; // host + port
    var protocol = document.location.protocol;
    var sr_origin = '//' + host;
    var origin = protocol + sr_origin;
    // Allow absolute or scheme relative URLs to same origin
    return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
        (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
        // or any other URL that isn't scheme relative or absolute i.e relative.
        !(/^(\/\/|http:|https:).*/.test(url));
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
            // Send the token to same-origin, relative URLs only.
            // Send the token only if the method warrants CSRF protection
            // Using the CSRFToken value acquired earlier
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

// ensure that we have requestAnimationFrame
// this is Paul Irish's compatibility shim
if (!window.requestAnimationFrame) 
{
	window.requestAnimationFrame = (function() 
	{
		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function(callback,element) 
		{
			window.setTimeout(callback, 1000 / 60);
		};
	})();
}

// ======================= beginning of main script ===========================

// grab the DOM elements we want to manipulate
var buttons = document.getElementById('buttons');
var middle = document.getElementById('middle');
var text_slot = document.getElementById('text_slot');
var undo = document.getElementById('undo');
var superbad = document.getElementById('superbad');
var subcontainer = document.getElementById('subcontainer');


var input_textslot = document.getElementById('input_textslot');
var base_vocabulary = [];
var haystack = [];


// window.addEventListener("keydown", dealWithKeyboard, false);

window.addEventListener('resize', refresh_cursors);

// function dealWithKeyboard(e) {
// 	// gets called when any of the keyboard events are overheard
// 	shifted = e.shiftKey;
// 	alted = e.altKey;
//
// 		if (e.keyCode == "9") {
// 		e.preventDefault();
// 		// tab
// 		play_press();
// 	}
//
// }


// status variables
var status = 0; // 0 = not ready, 1 = sounds loaded, 2 = sounds played, 3 = response entered, 11 = sounds loaded twist, 12 = sounds played twist, 13 = response entered twist
var response_allowed;
var context = new AudioContext();
var buffer = [];
var worker_buffer1;
var worker_buffer2;
var worker_buffer3;
var worker_buffer4;
var worker_buffer5;
var worker_buffer6;
var worker_buffer7;
var candidate_id;
var stim_sound;
var stim_start;
var stim_end;
var stim_label;
var stim_duration;
var listens;
var evaluation;
var trial_begun;
var clip_end;
var onset_shift = 0.08;
var offset_shift = 0.08;
var pixels_per_s;
var left_cursor_position_s;
var right_cursor_position_s;
var source;
var last_slide = Date.now();
var last_play = Date.now();
var last_submit = Date.now();
var last_begin_trial = Date.now();
var last_end_trial = Date.now();
var current_item;

function deal_with_checkbox(checkbox,textbox,label)
{
	if (checkbox.checked) {
		textbox.value = label;
	}
	else {
		textbox.value = "";
	}
}


function left_press(shifted,alted)
{
	console.log(shifted);
	if(shifted){
		left_cursor_position_s -= 0.02;
	} else if(alted) {
		left_cursor_position_s -= 0.001;
	} else {
		left_cursor_position_s -= 0.005;
	}
	left_cursor_position_s = Math.max(left_cursor_position_s,0);
	refresh_cursors();
	// play();
}

function slide_press()
{
	if(Date.now() - last_slide > 50){
		last_slide = Date.now();
		console.log("slide");
		left_cursor_position_s = right_cursor_position_s - 0.1;
		right_cursor_position_s = left_cursor_position_s + 1.5;
		left_cursor_position_s = Math.min(left_cursor_position_s,clip_end);
		right_cursor_position_s = Math.min(right_cursor_position_s,clip_end);
		refresh_cursors();
	} else {
		console.log("no slide because too short after previous");
	}

	// play();
}

function right_press(shifted,alted)
{
	if(shifted){
		left_cursor_position_s += 0.02;
	} else if(alted) {
		left_cursor_position_s += 0.001;
	} else {
		left_cursor_position_s += 0.005;
	}
	left_cursor_position_s = Math.min(left_cursor_position_s,right_cursor_position_s);
	refresh_cursors();
	// play();
}

function down_press(shifted,alted)
{
	console.log(shifted);
	if(shifted){
		right_cursor_position_s -= 0.02;
	} else if(alted) {
		right_cursor_position_s -= 0.001;
	} else {
		right_cursor_position_s -= 0.005;
	}
	right_cursor_position_s = Math.max(left_cursor_position_s,right_cursor_position_s);
	refresh_cursors();
	// play();
}

function up_press(shifted,alted)
{
	if(shifted){
		right_cursor_position_s += 0.02;
	} else if(alted) {
		right_cursor_position_s += 0.001;
	} else {
		right_cursor_position_s += 0.005;
	}
	right_cursor_position_s = Math.min(right_cursor_position_s,clip_end);
	refresh_cursors();
	// play();
}

function proceed_press()
{
	if (load_status==true & response_allowed){
		submit_ortho("good");
		buttons.style.opacity = 0.6;
		buttons.style.transition = "all .1s linear";
		subcontainer.style.opacity = 0.6;
		subcontainer.style.transition = "all .1s linear";
		text_slot.style.opacity = 0.6;
		text_slot.style.transition = "all .1s linear";
		setTimeout(function () {
			buttons.style.opacity = 1;
			buttons.style.transition = "all .1s linear";
			subcontainer.style.opacity = 1;
			subcontainer.style.transition = "all .1s linear";
			text_slot.style.opacity = 1;
			text_slot.style.transition = "all .1s linear";

		}, 200);
		setTimeout(function () {
			end_trial()
		}, 200)
	}
}

function superbad_press()
{
	if (load_status==true & response_allowed){
		submit_ortho("superbad");
		buttons.style.opacity = 0.6;
		buttons.style.transition = "all .1s linear";
		setTimeout(function () {
			buttons.style.opacity = 1;
			buttons.style.transition = "all .1s linear";
		}, 200);
		setTimeout(function () {
			end_trial()
		}, 200)
	}
}

function flag_press()
{
	if (load_status==true & response_allowed){
		submit_ortho("flag");
		buttons.style.opacity = 0.6;
		buttons.style.transition = "all .1s linear";
		setTimeout(function () {
			buttons.style.opacity = 1;
			buttons.style.transition = "all .1s linear";
		}, 200);
		setTimeout(function () {
			end_trial()
		}, 200)
	}
}

function end_trial()
{
	if(Date.now() - last_end_trial > 300) {
		last_end_trial = Date.now();
        console.log("end_trial");
        response_allowed = false;
        buttons.style.opacity = 0.6;
        buttons.style.transition = "all .1s linear";
        text_slot.style.opacity = 0.1;
        text_slot.style.transition = "all .1s linear";
        subcontainer.style.opacity = 0.1;
        subcontainer.style.transition = "all .1s linear";
        left_cursor.style.opacity = 0.05;
        left_cursor.style.transition = "opacity .1s linear";
        right_cursor.style.opacity = 0.05;
        right_cursor.style.transition = "opacity .1s linear";
        fill_buffers();
    }
}


function submit_ortho(accepted) {
	if(Date.now() - last_submit > 300){
		last_submit = Date.now();
		console.log("submit ortho!");
		var evaluation_submitted = Date.now();
		var RT = evaluation_submitted - trial_begun;
		$.ajax({
			url : "/annotate/accept_result_ortho/", // the endpoint
			type : "POST", // http method
			data : {
				accepted: accepted,
				chunk_id: chunk_id,
				evaluator: evaluator,
				timestamp : Date.now(),
				listens: listens,
				RT: RT,
				orthographic_transcription: input_textslot.value,

			 }, // data sent with the post request

			// handle a successful response
			success : function(json) {
				console.log(json); // log the returned json to the console
				console.log("success"); // another sanity check
			},

			// handle a non-successful response
			error : function(xhr,errmsg,err) {
				console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
			}
		});
	};
}

function refresh(){
	try{
		listens += 1;
		var pre = 0.1; // 100ms delay from pressing play to playback
		var start_time = context.currentTime + pre;
		source =  context.createBufferSource();
		console.log(stim_sound);
		source.buffer = jsPsych.pluginAPI.getAudioBuffer(stim_sound);

		console.log(stim_start/1000);
		console.log(stim_end/1000);
		source.connect(context.destination);
		var duration = stim_end - stim_start;
		} catch(TypeError){
		console.log("play issue", stim_sound);
	}
}

function play(onset_shift=0,offset_shift=0){
	if(source){
		try{
			source.stop();
        } catch (InvalidStateError) {
        }
    }
	try{
		listens += 1;
		var pre = 0.02; // 100ms delay from pressing play to playback
		var start_time = context.currentTime + pre;
		source =  context.createBufferSource();
		console.log(stim_sound);
		source.buffer = jsPsych.pluginAPI.getAudioBuffer(stim_sound);

		console.log(stim_start/1000);
		console.log(stim_end/1000);
		source.connect(context.destination);
		buffer_duration = source.buffer.duration;
		start_offset = left_cursor_position_s;
		start_duration = right_cursor_position_s - left_cursor_position_s;


		source.start(start_time,offset=start_offset,duration=start_duration);
	} catch(TypeError){
		console.log("play issue", stim_sound);
	}
}

function play_press()
{
	if(Date.now() - last_play > 50){
		console.log("play press")
		last_play = Date.now();
		if (load_status==true & response_allowed){
		var duration = stim_end - stim_start;
		subcontainer.style.opacity = 0.6;
		subcontainer.style.transition = "all .1s linear";
		setTimeout(function () {
			subcontainer.style.opacity = 1;
			subcontainer.style.transition = "all .1s linear";
		}, 200);
		play();
	} else {
		console.log("no play because too short after previous");
	}

	}
}

function first_play()
{
	if (load_status==true){
		trial_begun = Date.now();
		var duration = stim_end - stim_start;
		subcontainer.style.opacity = 0.6;
		subcontainer.style.transition = "all .1s linear";
		setTimeout(function () {
			subcontainer.style.opacity = 1;
			subcontainer.style.transition = "all .1s linear";
		}, 50);
		play();
		setTimeout(function(){
			load_status=true;
			console.log("allow_response");
			allow_response();
		},duration + 50)
	}
}

function my_callback(data){
    alert(data.message);
}

function allow_response(){
	response_allowed = true;
	buttons.style.opacity = 1;
	text_slot.style.opacity = 1;
	buttons.style.transition = "all .1s linear";
	text_slot.style.transition = "all .1s linear";
	$('#input_textslot').suggest(haystack, {
	  // Available options with defaults:
	  suggestionColor   : '#cccccc',
	  moreIndicatorClass: 'suggest-more',
	  moreIndicatorText	: '&hellip;'
	});
	input_textslot.focus();
}

function refresh_cursors(){
	console.log("refresh cursors");
	pixels_per_s = (Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.8) / jsPsych.pluginAPI.getAudioBuffer(stim_sound).duration;
	// 0.8 because width of subcontainer is 80vw
	left_cursor.style.left = (pixels_per_s * left_cursor_position_s)-10	;
	right_cursor.style.left = pixels_per_s * right_cursor_position_s;

}

function poll_cursors(){
	left_cursor_position_s = (parseFloat(left_cursor.style.left)+10) / pixels_per_s;
	right_cursor_position_s = parseFloat(right_cursor.style.left) / pixels_per_s;
}

var interval;
var attempts;

function give_up(){
console.log("giving up");
					window.clearInterval(interval);
					begin_trial();
					buffer.push(new_item);

}

function make_attempt(){
attempts++;
			if (attempts <3 * (requests.length + 3) & !success) {
				console.log("attempt" + attempts);
				success = true;
				try {
					stim_duration = jsPsych.pluginAPI.getAudioBuffer(stim_sound).duration;
					clip_start = 0;
					clip_end = stim_duration;
					left_cursor_position_s = clip_start;
					right_cursor_position_s = Math.min(clip_end,1.5);
					refresh_cursors();
					stim_start = new_item["interest_onset"];
					stim_end = new_item["interest_offset"];

					buttons.style.opacity = 1;
					buttons.style.transition = "all .1s linear";

					load_status = true;
					listens = 0;
					var urlString = 'url(/media/chunkpics/' + new_item["chunk_image"] + ')';

					// play sound first time
					subcontainer.style.backgroundImage = urlString;
					subcontainer.style.opacity = 1;
					subcontainer.style.transition = "all .1s linear";
					left_cursor.style.opacity = 0.6;
					left_cursor.style.transition = "opacity .1s linear";
					right_cursor.style.opacity = 0.6;
					right_cursor.style.transition = "opacity .1s linear";
					input_textslot.value = "",
					first_play();

				} catch(error) {

					console.log(error)
					success = false;
				}
			}

			if(attempts >=3 * (requests.length + 3) & !success){
				window.setTimeout(give_up,3000);

			} else if (success){
				window.clearInterval(interval);
			}

}




function begin_trial(){
	if(Date.now() - last_begin_trial > 300) {
        last_begin_trial = Date.now();
        console.log("begin_trial");
        new_item = buffer.shift();
        current_item = new_item;
        console.log(new_item);
        if (new_item["chunk_id"] == "error: no current trial!") {
            subcontainer.innerHTML = "error: no more words!";
        } else {
            chunk_id = new_item["chunk_id"];
            base_vocabulary = new_item["vocabulary"].split(" ");
            haystack = JSON.parse(JSON.stringify(base_vocabulary));

            stim_sound = jsPsych.pluginAPI.loadAudioFile("/media/chunkrecordings/" + new_item['chunk_audio']);
            attempts = 0;
            success = false;
            if (interval) clearInterval(interval);
            interval = window.setInterval(make_attempt, 2000);

        }
    }

}

function wait_until_buffered(){
	if(buffer.length == 0){
		console.log("waiting, buffer.length == 0, current requests =",requests.length);
		setTimeout(function(){wait_until_buffered();}, 100);
	} else {
		begin_trial();
    }
}

var requests = [];

function remove_request(target){
	setTimeout(function(){
		index = requests.indexOf(target);
		if(index >=0){
			requests.splice(index,1);
			console.log("removed request", target);
        }
    },60000)
}


function fill_buffers_only()
{
	window.setTimeout(function(){
	console.log("buffer.length =", buffer.length, ", current requests =",requests.length);
	if(buffer.length>10 || requests.length>6){

    } else if(buffer.length==0 & requests.length<=2){
		setTimeout(function(){
			worker_buffer1 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer1.addEventListener('message', accept_new_item);
			requests.push(10);
			remove_request(10);
		}, 10);
		setTimeout(function(){
			worker_buffer3 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer3.addEventListener('message', accept_new_item);
			requests.push(13);
			remove_request(13);
		}, 2000);
		setTimeout(function(){
			worker_buffer4 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer4.addEventListener('message', accept_new_item);
			requests.push(15);
			remove_request(15);
		}, 100);
		// wait_until_buffered();
	} else if(buffer.length==1 & requests.length<=2) {
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(12);
			remove_request(12);
		}, 10);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(14);
			remove_request(14);
		}, 100);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(16);
			remove_request(16);
		}, 100);
	} else if(buffer.length==2 & requests.length<=2) {
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(17);
			remove_request(17);
		}, 10);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(19);
			remove_request(19);
		}, 100);
	} else if(buffer.length==3 & requests.length==0) {
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(18);
			remove_request(18);
		}, 10);
	}
	},150);
}

function fill_buffers()
{
	console.log("buffer.length =", buffer.length, ", current requests =",requests.length);
	if(buffer.length > 10 || requests.length>6){
		begin_trial();

	} else if(buffer.length==0 & requests.length<=2){
		setTimeout(function(){
			worker_buffer1 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer1.addEventListener('message', accept_new_item);
			requests.push(1);
			remove_request(1);
		}, 10);
		setTimeout(function(){
			worker_buffer3 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer3.addEventListener('message', accept_new_item);
			requests.push(3);
			remove_request(3);
		}, 2000);
		setTimeout(function(){
			worker_buffer4 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer4.addEventListener('message', accept_new_item);
			requests.push(5);
			remove_request(5);
		}, 100);
		wait_until_buffered();
	} else if(buffer.length==1 & requests.length<=2) {
		begin_trial();
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(2);
			remove_request(2);
		}, 10);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(4);
			remove_request(4);
		}, 100);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(6);
			remove_request(6);
		}, 100);
	} else if(buffer.length==2 & requests.length<=1) {
		begin_trial();
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(7);
			remove_request(7);
		}, 10);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_ortho_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(9);
			remove_request(9);
		}, 100);
	} else if(buffer.length==0 & requests.length>2){
		wait_until_buffered();
	}
	 else {
	 	begin_trial();
	}
}



function accept_new_item(e){
	// check if we already have this one...

	accepted_item = JSON.parse(e.data);

	already_had = false;
	for(item in buffer){
		if (accepted_item["chunk_id"] == item["chunk_id"]){
			already_had = true;
		}
	}

	if(accepted_item == current_item){
		// is it the currently active one?
		already_had = true;
	}


	if (already_had == false){
		buffer.push(accepted_item);
	requests.shift();
	console.log("new item, buffer.length =", buffer.length, ", current requests =",requests.length);

	} else {
		requests.shift();
		console.log("new item is a repeat. Buffer.length =", buffer.length, ", current requests =",requests.length);
	}

	window.setTimeout(fill_buffers_only,1000);

}


if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)) || (navigator.userAgent.match(/iPad/i))) {

    document.write('<a id="init" ontouchstart="javascript:sndInit();"></a>');

    function sndInit(){
    snd.play();
    snd.pause();
    document.getElementById('init').style.display = 'none';
    }
}

fill_buffers();