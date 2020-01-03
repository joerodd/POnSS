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


window.addEventListener("keydown", dealWithKeyboard, false);

function dealWithKeyboard(e) {
	// gets called when any of the keyboard events are overheard
	if (e.keyCode == "81") {
		// Q
		good_press();
	}
	if (e.keyCode == "80") {
		// P
		bad_press();
	}
	if (e.keyCode == "32") {
		// space bar
		play_press();
	}
	if (e.keyCode == "90") {
		// space bar
		undo_press();
	}
	if (e.keyCode == "66") {
		// space bar
		superbad_press();
	}
	if (e.keyCode == "77") {
		// space bar
		flag_press();
	}
	if (e.keyCode == "37") {
		// space bar
		left_press();
	}
	if (e.keyCode == "39") {
		// space bar
		right_press();
	}
	if (e.keyCode == "38") {
		// space bar
		up_press();
	}
	if (e.keyCode == "40") {
		// space bar
		down_press();
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
var onset_shift = 0.08;
var offset_shift = 0.08;
var pixels_per_s;
var left_cursor_position_s;
var right_cursor_position_s;
var source;


function left_press()
{
	if(event.ShiftKey){
		onset_shift -= 0.1;
	} else if(event.AltKey) {
		onset_shift -= 0.001;
	} else {
		onset_shift -= 0.005;
	}
	console.log(onset_shift);
	play(onset_shift);
}

function right_press()
{
	if(event.ShiftKey){
		onset_shift += 0.1;
	} else if(event.AltKey) {
		onset_shift += 0.001;
	} else {
		onset_shift += 0.005;
	}
	play(onset_shift = onset_shift);
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

function bad_press()
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
		superbad.style.opacity = 0.6;
		superbad.style.transition = "all .1s linear";
		setTimeout(function () {
			superbad.style.opacity = 1
			superbad.style.transition = "all .1s linear";
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
		buffer_duration = source.buffer.duration;
		start_offset = onset_shift;
		start_duration = buffer_duration + offset_shift - start_offset;


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

buffer = [
{
	"kind":"practice_trial",
	"candidate_audio": "good1.wav",
	"candidate_image": "good1.png",
	"candidate_label": "wafel",
},
{
	"kind":"practice_trial",
	"candidate_audio": "good2.wav",
	"candidate_image": "good2.png",
	"candidate_label": "vriezer",
},
{
	"kind":"message",
	"title":"Less good transcriptions",
	"text":"If there is even a little bit of the word missing, or a little bit of an adjacent word included in the clip, you should reject it by clicking on the red thumbs-down or pressing the P key.<div id = 'messagebutton' onclick='end_trial()'>next</div>"
},
{
	"kind":"practice_trial",
	"candidate_audio": "early1.wav",
	"candidate_image": "early1.png",
	"candidate_label": "havik",
},
{
	"kind":"practice_trial",
	"candidate_audio": "late1.wav",
	"candidate_image": "late1.png",
	"candidate_label": "wafel",
},
{
	"kind":"practice_trial",
	"candidate_audio": "early2.wav",
	"candidate_image": "early2.png",
	"candidate_label": "nagel",
},
{
	"kind":"practice_trial",
	"candidate_audio": "early3.wav",
	"candidate_image": "early3.png",
	"candidate_label": "slager",
},
{
	"kind":"practice_trial",
	"candidate_audio": "late2.wav",
	"candidate_image": "late2.png",
	"candidate_label": "visum",
},
{
	"kind":"practice_trial",
	"candidate_audio": "noise1.wav",
	"candidate_image": "noise1.png",
	"candidate_label": "visum",
},
{
	"kind":"practice_trial",
	"candidate_audio": "noise2.wav",
	"candidate_image": "noise2.png",
	"candidate_label": "zoemer",
},
{
	"kind":"practice_trial",
	"candidate_audio": "noise3.wav",
	"candidate_image": "noise3.png",
	"candidate_label": "visum",
},
{
	"kind":"practice_trial",
	"candidate_audio": "wrong1.wav",
	"candidate_image": "wrong1.png",
	"candidate_label": "slager",
},
{
	"kind":"practice_trial",
	"candidate_audio": "wrong2.wav",
	"candidate_image": "wrong2.png",
	"candidate_label": "vinger",
},
{
	"kind":"practice_trial",
	"candidate_audio": "wrong3.wav",
	"candidate_image": "wrong3.png",
	"candidate_label": "hamer",
}
]

function start_real(){
	window.location='/annotate/evaluate/';
}

function refresh_cursors(){
	console.log("refresh cursors")
	pixels_per_s = (Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.4) / jsPsych.pluginAPI.getAudioBuffer(stim_sound).duration;
	left_cursor.style.left = pixels_per_s * left_cursor_position_s;
	right_cursor.style.left = pixels_per_s * right_cursor_position_s;

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
		stim_sound = jsPsych.pluginAPI.loadAudioFile("/static/practice_content/" + new_item['candidate_audio']);
		setTimeout(function(){
			console.log("calc stim_dur")
			stim_duration = jsPsych.pluginAPI.getAudioBuffer(stim_sound).duration;
			clip_start = 0;
			clip_end = stim_duration;
			left_cursor_position_s = clip_start + 0.08;
			right_cursor_position_s = clip_end - 0.08;
			refresh_cursors();
		}, 400);
		
		stim_start = new_item["candidate_onset"];
		stim_end = new_item["candidate_offset"];
		stim_label = new_item["candidate_label"];
		load_status = true;
		listens = 0;
		var urlString = 'url(/static/practice_content/' + new_item["candidate_image"] + ')';
		subcontainer.style.backgroundImage = urlString;
		subcontainer.style.opacity = 1;
		subcontainer.style.transition = "all .1s linear";
		// play sound first time
		setTimeout(function(){first_play()}, 400);
	}
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
worker_buffer1 = new Worker("/static/js/retrieve_trial.js");