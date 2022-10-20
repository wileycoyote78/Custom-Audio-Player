//Set global variables
const audio = getAudioElement(); // Audio element.
const thumb_offset_width = Math.round($('.slider__thumb').width() / 2); // The offset width
//There is a 'buffer' element in the volume group, but it's just there for layout. I'm too lazy to figure out the CSS positioning for just two elements.
const slider_buffer = $('#slider-progress__buffering');
const timer_duration = $('#timer__duration'); //The audio duration
const timer_elapsed = $('#timer__elapsed'); //The audio time progression

// audio.load();
audio.addEventListener('timeupdate', moveScrubber);

audio.onloadedmetadata = function () {
  timer_duration.text(convertTime(audio.duration));
};

//Play button control
$('#play_button').on('click', function (e) {
  //Display play/pause
  $(this).toggleClass('play');
  //Change the aria label
  if ('Play' === $(this).attr('aria-label')) {
    $(this).attr('aria-label', 'Pause');
    audio.play();
  } else {
    $(this).attr('aria-label', 'Play');
    audio.pause();
  }

  //Remove the focus from the button
  $(this).blur();
});

//Mute button control
$('.container__mute').on('click', function (e) {
  $(this).toggleClass('muted');
  var _vol = '0%';
  var _label = 'Mute';
  if (audio.muted) {
    _vol = audio.volume * 100 + '%';
    audio.muted = false;
    _label = 'Mute';
  } else {
    audio.muted = true;
    _label = 'Unmute';
  }

  $(this).attr('aria-label', _label);
  document.documentElement.style.setProperty('--player_volume-value', _vol);
});

/** KEY DOWN EVENTS */

//Because I did not make the Mute control a button, I need to set a Keypdown listener
$('.container__mute').keydown(function (e) {
  if (e.which === 32 || e.which === 13) {
    $(this).click();
  } else {
    return;
  }
});

//Move the sliders when up, down, left and/or right are pressed on the keyboard
$('.slider__thumb').keydown(function (e) {
  /**
   * e.which is the key that was pressed,
   * Left 37
   * Up 38
   * Right 39
   * Down 40
   */
  const slider = getSlider($(this));
  var val = 0;
  switch (e.which) {
    case 38:
    case 39:
      //Pressed Up or Right keys
      if (slider.type === 'volume') {
        //Increase volume in half steps as long as it doesn't exceed a total of 1.
        audio.volume = audio.volume + 0.05 > 1 ? 1 : audio.volume + 0.05;
        val = audio.volume * 100;
      } else if (
        slider.type === 'progress' &&
        (!isNaN(audio.duration) || audio.duration > 0)
      ) {
        //Increase in 1 second increments as long as it doesn't go beyond the total time of the loaded audio
        audio.currentTime =
          audio.currentTime + 1 > audio.duration
            ? audio.duration
            : audio.currentTime + 1;
        val = ((audio.currentTime / audio.duration) * 100).toFixed(0);
      }
      //Adjust the CSS property of the slider being used
      document.documentElement.style.setProperty(slider.prop, val + '%');
      break;
    case 37:
    case 40:
      //Pressed Down or Left keys
      if (slider.type === 'volume') {
        //Decrease volume in half steps as long as it doesn't go below 0.
        audio.volume = audio.volume - 0.05 < 0 ? 0 : audio.volume - 0.05;
        val = audio.volume * 100;
      } else if (
        slider.type === 'progress' &&
        (!isNaN(audio.duration) || audio.duration > 0)
      ) {
        //Decrease in 1 second increments as long as it doesn't go below 0
        audio.currentTime =
          audio.currentTime - 1 < 0 ? 0 : audio.currentTime - 1;
        val = ((audio.currentTime / audio.duration) * 100).toFixed(0);
      }
      //Adjust the CSS property of the slider being used
      document.documentElement.style.setProperty(slider.prop, val + '%');
  }
});

/** SLIDER CHANGE EVENTS */
function moveScrubber() {
  /**Called by timeupdate event listener, adjusts the width of the progress bar */
  var progress = ((100 * audio.currentTime) / audio.duration).toFixed(0);
  progress = isNaN(progress) ? '0' : progress;
  document.documentElement.style.setProperty(
    '--player_progress-value',
    progress + '%'
  );
  timer_elapsed.text(convertTime(audio.currentTime));
}

$('.slider__thumb').on('mousedown', function (e) {
  /**
   * Controls the slider. Moves the thumb to where the user moves the mouse.
   */
  const slider = getSlider($(this));
  var val = 0;

  var wasplaying = false;
  if (slider.type === 'progress') {
    if (!audio.paused) {
      //Pause the music while scrubbing.
      audio.pause();
      wasplaying = true;
    }
  }

  $(document).on('mousemove.mm', function (e) {
    /** Set val to the corresponding value
     * 1. If we are scrubbing, and no audio is loaded (there will be no duration or it will be NaN), the thumb should not move, so return 0.
     * 2. If the mouse is moved to the left of the slider container, return 0
     * 3. If the mouse is moved to the right of the slider container, return 100
     * 4. If the mouse is inside the slider container, return the corresponding percentage: ((cursor_position - container_left_position) / (container_width - half_thumb_width)) * 100;
     *    fix the result down to the nearest whole number (i.e. 49.321455 => 49).
     */
    val =
      slider.type === 'progress' &&
      (audio.duration === 0 || isNaN(audio.duration))
        ? '0'
        : e.clientX <= slider.bg.offset().left
        ? '0'
        : e.clientX >=
          slider.bg.offset().left + slider.bg.width() - thumb_offset_width
        ? '100'
        : (
            ((e.clientX - slider.bg.offset().left) /
              (slider.bg.width() - thumb_offset_width)) *
            100
          ).toFixed(0);

    if (slider.type === 'volume') {
      setVolume(val); //Adjust the colume
    } else if (slider.type === 'progress') {
      skipTo(val); //Adjust the current position.
    }
    //Set the width of the corresponding control's scrubber
    document.documentElement.style.setProperty(slider.prop, val + '%');
  });

  $(document).on('mouseup.mu', function (e) {
    $(this).blur();
    if (wasplaying) {
      //If the audio was playing before the scrubber moved, resume playback.
      audio.play();
      wasplaying = false;
    }
    //Release the even listeners.
    $(document).off('mousemove.mm');
    $(this).off('mouseup.mu');
  });
});

$('.slider.background').on('click', function (e) {
  const slider = getSlider($(this));
  var _parentPosition = _getPosition($(this)); //Get position of the of the slider
  var _click_pos = e.clientX - _parentPosition + thumb_offset_width * 2;
  var _val = (
    (_click_pos / ($(this).width() - thumb_offset_width)) *
    100
  ).toFixed(0);

  _val = _val > 100 ? '100' : _val < 0 ? '0' : _val;

  if (slider.type === 'volume') {
    setVolume(_val);
  } else if (slider.type === 'progress') {
    if (audio.duration === 0 || isNaN(audio.duration)) {
      _val = 0;
    } else {
      skipTo(_val);
    }
  } else {
    console.log(
      "Invalid value passed to slider.type in $('slider.background').on('click') event."
    );
  }

  //Set the CSS property of the adjusted slider
  document.documentElement.style.setProperty(slider.prop, _val + '%');

  //Helper function to get the position of the slider container. We will need it in order to calculate the percentage in relation to the width of the container.
  function _getPosition(el) {
    var xPos = 0;
    while (el) {
      if (el[0].tagName === 'BODY') {
        var xScroll = el.scrollLeft() || document.documentElement.scrollLeft;
        xPos += el.offset().left - xScroll + el.position().left;
      } else {
        xPos += el.offset().left - el.scrollLeft() + el.position().left;
      }
      el = null;
    }
    return Math.round(xPos);
  }
});

function getAudioElement() {
  /**This is here for dev purposes only and can be removed from production use. 
  You could also use this function or something similar to dynamically load audio without
  needing to include an HTML element. You will need to dynamically supply a source and preload
  behavior, as well.**/
  if (document.getElementById('player')) {
    return document.getElementById('player');
  } else {
    $('#audio_error').css('display', 'block'); //You should remove audio error line in production sites.
    return new Audio();
  }
}

function skipTo(point) {
  //Sanitize to ensure >0 & !>100
  point = point < 0 ? 0 : point > 100 ? 100 : point;
  //Move the current time marker to the clicked position.
  audio.currentTime = audio.duration * (point / 100);
}

function setVolume(point) {
  var audio_volume = point / 100;
  //last check to make sure volume is between 0 and 1
  audio.volume = audio_volume < 0 ? 0 : audio_volume > 1 ? 1 : audio_volume;
}

function convertTime(time) {
  /**
   * Convert the audio duration or elapsed time from seconds to more readable 00:00:00 format.
   *
   * @param   (int)  time    Duration, in seconds, of audio.
   *
   * @return  (string) formed   Returns formatted duration of MM:SS (or HH:MM:SS if duration > 3600 seconds)
   */

  var formed = '';

  if (isNaN(time)) {
    //Ensure time is a number, if not, quietly get out and simply give back a 0 time duration;
    console.log('A bad duration was sent to converTime.');
    return '00:00';
  }

  var hours = Math.floor(time / 3600); //Get hours
  hours = hours < 10 ? '0' + hours : hours; //If 1-9 hours, change to 01-09 format
  formed += hours === '00' ? '' : hours + ':'; //If duration is less than an hour (00), then just be blank.
  var minutes = Math.floor(time / 60); //Get minutes
  formed += minutes < 10 ? '0' + minutes + ':' : minutes + ':'; //If 1-9 minutes, change to 01-09 format.
  var seconds = Math.floor(time % 60); //Get seconds (the remainder of time / 60)
  formed += seconds < 10 ? '0' + seconds : seconds;

  return formed;
}

function setBuffer() {
  /** Expand the buffer bar as the audio loads */
  var _buffered = audio.buffered;
  var _loaded;

  if (_buffered.length) {
    _loaded = ((100 * _buffered.end(0)) / audio.duration).toFixed(0);
  }

  slider_buffer.width(_loaded + '%');
  if (_loaded === '100') {
    clearInterval(_buffer);
  }
}

var _buffer = setInterval(setBuffer, 500);

function getSlider(slider) {
  /**Construct to contain several attributes under one variable for the slider being
   * controlled
   * .
   * Usage:
   * Call: var/let/const handle = getSlider(element)
   * Use: handle.scrubber/handle.bg/handle.prop
   *
   * @param (obj) slider The slider element being handled
   * @return {type, scrubber, bg, prop}
   * (str) type: The slider's type, defined in its 'data_control-type' DOM attribute
   * (obj) scrubber: The handle for the slider's scrubber element
   * (obj) bg: The handle for the slider's background element
   * (str) prop: The CSS custom property that should be adjusted.
   */
  const type = slider.attr('data_control-type'),
    scrubber = $('#slider-' + type + '__scrubber'),
    bg = $('#slider-' + type + '__background'),
    prop = '--player_' + type + '-value';

  return { type, scrubber, bg, prop };
}

/**Setup a resize observer to keep tabs on the width of the player. At certain points
 * we need to hide elements to help prevent overflow, and to keep the player looking
 * decent.
 * Documentation for ResizeObserver:
 * https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */
const player_container = document.querySelector('#ac_audio_player');
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.borderBoxSize) {
      //Of course Firefox has to be different [*eye roll*]. All other browsers consider
      //contentBoxSize an array.
      const container = Array.isArray(entry.borderBoxSize)
        ? entry.borderBoxSize[0]
        : entry.borderBoxSize;
      resizePlayer(container.inlineSize);
    }
  }
});

resizeObserver.observe(player_container);

var timeout = false;

window.addEventListener('resize', function () {
  clearTimeout(timeout);
  timeout = setTimeout(setObserver, 250);
});

function setObserver() {
  resizeObserver.observe(player_container);
}

function resizePlayer(w) {
  if (w > 400) {
    $('div.tucked').removeClass('tucked');
  } else if (w <= 400) {
    $('#container__slider-volume').addClass('tucked');
  }

  if (w > 310) {
    $('#container__mute').removeClass('tucked');
    $('#container__timer').removeClass('no_mute');
  } else if (w <= 310) {
    $('#container__mute').addClass('tucked');
    $('#container__timer').addClass('no_mute');
  }

  if (w > 270) {
    $('#container__timer').removeClass('tucked');
  } else if (w <= 270) {
    $('#container__timer').addClass('tucked');
  }

  if (w > 140) {
    $('#container__slider-progress').removeClass('tucked');
    $('.container').removeClass('only_play');
  } else if (w <= 140) {
    $('#container__slider-progress').addClass('tucked');
    $('.container').addClass('only_play');
  }

  //Uncomment below on production?
  // resizeObserver.unobserve(player_container);
}
