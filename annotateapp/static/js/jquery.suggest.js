/*!
 * Suggest jQuery plugin
 *
 * Copyright (c) 2015 Florian Plank (http://www.polarblau.com/)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * USAGE:
 *
 * $('#container').suggest(haystack, {
 *   suggestionColor   : '#cccccc',
 *   moreIndicatorClass: 'suggest-more',
 *   moreIndicatorText : '&hellip;'
 * });
 *
 */

(function($) {

  $.fn.suggest = function(source_suggestions, options) {

    var settings = $.extend({
      suggestionColor       : '#ccc',
      moreIndicatorClass    : 'suggest-more',
      moreIndicatorText     : '&hellip;'
    }, options);

    return this.each(function() {

      $this = $(this);

      // this helper will show possible suggestions
      // and needs to match the input field in style
      var $suggest = $('#suggestion_box');
      $suggest.empty();

      var $more = $('#suggestion_more_span')
      .html(settings.moreIndicatorText)
      .hide();

      $this
        .attr({
          'autocomplete'    : "off",
          'spellcheck'      : "false",
          'dir'             : "ltr"
        })
        // by setting the background to transparent, we will
        // be able to "see through" to the suggestion helper
        .css({
          'background'      : 'transparent'
        })
        // .wrap($('<div/>', {
        //   'css': {
        //     'position'      : 'relative',
        //     'paddingBottom' : '1em'
        //   }
        // }))


        .bind('keydown', function(e){
          var code = (e.keyCode ? e.keyCode : e.which);
          // tab for playing sound
          if (code == 9) {
              e.preventDefault();
              // tab
          }
          // disabled punctuation - ; = [ ] , . / § \ ` '
          else if (code == 173 || code == 59 || code == 61 || code == 219 || code == 221 || code == 188 || code == 190 || code == 191 || code == 220  | code == 192 | code == 222) {
              e.preventDefault();

          // let's prevent default enter behavior while a suggestion
          // is being accepted (e.g. while submitting a form)
          } else if (code == 13) {
            if (!$suggest.is(':empty')) {
              e.preventDefault();
            }

          // use arrow keys to cycle through suggestions
          } else if (code == 38 || code == 40) {
            e.preventDefault();
            var suggestions = $(this).data('suggestions');

            if (suggestions.all.length > 1) {
              // arrow down:
              if (code == 40 && suggestions.index < suggestions.all.length - 1) {
                suggestions.suggest.html(suggestions.all[++suggestions.index]);
              // arrow up:
              } else if (code == 38 && suggestions.index > 0) {
                suggestions.suggest.html(suggestions.all[--suggestions.index]);
              }
              $(this).data('suggestions').index = suggestions.index;
            }
          }
        })

        .bind('keyup', function(e) {
          var code = (e.keyCode ? e.keyCode : e.which);

          if (code == 9) {
              // tab
              play_press();
          }

          // Have the arrow keys been pressed?
          if (code == 38 || code == 40) {
            return false;
          }

          // space code 32
          if (code == 32){
            $suggest.empty();
          }

          // be default we hide the "more suggestions" indicator
          $more.hide();

          // what has been input?
          var needle = $(this).val();

          // convert spaces to make them visible
          var needleWithWhiteSpace = needle.replace(' ', '&nbsp;');

          // accept suggestion with '.' or 'enter'
          // if the suggestion hasn't been accepted yet
          if (code == 59 || code == 190) {
            // only accept if there's anything suggested
            if ($suggest.text().length > 0) {
              e.preventDefault();
              var suggestions = $(this).data('suggestions');
              $(this).val(suggestions.terms[suggestions.index] + " ");
              // clean the suggestion for the looks
              $suggest.empty();
              console.log($(this).val())
              for ( var i = 0; i < haystack.length; i++ ) {
                haystack[i] = $(this).val() + base_vocabulary[i];
              }
              return false;
            }
          // if =, finish trial
          } else if (code == 61) {
            proceed_press();
          // if [, mark as superbad
          } else if (code == 219) {
            superbad_press();
          // if ], flag
          } else if (code == 221) {
            flag_press();
          } else if (code == 222) {
            slide_press();
          }


          // on space or delete, also update the haystack
          // if the suggestion hasn't been accepted yet
          else if (code == 32 || code == 46 || code == 8) {
            // only accept if there's anything suggested
              for ( var i = 0; i < haystack.length; i++ ) {
                haystack[i] = $(this).val() + base_vocabulary[i];
              }
              $suggest.empty();
              return false;
          }

          // make sure the helper is empty
          $suggest.empty();

          // if nothing has been input, leave it with that
          if (!$.trim(needle).length) {
            return false;
          }

          // see if anything in source_suggestions matches the input
          // by escaping the input' string for use with regex
          // we allow to search for terms containing specials chars as well
          var regex = new RegExp('^' + needle.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i');
          var suggestions = [], terms = [];
          for (var i = 0, l = source_suggestions; i < l.length; i++) {
            if (regex.test(l[i])) {
              terms.push(l[i]);
              suggestions.push(needleWithWhiteSpace + l[i].slice(needle.length));
            }
          }
          if (suggestions.length > 0) {
            // if there's any suggestions found, use the first
            // don't show the suggestion if it's identical with the current input
            if (suggestions[0] !== needle) {
              $suggest.html(suggestions[0]);
            }
            // store found suggestions in data for use with arrow keys
            $(this).data('suggestions', {
              'all'    : suggestions,
              'terms'  : terms,
              'index'  : 0,
              'suggest': $suggest
            });

            // show the indicator that there's more suggestions available
            // only for more than one suggestion
            if (suggestions.length > 1) {
              $more.show();
            }
          }
        })

        // clear suggestion on blur
        .bind('blur.suggest', function(){
          $suggest.empty();
        });
        $("body").bind('keydown', function(e) {
          var code = (e.keyCode ? e.keyCode : e.which);
          if (code == 222) {
            e.preventDefault();
          }
        });

        $("body").bind('keyup', function(e) {
          var code = (e.keyCode ? e.keyCode : e.which);

          if (code == 9) {
              e.preventDefault();
              // tab
              play_press();

              // if =, finish trial
          } else if (code == 61) {
            proceed_press();
          // if [, mark as superbad
          } else if (code == 219) {
            superbad_press();
          // if ], flag
          } else if (code == 221) {
            flag_press();
          }
          // if apostrophe, slide
           else if (code == 222) {
            e.preventDefault();
            slide_press();
          }
        });

        // insert the suggestion helpers within the wrapper
        // $suggest.insertAfter($this);
        // $more.insertAfter($suggest);

    });



  };

  /* A little helper to calculate the sum of different
   * CSS properties around all four sides
   *
   * EXAMPLE:
   * $('#my-div').cssSum('padding');
   */
  $.fn.cssShortForAllSides = function(property) {
    var $self = $(this), sum = [];
    var properties = $.map(['Top', 'Right', 'Bottom', 'Left'], function(side){
      return property + side;
    });
    $.each(properties, function(i, e) {
      sum.push($self.css(e) || "0");
    });
    return sum.join(' ');
  };
})(jQuery);
