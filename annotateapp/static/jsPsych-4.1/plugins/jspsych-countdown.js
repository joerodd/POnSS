/* jspsych-text.js
 * Josh de Leeuw
 *
 * This plugin displays text (including HTML formatted strings) during the experiment.
 * Use it to show instructions, provide performance feedback, etc...
 *
 * documentation: docs.jspsych.org
 *
 *
 */

(function($) {
    jsPsych.countdown = (function() {

        var plugin = {};

        plugin.create = function(params) {

            params = jsPsych.pluginAPI.enforceArray(params, ['text', 'cont_key']);

            var trials = new Array(params.text.length);
            for (var i = 0; i < trials.length; i++) {
                trials[i] = {};
                trials[i].text = params.text[i]; // text of all trials
            }
            return trials;
        };

        plugin.trial = function(display_element, trial) {

            // if any trial variables are functions
            // this evaluates the function and replaces
            // it with the output of the function
            trial = jsPsych.pluginAPI.normalizeTrialVariables(trial);
            var setTimeoutHandlers = [];

            // set the HTML of the display target to replaced_text.
            display_element.html(
'<div id="outerid" class="outer">'+
'<div class="middle">'+
'<div class="inner">'+'<div class="count">3</div>'+
'</div>'+
'</div>'+
'</div>');
            var t1 = setTimeout(function() {
                    display_element.html(
'<div id="outerid" class="outer">'+
'<div class="middle">'+
'<div class="inner">'+'<div class="count">2</div>'+
'</div>'+
'</div>'+
'</div>');
            }, 600);
            setTimeoutHandlers.push(t1)
            var t2 = setTimeout(function() {
                    display_element.html(
'<div id="outerid" class="outer">'+
'<div class="middle">'+
'<div class="inner">'+'<div class="count">1</div>'+
'</div>'+
'</div>'+
'</div>');
            }, 1200);
            setTimeoutHandlers.push(t2)
            var t3 = setTimeout(function() {
                    clearTimeout(setTimeoutHandlers);
                    jsPsych.finishTrial();
            }, 1800);
            setTimeoutHandlers.push(t3)


        };

        return plugin;
    })();
})(jQuery);
