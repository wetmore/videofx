$(document).ready(function() {
    var options = {};
    var vars = effect('blur', 'v', 'c', options);
    console.log(vars);
    console.log(vars.radius);
    window.lol = vars;
    
    makeInput(vars, $('#sliders'), '');

    var $vid = $('#vid');
    $('#hidevid').toggle(function() {
      $vid.animate({
        top: -360
      });
      this.innerText = 'Show video';
    }, function() {
      $vid.animate({
        top: 0
      });
      this.innerText = 'Hide video';
    });

    $('#sliders').append('<br>Select a video<br>');
    $('#sliders').append('<select><option>Mountain</option><option>Fireworks</option></select>');

    $('select').change(function() {
      var source;
      switch (this.value) {
        case 'Mountain':
          source = 'videos/mountain.webm';
          break;
        
        case 'Fireworks':
          source = 'videos/fireworks.webm';
          break;
      }
      $('video').attr('src', source);
    });

});

function makeInput(obj, $el, prefix) {
  var configs = {
    'speed' : [0, 50],
    'strength' : [0, 4],
    'brightness' : [0, 10]
  };

  $.each(obj, function(i, val) {
    if (typeof val === 'object') {
      makeInput(val, $el, 'flicker');
    } else {
      var input = '';

      switch (typeof val) {
        case 'boolean' : 
          input += '<label> <input type="checkbox" id="' + i + '" />';
          input += prefix + ' ' + i;
          input += '</label> <br>';
          break;

        case 'number' :
          input += prefix + ' ' + i + '<br>';
          input += '<input type="range" id="' + i + '" ';
          if (configs[i] !== undefined) {
            input += 'min="' + configs[i][0] + '" max="' + configs[i][1] + '" ';
          }
          input += ' value="' + val + '" step="0.1"" /> <br>';
          break;

      }

      var cls = (!!prefix) ? prefix : 'main';
      $el.append('<span class="' + cls + '">' + input + '</span>');

      $('#' + i).change(function(e) {
        //var obj = !!prefix ? vars[prefix] : vars;
        if (i === 'speed') {
          obj[i] = typeof val === 'boolean' ? this.checked : parseInt(this.value, 10);
        } else {
          obj[i] = typeof val === 'boolean' ? this.checked : parseFloat(this.value, 10);
        }
      });
    }
    
  });
}
