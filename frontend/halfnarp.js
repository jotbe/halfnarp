function toggle_grid(isList) {
    $('.room-label').toggleClass('hidden', isList );
    $('.track h2').toggleClass('hidden', !isList );
    $('.event').toggleClass('event-in-list', isList );
    $('.event').toggleClass('event-in-calendar', !isList );
    $('.event').toggleClass('hidden', !isList );
    $('.guide').toggleClass('hidden', isList );
}

function do_the_halfnarp() {
  var halfnarpAPI     = '/-/talkpreferences';
  var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));

  $.extend($.expr[':'], {
      'containsi': function(elem, i, match, array)
      {
      return (elem.textContent || elem.innerText || '').toLowerCase()
      .indexOf((match[3] || '').toLowerCase()) >= 0;
      }
  });

  /* Add callback for submit click */
  $('.submit').click( function() {
    var myapi;

    /* Get user's preferences and try to save them locally */
    var ids = $('.selected').map( function() {
        return parseInt($(this).attr('event_id'));
      }).get();
    try {
      localStorage['31C3-halfnarp'] = ids;
      myapi = localStorage['31C3-halfnarp-api'];
    } catch(err) {
      alert('Storing your choices locally is forbidden.');
    }

    /* Convert preferences to JSON and post them to backend */
    var request = JSON.stringify({'talk_ids': ids});
    if( !myapi || !myapi.length ) {
      /* If we do not have resource URL, post data and get resource */
      $.post( halfnarpAPI, request, function( data ) {
        $('.info span').text('submitted');
        $('.info').removeClass('hidden');
        try {
          localStorage['31C3-halfnarp-api'] = data['update_url'];
        } catch(err) {}
      }, 'json' ).fail(function() {
        $('.info span').text('failed :(');
        $('.info').removeClass('hidden');
      });
    } else {
      /* If we do have a resource URL, update resource */
      $.ajax({
        type: 'PUT',
        url: myapi,
        data: request,
        dataType: 'json',
      }).done(function(msg) {
        $('.info span').text('updated');
        $('.info').removeClass('hidden');
      }).fail(function(msg) {
        $('.info span').text('failed');
        $('.info').removeClass('hidden');
      });
    }

    /* Tell QRCode library to update and/or display preferences for Apps */
    $('#qrcode').empty();
    $('#qrcode').qrcode({width: 224, height: 224, text: request});
    $('#qrcode').removeClass('hidden');
  });

  /* Add handler for type ahead search input field */
  $('#filter').bind('paste cut keypress keydown keyup', function() {
    var cnt = $(this).val();
    if( cnt.length ) {
      $('.event').css('display', 'none');
      $('.event:containsi('+cnt+')').css('display', 'block');
   } else {
      $('.event').css('display', 'block');
   }
  });

  /* Add click handlers for event div sizers */
  $('.smallboxes').click( function() {
    $('#qrcode').css( 'margin-bottom', '0' );
    $('.event').removeClass('medium large');
    $('.event').addClass('small');
  });

  $('.mediumboxes').click( function() {
    $('#qrcode').css( 'margin-bottom', '62px' );
    $('.event').removeClass('small large');
    $('.event').addClass('medium');
  });

  $('.largeboxes').click( function() {
    $('#qrcode').css( 'margin-bottom', '124px' );
    $('.event').removeClass('small medium');
    $('.event').addClass('large');
  });

  /* Add de-highlighter on touch interface devices */
  if( isTouch ) {
    $('body').click( function() {
      if( !$(this).parents('.event').length ) {
        $('.highlighted').removeClass('highlighted');
      }
    });
  }

  /* Add callbacks for view selector */
  $('.list').click( function() {
    toggle_grid(true);
  });
  $('.day1').click( function() {
    toggle_grid(false);
    $('.day_1').removeClass('hidden');
  });
  $('.day2').click( function() {
    toggle_grid(false);
    $('.day_2').removeClass('hidden');
  });
  $('.day3').click( function() {
    toggle_grid(false);
    $('.day_3').removeClass('hidden');
  });
  $('.day4').click( function() {
    toggle_grid(false);
    $('.day_4').removeClass('hidden');
  });

  /* Create hour guides */
  for( var i = 11; i<26; ++i ) {
    var elem = document.createElement('hr');
    $(elem).addClass('guide time_' + (i>23?'0':'') + i%24 + '00');
    $('body').append(elem);
    elem = document.createElement('div');
    $(elem).text((i>23?'0':'') + i%24 + '00');
    $(elem).addClass('guide time_' + (i>23?'0':'') + i%24 + '00');
    $('body').append(elem);
  }

  /* If we've been here before, try to get local preferences. They are authoratative */
  var selection;
  try {
    selection = localStorage['31C3-halfnarp'];
  } catch(err) {
    selection = [];
  }

  /* Fetch list of lectures to display */
  $.getJSON( halfnarpAPI, { format: 'json' })
    .done(function( data ) {
      $.each( data, function( i, item ) {
          /* Take copy of hidden event template div and select them, if they're in
             list of previous prereferences */
          var t = $( '#template' ).clone(true);
          t.attr('event_id', item.event_id.toString());
          t.attr('id', 'event_' + item.event_id.toString());
          if( selection && selection.indexOf(item.event_id) != -1 ) {
            t.addClass( 'selected' );
          }

          /* Sort textual info into event div */
          t.find('.title').text(item.title);
          t.find('.speakers').text(item.speakers);
          t.find('.abstract').text(item.abstract);

          /* start_time: 2014-12-29T21:15:00+01:00" */
          var start_time = new Date(item.start_time);

          var day  = start_time.getDate()-26;
          var hour = start_time.getHours();
          var mins = start_time.getMinutes();

          /* After midnight: sort into yesterday */
          if( hour < 10 ) {
            day--;
          }
          /* Apply attributes to sort events into calendar */
          t.addClass('small room_' + item.room_id + ' duration_' + item.duration + ' day_'+day + ' time_' + (hour<10?'0':'') + hour + '' + (mins<10?'0':'') + mins);

          t.click( function() {
            /* Transition for touch devices is highlighted => selected => highlighted ... */
            if( isTouch ) {
              if ( $( this ).hasClass('highlighted') ) {
                $( this ).toggleClass('selected');
                $('.info').addClass('hidden');
              } else {
                $('.highlighted').removeClass('highlighted');
                $( this ).addClass('highlighted');
              }
            } else {
              $( this ).toggleClass('selected');
              $('.info').addClass('hidden');
            }
          });
          /* Put new event into DOM tree. Track defaults to 'Other' */
          var d = $( '#' + item.track_id.toString() );
          if( !d.length ) {
            d = $( '#Other' );
          }
          d.append(t);
      });
      /* Initially display as list */
      toggle_grid(true);

    });
}
