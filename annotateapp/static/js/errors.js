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
var frame = document.getElementById('frame');
var right = document.getElementById('right');
var middle = document.getElementById('middle');
var text_slot = document.getElementById('text_slot');
var undo = document.getElementById('undo');
var superbad = document.getElementById('superbad');
var subcontainer = document.getElementById('subcontainer');

f1 = "";
t2 = "";
t3 = "";
t4 = "";
t5 = "";
t6 = "";
f7 = "";
f8 = "";

var f1_slot = document.getElementById('f1_slot');
var t2_slot = document.getElementById('t2_slot');
var t3_slot = document.getElementById('t3_slot');
var t4_slot = document.getElementById('t4_slot');
var t5_slot = document.getElementById('t5_slot');
var t6_slot = document.getElementById('t6_slot');
var f7_slot = document.getElementById('f7_slot');
var f8_slot = document.getElementById('f8_slot');

var f1_check = document.getElementById('f1_check');
var t2_check = document.getElementById('t2_check');
var t3_check = document.getElementById('t3_check');
var t4_check = document.getElementById('t4_check');
var t5_check = document.getElementById('t5_check');
var t6_check = document.getElementById('t6_check');
var f7_check = document.getElementById('f7_check');
var f8_check = document.getElementById('f8_check');

var f1_text = document.getElementById('f1_text');
var t2_text = document.getElementById('t2_text');
var t3_text = document.getElementById('t3_text');
var t4_text = document.getElementById('t4_text');
var t5_text = document.getElementById('t5_text');
var t6_text = document.getElementById('t6_text');
var f7_text = document.getElementById('f7_text');
var f8_text = document.getElementById('f8_text');

var messagebox = document.getElementById('messagebox');
var messagetitle = document.getElementById('messagetitle');
var messagetext = document.getElementById('messagetext');
var left_cursor = document.getElementById('left_cursor');
var right_cursor = document.getElementById('right_cursor');

f1_check.addEventListener("click", function(){  deal_with_checkbox(f1_check,f1_text,f1); })
t2_check.addEventListener("click", function(){  deal_with_checkbox(t2_check,t2_text,t2); })
t3_check.addEventListener("click", function(){  deal_with_checkbox(t3_check,t3_text,t3); })
t4_check.addEventListener("click", function(){  deal_with_checkbox(t4_check,t4_text,t4); })
t5_check.addEventListener("click", function(){  deal_with_checkbox(t5_check,t5_text,t5); })
t6_check.addEventListener("click", function(){  deal_with_checkbox(t6_check,t6_text,t6); })
f7_check.addEventListener("click", function(){  deal_with_checkbox(f7_check,f7_text,f7); })
f8_check.addEventListener("click", function(){  deal_with_checkbox(f8_check,f8_text,f8); })

window.addEventListener("keydown", dealWithKeyboard, false);

window.addEventListener('resize', refresh_cursors);

function dealWithKeyboard(e) {
	// gets called when any of the keyboard events are overheard
	shifted = e.shiftKey;
	alted = e.altKey;
	if (e.keyCode == "49") {
		 e.preventDefault();
		// 1
		if (f1_check.checked == false){
			f1_check.checked = true;
		} else {
			f1_check.checked = false;
		}
		deal_with_checkbox(f1_check,f1_text,f1);
	}

	if (e.keyCode == "50") {
		e.preventDefault();
		// 2

		if (t2_check.checked == false){
			t2_check.checked = true;
		} else {
			t2_check.checked = false;
		}
		deal_with_checkbox(t2_check,t2_text,t2);
	}

	if (e.keyCode == "51") {
		e.preventDefault();
		// 3

		if (t3_check.checked == false){
			t3_check.checked = true;
		} else {
			t3_check.checked = false;
		}
		deal_with_checkbox(t3_check,t3_text,t3);
	}

	if (e.keyCode == "52") {
		e.preventDefault();
		// 4

		if (t4_check.checked == false){
			t4_check.checked = true;
		} else {
			t4_check.checked = false;
		}
		deal_with_checkbox(t4_check,t4_text,t4);
	}

	if (e.keyCode == "53") {
		e.preventDefault();
		// 5

		if (t5_check.checked == false){
			t5_check.checked = true;
		} else {
			t5_check.checked = false;
		}
		deal_with_checkbox(t5_check,t5_text,t5);
	}

	if (e.keyCode == "54") {
		e.preventDefault();
		// 6

		if (t6_check.checked == false){
			t6_check.checked = true;
		} else {
			t6_check.checked = false;
		}
		deal_with_checkbox(t6_check,t6_text,t6);
	}

	if (e.keyCode == "55") {
		e.preventDefault();
		// 7

		if (f7_check.checked == false){
			f7_check.checked = true;
		} else {
			f7_check.checked = false;
		}
		deal_with_checkbox(f7_check,f7_text,f7);
	}

		if (e.keyCode == "56") {
		e.preventDefault();
		// 8

		if (f8_check.checked == false){
			f8_check.checked = true;
		} else {
			f8_check.checked = false;
		}
		deal_with_checkbox(f8_check,f8_text,f8);
	}

	if (e.keyCode == "48") {
		// 0
		e.preventDefault();
		perfect_press();
	}


	if (e.keyCode == "13") {
		// enter
		e.preventDefault();
		perfect_press();
	}

	if (e.keyCode == "61") {
		e.preventDefault();
		// =
		errors_press();
	}

		if (e.keyCode == "9") {
		e.preventDefault();
		// tab
		play_press();
	}

}


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

function deal_with_checkbox(checkbox,textbox,label)
{
	if (checkbox.checked) {
		textbox.value = label;
	}
	else {
		textbox.value = "";
	}
}

function perfect_press()
{
	    f1_check.checked = true;
		t2_check.checked = true;
		t3_check.checked = true;
		t4_check.checked = true;
		t5_check.checked = true;
		t6_check.checked = true;
		f7_check.checked = true;
		f8_check.checked = true;

		deal_with_checkbox(f1_check,f1_text,f1);
		deal_with_checkbox(t2_check,t2_text,t2);
		deal_with_checkbox(t3_check,t3_text,t3);
		deal_with_checkbox(t4_check,t4_text,t4);
		deal_with_checkbox(t5_check,t5_text,t5);
		deal_with_checkbox(t6_check,t6_text,t6);
		deal_with_checkbox(f7_check,f7_text,f7);
		deal_with_checkbox(f8_check,f8_text,f8);
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

function errors_press()
{
	if (load_status==true & response_allowed){
		submit_errors();
		right.style.opacity = 0.6;
		right.style.transition = "all .1s linear";
		subcontainer.style.opacity = 0.6;
		subcontainer.style.transition = "all .1s linear";
		text_slot.style.opacity = 0.6;
		text_slot.style.transition = "all .1s linear";
		setTimeout(function () {
			right.style.opacity = 1;
			right.style.transition = "all .1s linear";
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
		// submit_evaluation("superbad");
		right.style.opacity = 0.6;
		right.style.transition = "all .1s linear";
		setTimeout(function () {
			right.style.opacity = 1;
			right.style.transition = "all .1s linear";
		}, 200);
		setTimeout(function () {
			end_trial()
		}, 200)
	}
}

function flag_press()
{
	if (load_status==true & response_allowed){
		// submit_evaluation("flag");
		flag.style.opacity = 0.6;
		flag.style.transition = "all .1s linear";
		setTimeout(function () {
			flag.style.opacity = 1;
			flag.style.transition = "all .1s linear";
		}, 200);
		setTimeout(function () {
			end_trial()
		}, 200)
	}
}

function undo_press()
{
		undo.style.opacity = 0.6;
		undo.style.transition = "all .1s linear";
		setTimeout(function () {
			undo.style.opacity = 1;
			undo.style.transition = "all .1s linear";
		}, 200);
		setTimeout(function () {
			undo_last()
		}, 200)
}

function end_trial()
{
	f1_slot.innerHTML = "";
	t2_slot.innerHTML = "";
	t3_slot.innerHTML = "";
	t4_slot.innerHTML = "";
	t5_slot.innerHTML = "";
	t6_slot.innerHTML = "";
	f7_slot.innerHTML = "";
	f8_slot.innerHTML = "";

	f1_check.checked = false;
	t2_check.checked = false;
	t3_check.checked = false;
	t4_check.checked = false;
	t5_check.checked = false;
	t6_check.checked = false;
	f7_check.checked = false;
	f8_check.checked = false;

	response_allowed = false;
	right.style.opacity = 0.6;
	right.style.transition = "all .1s linear";
	// left.style.opacity = 0.6;
	// left.style.transition = "all .1s linear";
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



function submit_evaluation(accepted) {
    console.log("submit evaluation!");
    var evaluation_submitted = Date.now();
    var RT = evaluation_submitted - trial_begun;
    $.ajax({
        url : "/annotate/accept_result_evaluate/", // the endpoint
        type : "POST", // http method
        data : {
			word_candidate: candidate_id, 
			evaluator: evaluator,
        	timestamp : Date.now(),
        	listens: listens,
        	RT: RT,
        	good: accepted,
        	completed: true,
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
}
function submit_errors(accepted) {
    console.log("submit errors!");
    var evaluation_submitted = Date.now();
    var RT = evaluation_submitted - trial_begun;
    $.ajax({
        url : "/annotate/accept_result_errors/", // the endpoint
        type : "POST", // http method
        data : {
			trial_id: trial_id,
			evaluator: evaluator,
        	timestamp : Date.now(),
        	listens: listens,
        	RT: RT,
        	new_f1: f1_text.value,
			new_t2: t2_text.value,
			new_t3: t3_text.value,
			new_t4: t4_text.value,
			new_t5: t5_text.value,
			new_t6: t6_text.value,
			new_f7: f7_text.value,
			new_f8: f8_text.value

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
}
function undo_last() {
    console.log("undo!");
    $.ajax({
        url : "/annotate/undo_last_30_seconds/", // the endpoint
        type : "POST", // http method
        data : {
			evaluator: evaluator,
        	timestamp : Date.now(),
         }, // data sent with the post request

        // handle a successful response
        success : function(json) {
            console.log(json); // log the returned json to the console
            console.log("undo success"); // another sanity check
        },

        // handle a non-successful response
        error : function(xhr,errmsg,err) {
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        }
    });
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
	if (load_status==true & response_allowed){
		var duration = stim_end - stim_start;
		subcontainer.style.opacity = 0.6;
		subcontainer.style.transition = "all .1s linear";
		setTimeout(function () {
			subcontainer.style.opacity = 1;
			subcontainer.style.transition = "all .1s linear";
		}, 200);
		play();
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
		}, 200);
		play();
		setTimeout(function(){
			load_status=true;
			console.log("allow_response");
			allow_response();
		},duration + 300)
	}
}

function my_callback(data){
    alert(data.message);
}

function allow_response(){
	response_allowed = true;
	f1_slot.innerHTML = f1;
	t2_slot.innerHTML = t2;
	t3_slot.innerHTML = t3;
	t4_slot.innerHTML = t4;
	t5_slot.innerHTML = t5;
	t6_slot.innerHTML = t6;
	f7_slot.innerHTML = f7;
	f8_slot.innerHTML = f8;

	// left.style.opacity = 1;
	right.style.opacity = 1;
	text_slot.style.opacity = 1;
	// left.style.transition = "all .1s linear";
	right.style.transition = "all .1s linear";
	text_slot.style.transition = "all .1s linear";
}

function refresh_cursors(){
	console.log("refresh cursors");
	pixels_per_s = (Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.4) / jsPsych.pluginAPI.getAudioBuffer(stim_sound).duration;
	left_cursor.style.left = (pixels_per_s * left_cursor_position_s)-10	;
	right_cursor.style.left = pixels_per_s * right_cursor_position_s;

}

function poll_cursors(){
	left_cursor_position_s = (parseFloat(left_cursor.style.left)+10) / pixels_per_s;
	right_cursor_position_s = parseFloat(right_cursor.style.left) / pixels_per_s;
}

function begin_trial(){
	console.log("begin_trial");
	new_item = buffer.shift();
	console.log(new_item);
	if(new_item["trial_id"] == "error: no current trial!"){
		subcontainer.innerHTML = "error: no more words!";
	} else {
		trial_id = new_item["trial_id"];

		stim_sound = jsPsych.pluginAPI.loadAudioFile("/media/trialwavs/" + new_item['trial_audio']);
		attempts = 0;
		success = false;
		interval = setInterval(function() {
			attempts++;
			if (attempts <5 * (requests.length + 3) & !success) {
				console.log("attempt" + attempts);
				success = true;
				try {
					stim_duration = jsPsych.pluginAPI.getAudioBuffer(stim_sound).duration;
					clip_start = 0;
					clip_end = stim_duration;
					left_cursor_position_s = clip_start + 0.18;
					right_cursor_position_s = clip_end - 0.18;
					refresh_cursors();
					stim_start = new_item["interest_onset"];
					stim_end = new_item["interest_offset"];
					f1 = new_item["f1"];
					t2 = new_item["t2"];
					t3 = new_item["t3"];
					t4 = new_item["t4"];
					t5 = new_item["t5"];
					t6 = new_item["t6"];
					f7 = new_item["f7"];
					f8 = new_item["f8"];
					f1_check.checked = false;
					t2_check.checked = false;
					t3_check.checked = false;
					t4_check.checked = false;
					t5_check.checked = false;
					t6_check.checked = false;
					f7_check.checked = false;
					f8_check.checked = false;

					f1_text.value = "";
					t2_text.value = "";
					t3_text.value = "";
					t4_text.value = "";
					t5_text.value = "";
					t6_text.value = "";
					f7_text.value = "";
					f8_text.value = "";

					// deal_with_checkbox(f1_check,f1_text,f1);
					// deal_with_checkbox(f2_check,f2_text,f2);
					// deal_with_checkbox(t3_check,t3_text,t3);
					// deal_with_checkbox(t4_check,t4_text,t4);
					// deal_with_checkbox(t5_check,t5_text,t5);
					// deal_with_checkbox(t6_check,t6_text,t6);
					// deal_with_checkbox(f7_check,f7_text,f7);
					// deal_with_checkbox(f8_check,f8_text,f8);

					load_status = true;
					listens = 0;
					var urlString = 'url(/media/trialpics/' + new_item["trial_image"] + ')';
					subcontainer.style.backgroundImage = urlString;
					subcontainer.style.opacity = 1;
					subcontainer.style.transition = "all .1s linear";
					left_cursor.style.opacity = 0.6;
					left_cursor.style.transition = "opacity .1s linear";
					right_cursor.style.opacity = 0.6;
					right_cursor.style.transition = "opacity .1s linear";

					// play sound first time
					first_play();
				} catch(TypeError) {
					success = false;
				}
			} else if(!success){
				console.log("giving up");
				clearInterval(interval);
				buffer.push(new_item);
				fill_buffers();
			}
		}, 1200);
	}
	// setTimeout(function(){
	// 	stim_duration = jsPsych.pluginAPI.getAudioBuffer(stim_sound).duration;
	// 	clip_start = 0;
	// 	clip_end = stim_duration;
	// 	left_cursor_position_s = clip_start + 0.18;
	// 	right_cursor_position_s = clip_end - 0.18;
	// 	refresh_cursors();
	// 	stim_start = new_item["candidate_onset"];
	// 	stim_end = new_item["candidate_offset"];
	// 	stim_label = new_item["candidate_label"];
	// 	load_status = true;
	// 	listens = 0;
	// 	var urlString = 'url(/media/wavpics_retrim/' + new_item["candidate_image"] + ')';
	// 	subcontainer.style.backgroundImage = urlString;
	// 	subcontainer.style.opacity = 1;
	// 	subcontainer.style.transition = "all .1s linear";
	// 	left_cursor.style.opacity = 0.6;
	// 	left_cursor.style.transition = "opacity .1s linear";
	// 	right_cursor.style.opacity = 0.6;
	// 	right_cursor.style.transition = "opacity .1s linear";

	// 	// play sound first time
	// 	first_play();
	// }, 800);
}

function wait_until_buffered(){
	if(buffer.length == 0){
		console.log("waiting, buffer.length == 0, current requests =",requests.length);
		setTimeout(function(){wait_until_buffered();}, 500);
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
	console.log("buffer.length =", buffer.length, ", current requests =",requests.length);
	if(buffer.length>30){

    } else if(buffer.length==0 & requests.length<=2){
		setTimeout(function(){
			worker_buffer1 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer1.addEventListener('message', accept_new_item);
			requests.push(10);
			remove_request(10);
		}, 10);
		setTimeout(function(){
			worker_buffer3 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer3.addEventListener('message', accept_new_item);
			requests.push(13);
			remove_request(13);
		}, 2000);
		setTimeout(function(){
			worker_buffer4 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer4.addEventListener('message', accept_new_item);
			requests.push(15);
			remove_request(15);
		}, 100);
		// wait_until_buffered();
	} else if(buffer.length==1 & requests.length<=2) {
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(12);
			remove_request(12);
		}, 10);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(14);
			remove_request(14);
		}, 100);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(16);
			remove_request(16);
		}, 100);
	} else if(buffer.length==2 & requests.length<=2) {
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(17);
			remove_request(17);
		}, 10);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(19);
			remove_request(19);
		}, 100);
	} else if(buffer.length>3 & requests.length==0) {
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(18);
			remove_request(18);
		}, 10);
	}
}

function fill_buffers()
{
	console.log("buffer.length =", buffer.length, ", current requests =",requests.length);
	if(buffer.length==0 & requests.length<=2){
		setTimeout(function(){
			worker_buffer1 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer1.addEventListener('message', accept_new_item);
			requests.push(1);
			remove_request(1);
		}, 10);
		setTimeout(function(){
			worker_buffer3 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer3.addEventListener('message', accept_new_item);
			requests.push(3);
			remove_request(3);
		}, 2000);
		setTimeout(function(){
			worker_buffer4 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer4.addEventListener('message', accept_new_item);
			requests.push(5);
			remove_request(5);
		}, 100);
		wait_until_buffered();
	} else if(buffer.length==1 & requests.length<=2) {
		begin_trial();
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(2);
			remove_request(2);
		}, 10);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(4);
			remove_request(4);
		}, 100);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(6);
			remove_request(6);
		}, 100);
	} else if(buffer.length==2 & requests.length<=1) {
		begin_trial();
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_error_trial.js");
			worker_buffer2.addEventListener('message', accept_new_item);
			requests.push(7);
			remove_request(7);
		}, 10);
		setTimeout(function(){
			worker_buffer2 = new Worker("/static/js/retrieve_error_trial.js");
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
	buffer.push(JSON.parse(e.data));
	requests.shift();
	console.log("new item, buffer.length =", buffer.length, ", current requests =",requests.length);
	fill_buffers_only();

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