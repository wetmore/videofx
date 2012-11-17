$(document).ready(function() {
    var options = {};
    var vars = effect('blur', 'v', 'c', options);
    console.log(vars);
    console.log(vars.radius);
    window.lol = vars;
});
