/**
 * jspsych-single-audio
 * Josh de Leeuw
 *
 * plugin for playing an audio file and getting a keyboard response
 *
 * documentation: docs.jspsych.org
 *
 **/

(function($) {
	jsPsych["single-audio-rating"] = (function() {

		var plugin = {};

		var context = new AudioContext();

		plugin.create = function(params) {

			//params = jsPsych.pluginAPI.enforceArray(params, ['stimuli', 'choices', 'data']);

			var trials = new Array(params.stimuli.length);

			for (var i = 0; i < trials.length; i++) {

				trials[i] = {};
				trials[i].audio_stim = jsPsych.pluginAPI.loadAudioFile(params.stimuli[i]);
				trials[i].audio_path = params.stimuli[i];
				trials[i].choices = params.choices || [];
				// option to show image for fixed time interval, ignoring key responses
				//      true = image will keep displaying after response
				//      false = trial will immediately advance when response is recorded
				trials[i].continue_after_response = (typeof params.continue_after_response === 'undefined') ? true : params.continue_after_response;
				// timing parameters
				// trials[i].timing_stim = params.timing_stim || -1; // if -1, then show indefinitely
				trials[i].timing_response = params.timing_response || -1; // if -1, then wait for response forever
				trials[i].prompt = (typeof params.prompt === 'undefined') ? "" : params.prompt;

			}

			return trials;
		};

		plugin.trial = function(display_element, trial) {

			// if any trial variables are functions
			// this evaluates the function and replaces
			// it with the output of the function
			trial = jsPsych.pluginAPI.normalizeTrialVariables(trial);

			// this array holds handlers from setTimeout calls
			// that need to be cleared if the trial ends early
			var setTimeoutHandlers = [];

			var number_of_listens = 2;

			// play stimulus
			var source = context.createBufferSource();
			source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.audio_stim);
			source.connect(context.destination);
			startTime = context.currentTime + 0.1;
			var firstStartTime = (new Date()).getTime();
			source.start(startTime);

			display_element.html('<div id="outerid" class="outer">'+
'<div class="middle">'+
'<div class="inner">'+
'<div class="scale">'+
'<ul class="likert">'+
'<li>'+
  '<div class="endlabel">'+
  'Slecht voorbeeld'+
  "</div>"+
'</li>'+
'<li>'+
'<input type="radio" name="radio" id="radio1" value=1 class="radio"/>'+
'<label for="radio1"></label>'+
'</li>'+
'<li>'+
  '<input type="radio" name="radio" id="radio2" value=2 class="radio"/>'+
'<label for="radio2"></label>'+
'</li>'+
'<li>'+
'<input type="radio" name="radio" id="radio3" value=3 class="radio"/>'+
'<label for="radio3"></label>'+
'</li>'+
'<li>'+
'<input type="radio" name="radio" id="radio4" value=4 class="radio"/>'+
'<label for="radio4"></label>'+
'</li>'+
'<li>'+
'<input type="radio" name="radio" id="radio5" value=5 class="radio"/>'+
'<label for="radio5"></label>'+
'</li>'+
'<li>'+
  '<div class="endlabel">'+
  'Goed voorbeeld'+
  '</div>'+
'</li>'+
'</ul>'+
  '</div>'+
'<div class="buttons">'+
'<div class="buttonsinner">'+
'<a href="#"><div id="jspsych-survey-likert-listen" class="button livebutton buttonleft">luister</div></a> <a href="#"><div id="jspsych-survey-likert-next" class="button livebutton buttonleft">volgende</div></a>'+
'</div>'+
'</div>'+
'</div>'+
'</div>'+
'</div>');
			// add submit button
			// display_element.append($('<button>', {
			// 	'id': 'jspsych-survey-likert-next',
			// }));
			// $("#jspsych-survey-likert-next").html('Submit Answers');
			$("#jspsych-survey-likert-next").click(function() {
			rating = $('input[name=radio]:checked').val();
			// measure response time
			var endTime = (new Date()).getTime();
			var response_time = endTime - firstStartTime;
			if (rating != undefined) {
				// alert(rating);
				document.getElementById("outerid").className = "outer deadouter";
				        // next trial
			        if (trial.timing_post_trial > 0) {
			          setTimeout(function() {
			            jsPsych.finishTrial();
			          }, trial.timing_post_trial);
			        } else {
			          jsPsych.finishTrial();
			        }
					jsPsych.data.write($.extend({}, {
					"rt": response_time,
					"stimulus":trial.audio_path,
					"rating": rating,
					"playcount": 3 - number_of_listens,
					}, trial.data));
			}
      });

			// add listen button
			// display_element.append($('<button>', {
			// 	'id': 'jspsych-survey-likert-listen',
			// }));
			// $("#jspsych-survey-likert-listen").html('listen');
			$("#jspsych-survey-likert-listen").click(function() {
				if (number_of_listens>0){
					var source = context.createBufferSource();
					source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.audio_stim);
					source.connect(context.destination);
					subsequentStartTime = context.currentTime + 0.1;
					source.start(subsequentStartTime);
					number_of_listens -= 1
				if (number_of_listens == 0){
					document.getElementById("jspsych-survey-likert-listen").className = "button deadbutton buttonleft";
				}
				} 
      });

			// end trial if time limit is set
			if (trial.timing_response > 0) {
				var t2 = setTimeout(function() {
					end_trial();
				}, trial.timing_response);
				setTimeoutHandlers.push(t2);
			}

		};

		return plugin;
	})();
})(jQuery);
