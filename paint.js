function GetContext() {
  return document.getElementById("canvas").getContext("2d"); 
}   

var radiusSupported = false;
var nextCount = 0;
var touchMap = {};
var pointMode = (window.location.hash == "#points");
var enableForce = false;

document.addEventListener('keyup', function(e) {
  switch(e.which) {
    // ESC
    case 27:
    var canvas = document.getElementById('canvas');
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    break;

    // p
    case 80:
    pointMode = !pointMode;
    window.location.hash = pointMode ? "#points" : "";
    break;

    // f
    case 70:
    enableForce = !enableForce;
    break;

    // enter
    case 13:
    if (document.documentElement.webkitRequestFullscreen) {
      if (document.webkitFullscreenElement)
        document.webkitCancelFullScreen();
      else
        document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  }

});

window.addEventListener('resize', function(e) {
    InitializeCanvas();
});

function drawTouches(touches, eventType) {
  var context = GetContext();
  for (var i = 0; i < touches.length; ++i) {
    var touch = touches[i];

    // Map the identifier to a small count (no-op on Chrome, but
    // important for mobile Safari).
    if (!(touch.identifier in touchMap)) {
      touchMap[touch.identifier] = nextCount;
      nextCount++;
    }

    // Polyfill non-standard properties
    if (!'radiusX' in touch && 'webkitRadiusX' in touch)
      touch.radiusX = touch.webkitRadiusX;
    if (!'force' in touch && 'webkitForce' in touch)
      touch.force = touch.webkitForce;

    context.beginPath();

    // Spec says to use 1 for unknown radius, can't differentiate between that
    // and real 1 pixel radius.
    if (touch.radiusX > 1)
      radiusSupported = true;
    var radius = radiusSupported ? touch.radiusX : 15;
    if (radius > 100) {
      console.error('Got large radiusX: ' + touch.radiusX);
      radius=100;
    }
    if (pointMode)
      radius=1/scale;

    // Try to avoid start/end circles overlapping exactly
    if (eventType == 'touchend') {
      radius++;
    }
 
    context.arc(touch.pageX * scale, touch.pageY * scale, radius * scale, 0, 2.0 * 3.14159, false);
    context.closePath();

    // Fill circle on start/move
    if (eventType != 'touchend') {
      var opacity = pointMode ? 1 : 0.1;

      var hue = (touchMap[touch.identifier] * 30) % 256;
      var lum = 40;
      if (enableForce && touch.force)
        lum = Math.round(touch.force / 0.4 * 50 + 20);
      context.fillStyle = 'hsla(' + hue + ',100%,' + lum + '%, ' + opacity + ')';
      context.fill();
    }

    // Outline circle on start/end
    if (eventType != 'touchmove') {
      context.strokeStyle = eventType == 'touchstart' ? 'black' : 'grey';
      context.lineWidth = 2;
      context.stroke();
    }

  }
}

function TouchHandler(event) {
  drawTouches(event.changedTouches,event.type);
  event.preventDefault();
}

var mousePressed = false;

function MouseHandler(event) {
  if (event.type == "mousedown" && event.button == 0) mousePressed = true;
  if (mousePressed && event.button == 0)
  {
    var fakeTouch = {
      identifier: 10,
      pageX : event.pageX,
      pageY : event.pageY
    };
    var eventType = event.type == "mousedown" ? "touchstart" :
      event.type == "mouseup" ? "touchend" : "touchmove";
    drawTouches([fakeTouch], eventType);
    event.preventDefault();
    
    if (event.type == "mouseup") mousePressed = false;
  }
}

var scale = 1;

function InitializeCanvas() {
  var elem = document.getElementById('canvas');
  
  var newscale = window.devicePixelRatio ? window.devicePixelRatio : 1;
  var newwidth = window.screen.width * newscale;
  var newheight = window.screen.height * newscale;

  if (elem.width != newwidth || elem.height != newheight || scale != newscale) {
    // resizing a canvas clears it, so do it only when it's dimensions have changed.
    scale = newscale;
    elem.width = newwidth;
    elem.height = newheight;
    elem.style.width = window.screen.width + 'px';
    elem.style.height = window.screen.height + 'px';
  }

  var context = GetContext();
  //context.fillStyle = "#ff0000";
}
