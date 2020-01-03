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
var messagebox = document.getElementById('messagebox');
var messagetitle = document.getElementById('messagetitle');
var messagetext = document.getElementById('messagetext');

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
var listens;
var evaluation;
var trial_begun;

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
	subcontainer.innerHTML = "";
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


function play(){
	try{
		listens += 1
		var pre = 0.1; // 100ms delay from pressing play to playback
		var start_time = context.currentTime + pre;
		var source = context.createBufferSource();
		console.log(stim_sound);
		source.buffer = jsPsych.pluginAPI.getAudioBuffer(stim_sound);
		console.log(stim_start/1000);
		console.log(stim_end/1000);
		source.connect(context.destination)
		var duration = stim_end - stim_start;
		source.start(start_time);
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
	subcontainer.innerHTML = stim_label;
	left.style.opacity = 1;
	right.style.opacity = 1;
	floats.style.opacity = 1;
	left.style.transition = "all .1s linear";
	right.style.transition = "all .1s linear";
	floats.style.transition = "all .1s linear";
}

buffer = [
{
	"kind":"message",
	"title":"Welcome",
	"text":"Welcome! Your task is to evaluate the quality of a large set of automatic transcriptions.<br>In each trial, you'll hear a single word which the computer has segmented from continuous speech. You'll also see the waveform and spectrogram, and the computer's transcription.<br>You have to evaluate whether the transcription matches the audio. The audio should consist of <b>nothing more</b> and <b>nothing less</b> than the target word. You can listen again by clicking on the waveform, or pressing the spacebar.<div id = 'messagebutton' onclick='end_trial()'>next</div>"
},
{
	"kind":"message",
	"title":"Good transcriptions",
	"text":"Most of the time, the transcription will be a good match for the audio. In that case, you can respond positively by clicking on the green thumbs-up or pressing the Q key. <br> Because it is continuous speech, there will be some evidence of coarticulation, that's ok, you don't have to reject words for that reason.<div id = 'messagebutton' onclick='end_trial()'>next</div>"
},
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
	"kind":"message",
	"title":"Terrible transcriptions",
	"text":"Sometimes the recogniser makes bigger mistakes, and confuses non-speech for words. You should reject these by pressing the double thumbs-down button (below), or the B key.<div id = 'messagebutton' onclick='end_trial()'>next</div>"
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
	"kind":"message",
	"title":"Terrible transcriptions, continued",
	"text":"Sometimes the recogniser mistakes one word for another (or part of one word for another), or the participant produces a different word to the one they should have.<br>These cases need to be manually checked, so you should flag these words for further attention by pressing the flag button (below) or the M key. If there are extra 'intrusive' sounds within the word, or if you're really not sure about something for some other reason, then you can flag it too.<div id = 'messagebutton' onclick='end_trial()'>next</div>"
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
},
{
	"kind":"message",
	"title":"That's it!",
	"text":"If you make a mistake, you can press the undo button (below), or the Z key.<div id = 'messagebutton' onclick='end_trial()'>next</div>"
},
{
	"kind":"message",
	"title":"Summary",
	"text":'<br><table><tr><th>button</th><th>keyboard shortcut</th><th>meaning</th></tr><tr><tr><td><img src="/static/images/up.png" width=50px></td><td>Q</td><td>Word is perfectly segmented</td></tr><tr><td><img src="/static/images/down.png" width=50px></td><td>P</td><td>Some of the word is missing, or extra material is included</td></tr><tr><td><img src="/static/images/superbad.png" width=50px></td><td>B</td><td>The clip isn\'t speech at all</td></tr><tr><td><img src="/static/images/flag.png" width=50px></td><td>M</td><td>A different word is produced, or the clip needs a second look</td></tr><tr><td><img src="/static/images/undo.png" width=50px></td><td>Z</td><td>Delete last 20 seconds worth of annotations</td></tr><tr><td>[click on waveform]</td><td>space</td><td>Listen again</td></tr></table><br>If you have questions, I can be found in room 362 or emailed, joe.rodd@mpi.nl.<div id = "messagebutton" onclick="start_real()"">get started</div>'
},

]

function start_real(){
	window.location='/annotate/evaluate/';
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
		stim_start = new_item["candidate_onset"];
		stim_end = new_item["candidate_offset"];
		stim_label = new_item["candidate_label"]
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