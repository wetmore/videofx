// Create a new video effect
//
// type     - the type of the effect to apply
// videoId  - the id of the video DOM element to use for the effect
// canvasID - the id of the canvas DOM element to draw the effect to
// options  - an object containing various options to modify the effect
//
// Examples
//
//   effect('blur', 'v', 'c', {radius: 5});
//   Sets up a blur effect to blur the video in element 'v', drawn onto canvas
//   'c'. The blur has a radius of 5.
// 
// Returns an object containing the variables used in the effect, so the effect
// can be modified after creation
function effect(type, videoId, canvasId, options) {
  // basic, necessary fields
  var canvas = document.getElementById(canvasId)
    , video  = document.getElementById(videoId)
    , ctx    = canvas.getContext('2d')
    , vars   = {}
  ;

  //dependencies
  var dependencies = {
    'stackblur' : 'StackBlur.js'//'http://www.quasimondo.com/StackBlurForCanvas/StackBlur.js'
  };

  // helper function for defining variables with default values
  function def(value, fallback) {
    return value !== undefined ? value : fallback;
  }

  // very basic dependency management - creates a script tag for dependency if one doesn't exist
  // executes callback once the script tag has loaded
  function dependOn(dependency, callback) {
    var path = dependencies[dependency];
    if (/:\/\//.exec(path) !== null) {
      path = window.location.href + path;
    }
    var scripts = Array.prototype.slice.apply(document.getElementsByTagName('script'));
    if (!scripts.some(function(e) {return e.src === path;})) {
      var script = document.createElement('script');
      script.onload = callback();
      script.src = path;
      document.body.appendChild(script);
    } else {
      callback();
    }
  }

  // --- effect: blur ---
  if (type === 'blur') {
    // if the blur function is not present, load it
    dependOn('stackblur', function() {
      // add flicker object to vars, to contain flicker-related parameters
      vars.flicker = {};
      
      // handle options which will not be returned by effect function
      // and therefore cannot be changed after the effect is created
      var scaleFactor = def(options.scaleFactor, 8);

      // handle options which will be returned by the effect function
      // and therefore can be changed after the effect is created
      vars.radius     = def(options.radius, 10);
      vars.borders    = def(options.borders, false);
      vars.flicker.on = typeof options.flicker === 'object'; 
      
      if (!vars.flicker.on) {
        options.flicker = {};
      }
      
      vars.flicker.brightness = def(options.flicker.brightness, 1);
      vars.flicker.speed    = def(options.flicker.speed, 5);
      vars.flicker.strength = def(options.flicker.strength, 0.5);
      vars.flicker.spacing  = def(options.flicker.spacing, 1);

      // blur-specific fields
      var cw = Math.floor(canvas.clientWidth / scaleFactor)
        , ch = Math.floor(canvas.clientHeight / scaleFactor)
        , t  = 0
      ;

      // resize canvas based on the scale factor
      canvas.width  = cw;
      canvas.height = ch;
      
      // generate sin lookup table
      var lookup = [];
      for (var i = 0; i < Math.PI * 2; i += Math.PI / 60) {
        lookup.push(Math.sin(i));
      }

      // now once everything is loaded, start animating if the video is playing
      // (with autoplay enabled for the video, the play event will be fired
      // before the effects function is set up)
      if (!video.paused) {
        animate();
      }
     
      // frame logic
      function drawFrame(v, c, w, h) {
        if (v.ended) {
          return false;
        }

        // draw the current video frame to canvas
        c.drawImage(v, 0, 0, w, h);

        // black borders
        if (vars.borders) {
          c.fillStyle = 'rgba(0,0,0,1)';
          c.fillRect(0, 0, 5, h);
          c.fillRect(0, 0, w, 5);
          c.fillRect(0, h - 5, w, h);
          c.fillRect(w - 5, 0, w, h);
        }

        // blur the canvas
        try {
          stackBlurCanvasRGB(canvasId, 0, 0, cw, ch, vars.radius); 
        } catch (e) {
          if (e instanceof ReferenceError) {
            console.error('StackBlur dependency wasn\'t loaded');
          } else {
            throw e;
          }
        }

        if (vars.flicker.on) {
          t += vars.flicker.speed;
          // manipulation goes here
          var idata = c.getImageData(0, 0, w, h);
          var data = idata.data;
          for (var i = 0; i < data.length; i += 4) {
            var row = Math.floor(i / (w * 4)); // note: the 4 is because each
                                               // pixel takes 4 array entries
            var factor = 1 / vars.flicker.brightness; // start with baseline brightness
            // then add the brightness from the sine lookup table, based on row
            factor += lookup[(Math.floor(row / vars.flicker.spacing) + t) % lookup.length] * vars.flicker.strength; 
            // modify the RGB pixels based on the above computed factor
            data[i] /= factor;
            data[i + 1] /= factor;
            data[i + 2] /= factor;
          }

          // draw the modified image to the canvas
          c.putImageData(idata, 0, 0);
        }
        // don't request another animation frame if paused
        return !v.paused;
      }

      // animate function - called to begin animating canvas
      function animate() {
        if (drawFrame(video, ctx, cw, ch)) {
          requestAnimFrame(animate);
        }
      }

      // -- event bindings --
      video.addEventListener('play', function() {
          animate();
      }, false);

      ['seeking', 'seeked'].map(function(e) {
          video.addEventListener(e, function() {
            if (video.paused) {
              drawFrame(video, ctx, cw, ch);
            }
          }, false);
      });
    });
    // --- end of blur ---
  } else {
    console.error('There is no effect of type "' + type + '" defined.');
  }

  // rEQ shim
  window.requestAnimFrame = (function() {
    return window.requestAnimationFrame  ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  // return an object containing the state of the effect
  return vars;
}
