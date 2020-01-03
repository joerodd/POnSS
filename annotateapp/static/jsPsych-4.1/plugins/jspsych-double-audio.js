/**
 * jspsych-double-audio
 * Josh de Leeuw
 *
 * plugin for playing an audio file and getting a keyboard response
 *
 * documentation: docs.jspsych.org
 *
 **/

 (function($) {
 	jsPsych["double-audio"] = (function() {

 		var plugin = {};

 		var context = new AudioContext();

 		plugin.create = function(params) {

			//params = jsPsych.pluginAPI.enforceArray(params, ['stimuli', 'choices', 'data']);

			var trials = new Array(params.stimuli.length);

			for (var i = 0; i < trials.length; i++) {

				trials[i] = {};
				trials[i].audio_A_stim = jsPsych.pluginAPI.loadAudioFile(params.stimuli[i].A.sound);
				trials[i].audio_A_path = params.stimuli[i].A.sound;
				trials[i].visual_A = params.stimuli[i].A.visual;
				trials[i].audio_B_stim = jsPsych.pluginAPI.loadAudioFile(params.stimuli[i].B.sound);
				trials[i].audio_B_path = params.stimuli[i].B.sound;
				trials[i].visual_B = params.stimuli[i].B.visual;
				trials[i].trial_type = params.stimuli[i].trial_type;
				trials[i].choices = params.choices || [];
				// option to show image for fixed time interval, ignoring key responses
				//      true = image will keep displaying after response
				//      false = trial will immediately advance when response is recorded
				trials[i].continue_after_response = (typeof params.continue_after_response === 'undefined') ? true : params.continue_after_response;
				// timing parameters
				// trials[i].timing_stim = params.timing_stim || -1; // if -1, then show indefinitely
				trials[i].timing_first_stim = params.timing_first_stim || 600;
				trials[i].timing_second_stim = params.timing_second_stim || 600; // if -1, then second stim is shown until response.
				trials[i].timing_gap = params.timing_gap || 900;
				trials[i].timing_response = params.timing_response || -1; // if -1, then wait for response forever
				trials[i].prompt = (typeof params.prompt === 'undefined') ? "" : params.prompt;

			}

			return trials;
		};

		plugin.trial = function(display_element, trial) {
			// display_element.append($('<div>', {
			// 	html: "<div style='font-size: 35px; width=100%; text-align:center;'>Welke klinkt beter als een vraag?</div>",
			// 	"class": 'jspsych-prompt'}))
			// if any trial variables are functions
			// this evaluates the function and replaces
			// it with the output of the function
			trial = jsPsych.pluginAPI.normalizeTrialVariables(trial);

			// this array holds handlers from setTimeout calls
			// that need to be cleared if the trial ends early
			var setTimeoutHandlers = [];

			// play stimulus
			var source_A = context.createBufferSource();
			source_A.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.audio_A_stim);
			source_A.connect(context.destination);
			startTime_A = context.currentTime;
			source_A.start(startTime_A);
			display_element.html('<div id="outerid" class="outer deadouter">'+
            '<div class="middle">'+
            '<div class="inner">'+
            '<div class="speaker">'+
            "<img src='http://www.prosodicdevelopment.com/static/jsPsych-4.1/grey_speakers.png' class='jspsych-same-different-stimulus' />"+
            '</div>'+
            '</div>'+
            '</div>'+
            '</div>');

			// remove image after duration
			setTimeoutHandlers.push(setTimeout(function() {
				showBlankScreen();
			}, trial.timing_first_stim + 400));

			function showBlankScreen() {
				// $('.jspsych-same-different-stimulus').remove();

				setTimeoutHandlers.push(setTimeout(function() {
					showSecondStim();
				}, trial.timing_gap));
			}
			function showBlankScreenDone() {
				if(trial.trial_type=="discrimination"){
					display_element.html('<div id="outerid" class="outer">'+
            '<div class="middle">'+
            '<div class="inner">'+
            '<div class="speaker">'+
            "<img src='http://www.prosodicdevelopment.com/static/jsPsych-4.1/disc_buttons.png' class='jspsych-same-different-stimulus' />"+
            '</div>'+
            '</div>'+
            '</div>'+
            '</div>');
				} else {
					display_element.html('<div id="outerid" class="outer">'+
            '<div class="middle">'+
            '<div class="inner">'+
            '<div class="speaker">'+
            "<img src='http://www.prosodicdevelopment.com/static/jsPsych-4.1/coloured_speakers.png' class='jspsych-same-different-stimulus' />"+
            '</div>'+
            '</div>'+
            '</div>'+
            '</div>');
				}
			}
			function showSecondStim() {

				if (trial.timing_second_stim > 0) {
					setTimeoutHandlers.push(setTimeout(function() {
						$("#jspsych-same-different-second-stimulus").css('visibility', 'hidden');
					}, trial.timing_second_stim + 400));
				}

				var source_B = context.createBufferSource();
				source_B.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.audio_B_stim);
				source_B.connect(context.destination);
				// startTime_B = startTime_A + 0.4;
				startTime_B = context.currentTime;
				source_B.start(startTime_B);
				setTimeoutHandlers.push(setTimeout(function() {
					showBlankScreenDone();
				}, trial.timing_gap));
			// store response
			var response = {rt: -1, key: -1};

			// function to end trial when it is time
			var end_trial = function() {

				// kill any remaining setTimeout handlers
				for (var i = 0; i < setTimeoutHandlers.length; i++) {
					clearTimeout(setTimeoutHandlers[i]);
				}

				// stop the audio file if it is playing
				source_A.stop();
				source_B.stop();

				// kill keyboard listeners
				jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);

				// gather the data to store for the trial
				var trial_data = {
					"rt": response.rt,
					"A stimulus": trial.audio_A_path,
					"B stimulus": trial.audio_B_path,
					"key_press": response.key
				};

				jsPsych.data.write($.extend({}, trial_data, trial.data));

				// clear the display
				display_element.html('');

				// move on to the next trial
				if (trial.timing_post_trial > 0) {
					setTimeout(function() {
						jsPsych.finishTrial();
					}, trial.timing_post_trial);
				} else {
					jsPsych.finishTrial();
				}
			};

			// function to handle responses by the subject
			var after_response = function(info) {

				// only record the first response
				if(response.key == -1){
					response = info;
					document.getElementById("outerid").className = "outer deadouter";
				}

				if (trial.continue_after_response) {
					end_trial();
				}
			};

			// start the response listener
			var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse(after_response, trial.choices, 'audio', false, context, startTime_B);

			// end trial if time limit is set
			if (trial.timing_response > 0) {
				var t2 = setTimeout(function() {
					end_trial();
				}, trial.timing_response);
				setTimeoutHandlers.push(t2);
			}

		};
		};
		return plugin;
	})();
})(jQuery);
