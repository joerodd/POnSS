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
var left = document.getElementById('left');
var right = document.getElementById('right');
var middle = document.getElementById('middle');
var floats = document.getElementById('floats');
var undo = document.getElementById('undo');
var superbad = document.getElementById('superbad');
var subcontainer = document.getElementById('subcontainer');
var text_slot = document.getElementById('text_slot');
var messagebox = document.getElementById('messagebox');
var messagetitle = document.getElementById('messagetitle');
var messagetext = document.getElementById('messagetext');
var left_cursor = document.getElementById('left_cursor');
var right_cursor = document.getElementById('right_cursor');

window.addEventListener("keyup", dealWithKeyboard, false);

window.addEventListener('resize', refresh_cursors);

function dealWithKeyboard(e) {
	// gets called when any of the keyboard events are overheard
	shifted = e.shiftKey;
	alted = e.altKey;
	if (e.keyCode == "87") {
		// W
		repair_press();
	}
	if (e.keyCode == "79") {
		// P
		superbad_press();
	}
	if (e.keyCode == "32") {
		// space bar
		play_press();
	}
	if (e.keyCode == "9") {
		// tab
		play_press();
	}
	if (e.keyCode == "90") {
		// Z
		undo_press();
	}
	if (e.keyCode == "71") {
		// G
		good_press();
	}
	if (e.keyCode == "77") {
		// M
		flag_press();
	}
	if (e.keyCode == "37") {
		// space bar
		left_press(shifted,alted);
	}
	if (e.keyCode == "39") {
		// space bar
		right_press(shifted,alted);
	}
	if (e.keyCode == "38") {
		// space bar
		up_press(shifted,alted);
	}
	if (e.keyCode == "40") {
		// space bar
		down_press(shifted,alted);
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


function left_press(shifted,alted)
{
	console.log(shifted)
	if(shifted){
		left_cursor_position_s -= 0.02;
	} else if(alted) {
		left_cursor_position_s -= 0.001;
	} else {
		left_cursor_position_s -= 0.005;
	}
	left_cursor_position_s = Math.max(left_cursor_position_s,0)
	refresh_cursors();
	play();
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
	left_cursor_position_s = Math.min(left_cursor_position_s,right_cursor_position_s)
	refresh_cursors();
	play();
}

function down_press(shifted,alted)
{
	console.log(shifted)
	if(shifted){
		right_cursor_position_s -= 0.02;
	} else if(alted) {
		right_cursor_position_s -= 0.001;
	} else {
		right_cursor_position_s -= 0.005;
	}
	right_cursor_position_s = Math.max(left_cursor_position_s,right_cursor_position_s)
	refresh_cursors();
	play();
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
	right_cursor_position_s = Math.min(right_cursor_position_s,clip_end)
	refresh_cursors();
	play();
}

function good_press()
{
	if (load_status==true & response_allowed){
		left.style.opacity = 0.6;
		left.style.transition = "all .1s linear";
		setTimeout(function () {
			left.style.opacity = 1
			left.style.transition = "all .1s linear";
		}, 200)
		setTimeout(function () {
			end_trial()
		}, 200)
	}
}

function repair_press()
{
	if (load_status==true & response_allowed){
		right.style.opacity = 0.6;
		right.style.transition = "all .1s linear";
		setTimeout(function () {
			right.style.opacity = 1
			right.style.transition = "all .1s linear";
		}, 200)
		setTimeout(function () {
			end_trial()
		}, 200)
	}
}

function superbad_press()
{
	if (load_status==true & response_allowed){
		right.style.opacity = 0.6;
		right.style.transition = "all .1s linear";
		setTimeout(function () {
			right.style.opacity = 1
			right.style.transition = "all .1s linear";
		}, 200)
		setTimeout(function () {
			end_trial()
		}, 200)
	}
}

function flag_press()
{
	if (load_status==true & response_allowed){
		flag.style.opacity = 0.6;
		flag.style.transition = "all .1s linear";
		setTimeout(function () {
			flag.style.opacity = 1
			flag.style.transition = "all .1s linear";
		}, 200)
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
			undo.style.opacity = 1
			undo.style.transition = "all .1s linear";
		}, 200)
		setTimeout(function () {
			undo_last()
		}, 200)
}

function end_trial()
{
	text_slot.innerHTML = "";
	response_allowed = false;
	right.style.opacity = 0.6;
	right.style.transition = "all .1s linear";
	left.style.opacity = 0.6;
	left.style.transition = "all .1s linear";
	floats.style.opacity = 0.6;
	floats.style.transition = "all .1s linear";
	subcontainer.style.opacity = 0.1;
	subcontainer.style.transition = "all .1s linear";
	left_cursor.style.opacity = 0.05;
	left_cursor.style.transition = "opacity .1s linear";
	right_cursor.style.opacity = 0.05;
	right_cursor.style.transition = "opacity .1s linear";
	begin_trial();
}



function submit_evaluation(accepted) {
    console.log("submit evaluation!")
    var evaluation_submitted = Date.now()
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
};

function submit_repair(accepted) {
    console.log("submit repair!")
    var evaluation_submitted = Date.now()
    var RT = evaluation_submitted - trial_begun;
    $.ajax({
        url : "/annotate/accept_result_retrim/", // the endpoint
        type : "POST", // http method
        data : {
			word_candidate: candidate_id, 
			evaluator: evaluator,
        	timestamp : Date.now(),
        	listens: listens,
        	RT: RT,
        	left_cursor: left_cursor_position_s*1000,
        	right_cursor: right_cursor_position_s*1000,
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

function undo_last() {
    console.log("undo!")
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
};


function refresh(){
	try{
		listens += 1
		var pre = 0.1; // 100ms delay from pressing play to playback
		var start_time = context.currentTime + pre;
		source =  context.createBufferSource();
		console.log(stim_sound);
		source.buffer = jsPsych.pluginAPI.getAudioBuffer(stim_sound);

		console.log(stim_start/1000);
		console.log(stim_end/1000);
		source.connect(context.destination)
		var duration = stim_end - stim_start;
		} catch(TypeError){
		console.log("play issue", stim_sound);
	}
}

function play(onset_shift=0,offset_shift=0){
	if(source){
		try{
			source.stop();
		} catch(InvalidStateError){};
	}

		listens += 1
		var pre = 0.02; // 100ms delay from pressing play to playback
		var start_time = context.currentTime + pre;
		source =  context.createBufferSource();
		console.log(stim_sound);
		source.buffer = jsPsych.pluginAPI.getAudioBuffer(stim_sound);

		console.log(stim_start/1000);
		console.log(stim_end/1000);
		source.connect(context.destination)
		buffer_duration = source.buffer.duration;
		start_offset = left_cursor_position_s;
		start_duration = right_cursor_position_s - left_cursor_position_s;


		source.start(start_time,offset=start_offset,duration=start_duration);

}

function play_press()
{
	if (load_status==true & response_allowed){
		var duration = stim_end - stim_start;
		subcontainer.style.opacity = 0.6;
		subcontainer.style.transition = "all .1s linear";
		setTimeout(function () {
			subcontainer.style.opacity = 1
			subcontainer.style.transition = "all .1s linear";
		}, 200)
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
			subcontainer.style.opacity = 1
			subcontainer.style.transition = "all .1s linear";
		}, 200)
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
	text_slot.innerHTML = stim_label;
	left.style.opacity = 1;
	right.style.opacity = 1;
	floats.style.opacity = 1;
	left.style.transition = "all .1s linear";
	right.style.transition = "all .1s linear";
	floats.style.transition = "all .1s linear";
}

function refresh_cursors(){
	console.log("refresh cursors")
	pixels_per_s = (Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.4) / jsPsych.pluginAPI.getAudioBuffer(stim_sound).duration;
	left_cursor.style.left = (pixels_per_s * left_cursor_position_s)-10;
	right_cursor.style.left = pixels_per_s * right_cursor_position_s;

}

function poll_cursors(){
	// console.log(pixels_per_s);
	pixels_per_s = (Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.4) / jsPsych.pluginAPI.getAudioBuffer(stim_sound).duration;
	// console.log(pixels_per_s);
	left_cursor_position_s = (parseFloat(left_cursor.style.left)+10) / pixels_per_s;
	// console.log(left_cursor_position_s);
	right_cursor_position_s = parseFloat(right_cursor.style.left) / pixels_per_s;
}

function begin_trial(){
	console.log("begin_trial");
	new_item = buffer.shift();
	if (new_item["kind"] == "message"){
		messagebox.style.top = "15vh";
		messagetitle.innerHTML = new_item["title"];
		messagetext.innerHTML = new_item["text"];
	} else {
		messagebox.style.top = "-100vh";
		candidate_id = new_item["candidate_id"];
		stim_sound = jsPsych.pluginAPI.loadAudioFile("/media/word_candidate_audio_retrim/" + new_item['candidate_audio']);
		attempts = 0;
		success = false;
		setTimeout(function(){
				stim_duration = jsPsych.pluginAPI.getAudioBuffer(stim_sound).duration;
				clip_start = 0;
				clip_end = stim_duration;
				left_cursor_position_s = clip_start + 0.18;
				right_cursor_position_s = clip_end - 0.18;
				refresh_cursors();
				stim_start = new_item["candidate_onset"];
				stim_end = new_item["candidate_offset"];
				stim_label = new_item["candidate_label"];
				load_status = true;
				listens = 0;
				var urlString = 'url(/media/wavpics_retrim/' + new_item["candidate_image"] + ')';
				subcontainer.style.backgroundImage = urlString;
				subcontainer.style.opacity = 1;
				subcontainer.style.transition = "all .1s linear";
				left_cursor.style.opacity = 0.6;
				left_cursor.style.transition = "opacity .1s linear";
				right_cursor.style.opacity = 0.6;
				right_cursor.style.transition = "opacity .1s linear";

				// play sound first time
				first_play();
			}, 800);
}
}

function wait_until_buffered(){
	if(buffer.length == 0){
		console.log("waiting, buffer.length == 0, current requests =",requests.length);
		setTimeout(function(){wait_until_buffered();}, 500);
	} else {
		begin_trial();
	};
}

var requests = [];

function remove_request(target){
	setTimeout(function(){
		index = requests.indexOf(target);
		if(index >=0){
			requests.splice(index,1)
			console.log("removed request", target);
		};
	},30000)
}


buffer = [
{
	"kind":"message",
	"title":"Welcome",
	"text":"Welcome! Your task is to 're-trim' the words that you marked as being badly segmented in the previous task.<div id = 'messagebutton' onclick='end_trial()'>next</div>"
},
{
	"kind":"message",
	"title":"Repairable segmentations",
	"text":"You do that by moving the two cursors, so that the word, and nothing but the word is included between them.<br>	You can drag the boundaries with the mouse, or alternatively, move them by pressing the arrow keys. <br>The left and right arrow keys control the left hand boundary, the up and down arrow keys control the righthand boundary.<br>	You can move in larger jumps by holding shift, or smaller steps by holding alt.<br>Once you've repositioned the boundaries, click the green screwdriver, or press the W key. <div id = 'messagebutton' onclick='end_trial()'>next</div>"
},
{
	"kind":"practice_trial",
	"candidate_audio": "good1.wav",
	"candidate_image": "good1.png",
	"candidate_label": "hagel",
	"candidate_onset": 2820,
	"candidate_offset": 3120,
},
{
	"kind":"practice_trial",
	"candidate_audio": "good2.wav",
	"candidate_image": "good2.png",
	"candidate_label": "vriezer",
	"candidate_onset": 1211,
	"candidate_offset": 1658,
},
{
	"kind":"practice_trial",
	"candidate_audio": "good3.wav",
	"candidate_image": "good3.png",
	"candidate_label": "havik",
	"candidate_onset": 1428,
	"candidate_offset": 1867,
},
{
	"kind":"message",
	"title":"Irrepairable segmentations",
	"text":"If you can't correct the segmentation because there is not enough of the word shown, click on the orange, broken screwdriver, or press O.<div id = 'messagebutton' onclick='end_trial()'>next</div>"
},
{
	"kind":"practice_trial",
	"candidate_audio": "bad1.wav",
	"candidate_image": "bad1.png",
	"candidate_label": "hamer",
	"candidate_onset": 2890,
	"candidate_offset": 3120,
},
{
	"kind":"practice_trial",
	"candidate_audio": "bad2.wav",
	"candidate_image": "bad2.png",
	"candidate_label": "hagel",
	"candidate_onset": 2642,
	"candidate_offset": 2930,
},
{
	"kind":"message",
	"title":"Terrible segmentations",
	"text":"Most of the recogniser's bigger mistakes should have been excluded already in the previous round. Trials where speech got recognised for non-speech should reject these by the double thumbs-down button (below), or the B key.<div id = 'messagebutton' onclick='end_trial()'>next</div>"
},
{
	"kind":"message",
	"title":"Terrible segmentations, continued",
	"text":"Sometimes the recogniser mistakes one word for another (or part of one word for another), or the participant produces a different word to the one they should have.<br>These cases need to be manually checked, so you should flag these words for further attention by pressing the flag button (below) or the M key. If there are extra 'intrusive' sounds within the word, or if you're really not sure about something for some other reason, then you can flag it too.<div id = 'messagebutton' onclick='end_trial()'>next</div>"
},
{
	"kind":"message",
	"title":"That's it!",
	"text":"Have loads of fun!!.<div id = 'messagebutton' onclick='end_trial()'>next</div>"
},
{
	"kind":"message",
	"title":"Summary",
	"text":'<table><tr><th>button</th><th>keyboard shortcut</th><th>meaning</th></tr><tr><tr><td><img src="/static/images/repaired_small.png" width=50px></td><td>Q</td><td>I fixed it!</td></tr><tr><td><img src="/static/images/irrepairable_small.png" width=50px></td><td>P</td><td>I couldn\'t fix it :(</td></tr><tr><td><img src="/static/images/superbad.png" width=50px></td><td>B</td><td>The clip isn\'t speech at all</td></tr><tr><td><img src="/static/images/flag.png" width=50px></td><td>M</td><td>A different word is produced, or the clip needs a second look</td></tr><tr><td></td><td>→</td><td>Move left cursor later</td></tr><tr><td></td><td>←</td><td>Move left cursor earlier</td></tr><tr><td></td><td>↑</td><td>Move right cursor later</td></tr><tr><td></td><td>↓</td><td>Move right cursor earlier</td></tr><tr><td>[click on waveform]</td><td>space</td><td>Listen again</td></tr></table><br>If you have questions, I can be found in room 362 or emailed, joe.rodd@mpi.nl.'
},

]



function accept_new_item(e){
	buffer.push(JSON.parse(e.data));
	requests.shift();
	console.log("new item, buffer.length =", buffer.length, ", current requests =",requests.length);
		

}


if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)) || (navigator.userAgent.match(/iPad/i))) {

    document.write('<a id="init" ontouchstart="javascript:sndInit();"></a>');

    function sndInit(){
    snd.play();
    snd.pause();
    document.getElementById('init').style.display = 'none';
    }
}

begin_trial();