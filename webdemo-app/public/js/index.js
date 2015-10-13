(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
var Button, Config, ControllerApp, ControllerFx,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Button = require("../ui/Button.coffee");

Config = require("../config/Config.coffee");

ControllerFx = require("../fx/ControllerFx.coffee");

ControllerApp = (function() {
  function ControllerApp() {
    this.resize = bind(this.resize, this);
    this._onDeviceMotion = bind(this._onDeviceMotion, this);
    this._onSocketPeerButtonReleased = bind(this._onSocketPeerButtonReleased, this);
    this._onSocketPeerButtonPressed = bind(this._onSocketPeerButtonPressed, this);
    this._onSocketAssignButtons = bind(this._onSocketAssignButtons, this);
    this._onSocketDisconnect = bind(this._onSocketDisconnect, this);
    this._onSocketConnect = bind(this._onSocketConnect, this);
    this._onButtonRelease = bind(this._onButtonRelease, this);
    this._onButtonClick = bind(this._onButtonClick, this);
    this.init = bind(this.init, this);
    this.clientName = "user" + parseInt(Math.random() * 10000);
    this.peerName = "";
    this.totalButtonCount = Config.TOTAL_BUTTON_COUNT;
    this.socketConnected = false;
    this.buttons = [];
  }

  ControllerApp.prototype.init = function() {
    var i, j, newButton, ref;
    this.buttonContainer = $("buttonContainer");
    this.oneShotButton = new Button(this.totalButtonCount);
    this.oneShotButton.getElement().classList.add("oneShot");
    this.buttonContainer.appendChild(this.oneShotButton.getElement());
    this.oneShotButton.on("click", this._onButtonClick);
    this.oneShotButton.on("release", this._onButtonRelease);
    for (i = j = 0, ref = this.totalButtonCount - 1; j <= ref; i = j += 1) {
      newButton = new Button("" + i);
      this.buttons.push(newButton);
      this.buttonContainer.appendChild(newButton.getElement());
      newButton.on("click", this._onButtonClick);
      newButton.on("release", this._onButtonRelease);
    }
    this.buttons.push(this.oneShotButton);
    this.fx = new ControllerFx();
    if (typeof io !== "undefined") {
      this.socket = io.connect("http://" + Config.SERVER_IP + ":" + Config.SERVER_PORT);
      this.socket.on("news", (function(_this) {
        return function(data) {
          console.log(data);
          return _this.socket.emit('my other event', {
            my: 'data'
          });
        };
      })(this));
      this.socket.on("log", (function(_this) {
        return function(label, data) {
          console.log(label);
          return console.log(data);
        };
      })(this));
      this.socket.on("connect", this._onSocketConnect);
      this.socket.on("disconnect", this._onSocketDisconnect);
      this.socket.on("assignButtons", this._onSocketAssignButtons);
      this.socket.on("peerButtonPressed", this._onSocketPeerButtonPressed);
      this.socket.on("peerButtonReleased", this._onSocketPeerButtonReleased);
      window.addEventListener("devicemotion", this._onDeviceMotion, true);
      window.addEventListener("resize", this.resize);
      window.addEventListener("orientationchange", this.resize);
    }
    return this.resize();
  };

  ControllerApp.prototype._onButtonClick = function(data) {
    if (this.socket) {
      this.socket.emit("buttonPressed", data.id);
    }
    this.fx.buttonPressed(data.id, this.buttons[data.id]);
    return document.body.classList.add("button-" + data.id);
  };

  ControllerApp.prototype._onButtonRelease = function(data) {
    if (this.socket) {
      this.socket.emit("buttonReleased", data.id);
    }
    this.fx.buttonReleased(data.id);
    return document.body.classList.remove("button-" + data.id);
  };

  ControllerApp.prototype._onSocketConnect = function() {
    this.socketConnected = true;
    this.socket.emit('adduser', this.clientName);
    return document.body.classList.add("connected");
  };

  ControllerApp.prototype._onSocketDisconnect = function() {
    this.socketConnected = false;
    return document.body.classList.remove("connected");
  };

  ControllerApp.prototype._onSocketAssignButtons = function(users) {
    var button, buttonId, j, k, len, len1, ref, results, user;
    ref = this.buttons;
    for (j = 0, len = ref.length; j < len; j++) {
      button = ref[j];
      button.disable();
    }
    results = [];
    for (k = 0, len1 = users.length; k < len1; k++) {
      user = users[k];
      if (user.userName === this.clientName) {
        results.push((function() {
          var l, len2, ref1, results1;
          ref1 = user.assignedButtons;
          results1 = [];
          for (l = 0, len2 = ref1.length; l < len2; l++) {
            buttonId = ref1[l];
            results1.push(this.buttons[buttonId].enable());
          }
          return results1;
        }).call(this));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  ControllerApp.prototype._onSocketPeerButtonPressed = function(buttonId) {
    if (this.buttons[buttonId]) {
      return this.buttons[buttonId].peerPressed();
    } else {
      return console.error("No button " + buttonId + " found on peer pressed");
    }
  };

  ControllerApp.prototype._onSocketPeerButtonReleased = function(buttonId) {
    if (this.buttons[buttonId]) {
      return this.buttons[buttonId].peerReleased();
    } else {
      return console.error("No button " + buttonId + " found on peer released");
    }
  };

  ControllerApp.prototype._onDeviceMotion = function(event) {
    return this.tilt = [event.accelerationIncludingGravity.x / 10, event.accelerationIncludingGravity.y / 10, event.acceleration.z / 10];
  };

  ControllerApp.prototype.resize = function() {
    return this.buttonContainer.style.height = this.buttonContainer.clientWidth + "px";
  };

  return ControllerApp;

})();

module.exports = ControllerApp;


},{"../config/Config.coffee":3,"../fx/ControllerFx.coffee":6,"../ui/Button.coffee":7}],3:[function(require,module,exports){
var Config;

Config = {
  TOTAL_BUTTON_COUNT: 6,
  SERVER_IP: document.location.hostname.split(":")[0],
  SERVER_PORT: "8088",
  BUTTON_TIMEOUT: 5 * 1000
};

module.exports = Config;


},{}],4:[function(require,module,exports){
var App, Main, globals, k, v;

App = require("./app/app-controller.coffee");

Main = new function() {
  var app, getQueryParams, init, initialized, parseQueryString, queryParams, setCSSProps, stats;
  initialized = false;
  app = null;
  stats = null;
  queryParams = null;
  init = function() {
    if (!initialized) {
      initialized = true;
      queryParams = parseQueryString();
      app = new App();
      return app.init();
    }
  };
  parseQueryString = function() {
    var i, j, queryIndex, queryString, queryStringArray, ref, returnObject, tempArray, val;
    queryString = document.location.href;
    queryIndex = queryString.indexOf("?");
    queryStringArray = [];
    if (queryIndex !== -1 && queryIndex + 1 !== queryString.length) {
      queryString = queryString.substring(queryIndex + 1, queryString.length);
      queryStringArray = queryString.split("&");
    }
    returnObject = {};
    for (i = j = 0, ref = queryStringArray.length - 1; j <= ref; i = j += 1) {
      tempArray = queryStringArray[i].split("=");
      val = true;
      if (typeof tempArray[1] !== "undefined") {
        val = tempArray[1];
      }
      returnObject[tempArray[0]] = val;
    }
    return returnObject;
  };
  getQueryParams = function() {
    return queryParams;
  };
  setCSSProps = function(e, props) {
    var k, results, v;
    results = [];
    for (k in props) {
      v = props[k];
      results.push(e.style[k] = v);
    }
    return results;
  };
  return {
    init: init,
    getQueryParams: getQueryParams
  };
};

globals = {
  $: function(id) {
    return document.getElementById(id);
  },
  el: function(type, cls) {
    var e;
    e = document.createElement(type);
    if (cls) {
      e.className = cls;
    }
    return e;
  },
  Main: Main
};

for (k in globals) {
  v = globals[k];
  window[k] = v;
}

if (window.addEventListener) {
  window.addEventListener('load', function(e) {
    return Main.init();
  }, false);
} else if (window.attachEvent) {
  window.attachEvent('load', function(e) {
    return Main.init();
  }, false);
}


},{"./app/app-controller.coffee":2}],5:[function(require,module,exports){
var CircleFx, NUM_CIRCLES,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

NUM_CIRCLES = 10;

CircleFx = (function() {
  function CircleFx() {
    this.hide = bind(this.hide, this);
    this.show = bind(this.show, this);
  }

  CircleFx.prototype.show = function(snap) {
    var i, j, newCircle, ref, results;
    this.snap = snap;
    this.s = this.snap.svg(0, 0, "100%", "100%", 0, 0, 1000, 1000).attr({
      "class": 'circles'
    });
    this.g = this.s.g();
    this.circles = [];
    results = [];
    for (i = j = 0, ref = NUM_CIRCLES; j <= ref; i = j += 1) {
      newCircle = this.s.circle(500, 500, 400).attr({
        "class": "circle"
      });
      this.circles.push(newCircle);
      results.push(this.g.add(newCircle));
    }
    return results;
  };

  CircleFx.prototype.hide = function() {
    var circle, j, len, ref;
    ref = this.circles;
    for (j = 0, len = ref.length; j < len; j++) {
      circle = ref[j];
      circle.remove();
    }
    return this.s.remove();
  };

  return CircleFx;

})();

module.exports = CircleFx;


},{}],6:[function(require,module,exports){
var CircleFx, ControllerFx, EventEmitter,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventEmitter = require("events").EventEmitter;

CircleFx = require("./CircleFx.coffee");

ControllerFx = (function(superClass) {
  extend(ControllerFx, superClass);

  function ControllerFx() {
    this.buttonReleased = bind(this.buttonReleased, this);
    this.buttonPressed = bind(this.buttonPressed, this);
    this.overlay = $("buttonOverlay");
    this.lastButtonId = "";
    this.circleFx = new CircleFx();
  }

  ControllerFx.prototype.buttonPressed = function(lastButtonId, buttonObj) {
    this.lastButtonId = lastButtonId;
    this.overlay.classList.add("visible");
    return this.overlay.classList.add(this.lastButtonId);
  };

  ControllerFx.prototype.buttonReleased = function() {
    this.overlay.classList.remove("visible");
    return this.overlay.classList.remove(this.lastButtonId);
  };

  return ControllerFx;

})(EventEmitter);

module.exports = ControllerFx;


},{"./CircleFx.coffee":5,"events":1}],7:[function(require,module,exports){
var Button, Config, EventEmitter,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventEmitter = require("events").EventEmitter;

Config = require("../config/Config.coffee");

Button = (function(superClass) {
  extend(Button, superClass);

  function Button(id) {
    var i, j, newCircle;
    this.id = id;
    this.peerReleased = bind(this.peerReleased, this);
    this.peerPressed = bind(this.peerPressed, this);
    this.disable = bind(this.disable, this);
    this.enable = bind(this.enable, this);
    this.onRelease = bind(this.onRelease, this);
    this.onClick = bind(this.onClick, this);
    this.setLabel = bind(this.setLabel, this);
    this.getElement = bind(this.getElement, this);
    this.enabled = false;
    this.clicked = false;
    this.element = el("div", "btn");
    this.element.setAttribute("id", "btn" + this.id);
    this.element.setAttribute("buttonIndex", "" + this.id);
    this.anim = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.anim.classList.add("anim");
    this.element.appendChild(this.anim);
    this.circleElements = [];
    this.circleContainer = el("div", "circleContainer");
    for (i = j = 0; j <= 5; i = j += 1) {
      newCircle = el("div", "circle");
      this.circleElements.push(newCircle);
      this.circleContainer.appendChild(newCircle);
    }
    this.element.appendChild(this.circleContainer);
    this.label = el("div", "label");
    this.element.appendChild(this.label);
    this.element.addEventListener("taphold", (function(_this) {
      return function(event) {
        return event.preventDefault();
      };
    })(this));
    this.element.addEventListener("touchstart", this.onClick);
    this.element.addEventListener("mousedown", this.onClick);
    this.element.addEventListener("touchend", this.onRelease);
    this.element.addEventListener("mouseup", this.onRelease);
    this.autoTimeoutId = -1;
  }

  Button.prototype.getElement = function() {
    return this.element;
  };

  Button.prototype.setLabel = function(labelText) {
    return this.label.innerHTML = labelText;
  };

  Button.prototype.onClick = function(event) {
    if (event) {
      event.preventDefault();
    }
    clearTimeout(this.autoTimeoutId);
    this.autoTimeoutId = setTimeout(this.onRelease, Config.BUTTON_TIMEOUT);
    this.snap = Snap(this.anim);
    if (this.enabled && !this.clicked) {
      this.clicked = true;
      this.emit("click", {
        id: this.id
      });
      return this.element.classList.add("clicked");
    }
  };

  Button.prototype.onRelease = function(event) {
    if (event) {
      event.preventDefault();
    }
    clearTimeout(this.autoTimeoutId);
    if (this.enabled && this.clicked) {
      this.clicked = false;
      this.emit("release", {
        id: this.id
      });
      this.element.classList.remove("clicked");
      this.anim.innerText = "";
      return this.snap = null;
    }
  };

  Button.prototype.enable = function() {
    this.enabled = true;
    return this.element.classList.add("enabled");
  };

  Button.prototype.disable = function() {
    this.enabled = false;
    return this.element.classList.remove("enabled");
  };

  Button.prototype.peerPressed = function() {
    return this.element.classList.add("peerPressed");
  };

  Button.prototype.peerReleased = function() {
    return this.element.classList.remove("peerPressed");
  };

  return Button;

})(EventEmitter);

module.exports = Button;


},{"../config/Config.coffee":3,"events":1}]},{},[4])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIi9Vc2Vycy9vd2VuaGluZGxleS9Eb2N1bWVudHMvd29ya3NwYWNlL3Byb2plY3RzL1JGTV8wMDFfVE9BX1RyaWdnZXJIYXBweS9UT0FfVHJpZ2dlckhhcHB5L3dlYi9zcmMvYXBwL2FwcC1jb250cm9sbGVyLmNvZmZlZSIsIi9Vc2Vycy9vd2VuaGluZGxleS9Eb2N1bWVudHMvd29ya3NwYWNlL3Byb2plY3RzL1JGTV8wMDFfVE9BX1RyaWdnZXJIYXBweS9UT0FfVHJpZ2dlckhhcHB5L3dlYi9zcmMvY29uZmlnL0NvbmZpZy5jb2ZmZWUiLCIvVXNlcnMvb3dlbmhpbmRsZXkvRG9jdW1lbnRzL3dvcmtzcGFjZS9wcm9qZWN0cy9SRk1fMDAxX1RPQV9UcmlnZ2VySGFwcHkvVE9BX1RyaWdnZXJIYXBweS93ZWIvc3JjL2NvbnRyb2xsZXIuY29mZmVlIiwiL1VzZXJzL293ZW5oaW5kbGV5L0RvY3VtZW50cy93b3Jrc3BhY2UvcHJvamVjdHMvUkZNXzAwMV9UT0FfVHJpZ2dlckhhcHB5L1RPQV9UcmlnZ2VySGFwcHkvd2ViL3NyYy9meC9DaXJjbGVGeC5jb2ZmZWUiLCIvVXNlcnMvb3dlbmhpbmRsZXkvRG9jdW1lbnRzL3dvcmtzcGFjZS9wcm9qZWN0cy9SRk1fMDAxX1RPQV9UcmlnZ2VySGFwcHkvVE9BX1RyaWdnZXJIYXBweS93ZWIvc3JjL2Z4L0NvbnRyb2xsZXJGeC5jb2ZmZWUiLCIvVXNlcnMvb3dlbmhpbmRsZXkvRG9jdW1lbnRzL3dvcmtzcGFjZS9wcm9qZWN0cy9SRk1fMDAxX1RPQV9UcmlnZ2VySGFwcHkvVE9BX1RyaWdnZXJIYXBweS93ZWIvc3JjL3VpL0J1dHRvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVTQSxJQUFBLDJDQUFBO0VBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSxxQkFBUjs7QUFDVCxNQUFBLEdBQVMsT0FBQSxDQUFRLHlCQUFSOztBQUNULFlBQUEsR0FBZSxPQUFBLENBQVEsMkJBQVI7O0FBR1Q7RUFDTyx1QkFBQTs7Ozs7Ozs7Ozs7SUFJWCxJQUFDLENBQUEsVUFBRCxHQUFjLE1BQUEsR0FBUyxRQUFBLENBQVUsSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFBLEdBQWdCLEtBQTFCO0lBQ3ZCLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFDWixJQUFDLENBQUEsZ0JBQUQsR0FBb0IsTUFBTSxDQUFDO0lB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LEtBQUg7TUFDQyxLQUFLLENBQUMsY0FBTixDQUFBLEVBREQ7O0lBR0EsWUFBQSxDQUFhLElBQUMsQ0FBQSxhQUFkO0lBRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxJQUFhLElBQUMsQ0FBQSxPQUFqQjtNQUNDLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsSUFBRCxDQUFNLFNBQU4sRUFBaUI7UUFBRSxFQUFBLEVBQUssSUFBQyxDQUFBLEVBQVI7T0FBakI7TUFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFuQixDQUEwQixTQUExQjtNQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixHQUFrQjthQUNsQixJQUFDLENBQUEsSUFBRCxHQUFRLEtBTFQ7O0VBUFM7O21CQWNWLE1BQUEsR0FBTyxTQUFBO0lBQ04sSUFBQyxDQUFBLE9BQUQsR0FBVztXQUdYLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQW5CLENBQXVCLFNBQXZCO0VBSk07O21CQU1QLE9BQUEsR0FBUSxTQUFBO0lBQ1AsSUFBQyxDQUFBLE9BQUQsR0FBVztXQUdYLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQW5CLENBQTBCLFNBQTFCO0VBSk87O21CQU9SLFdBQUEsR0FBWSxTQUFBO1dBRVgsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbkIsQ0FBdUIsYUFBdkI7RUFGVzs7bUJBSVosWUFBQSxHQUFhLFNBQUE7V0FFWixJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFuQixDQUEwQixhQUExQjtFQUZZOzs7O0dBeEdPOztBQStHckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiXG5CdXR0b24gPSByZXF1aXJlIFwiLi4vdWkvQnV0dG9uLmNvZmZlZVwiXG5Db25maWcgPSByZXF1aXJlIFwiLi4vY29uZmlnL0NvbmZpZy5jb2ZmZWVcIlxuQ29udHJvbGxlckZ4ID0gcmVxdWlyZSBcIi4uL2Z4L0NvbnRyb2xsZXJGeC5jb2ZmZWVcIlxuXG5cbmNsYXNzIENvbnRyb2xsZXJBcHBcblx0Y29uc3RydWN0b3I6KCktPlxuXG5cdFx0IyAnQCcgc3ltYm9sIGlzIGEgc2hvcnRjdXQgZm9yICd0aGlzJ1xuXG5cdFx0QGNsaWVudE5hbWUgPSBcInVzZXJcIiArIHBhcnNlSW50IChNYXRoLnJhbmRvbSgpICogMTAwMDApXG5cdFx0QHBlZXJOYW1lID0gXCJcIlxuXHRcdEB0b3RhbEJ1dHRvbkNvdW50ID0gQ29uZmlnLlRPVEFMX0JVVFRPTl9DT1VOVFxuXG5cdFx0QHNvY2tldENvbm5lY3RlZCA9IGZhbHNlXG5cblx0XHRAYnV0dG9ucyA9IFtdXG5cblx0aW5pdDooKT0+XG5cblx0XHQjIENyZWF0ZSBCdXR0b25zXG5cblx0XHRAYnV0dG9uQ29udGFpbmVyID0gJCBcImJ1dHRvbkNvbnRhaW5lclwiXG5cblx0XHRAb25lU2hvdEJ1dHRvbiA9IG5ldyBCdXR0b24oQHRvdGFsQnV0dG9uQ291bnQpXG5cdFx0QG9uZVNob3RCdXR0b24uZ2V0RWxlbWVudCgpLmNsYXNzTGlzdC5hZGQgXCJvbmVTaG90XCJcblx0XHRAYnV0dG9uQ29udGFpbmVyLmFwcGVuZENoaWxkIEBvbmVTaG90QnV0dG9uLmdldEVsZW1lbnQoKVxuXHRcdEBvbmVTaG90QnV0dG9uLm9uIFwiY2xpY2tcIiwgQF9vbkJ1dHRvbkNsaWNrXG5cdFx0QG9uZVNob3RCdXR0b24ub24gXCJyZWxlYXNlXCIsIEBfb25CdXR0b25SZWxlYXNlXG5cblx0XHRmb3IgaSBpbiBbMC4uQHRvdGFsQnV0dG9uQ291bnQtMV0gYnkgMVxuXHRcdFx0bmV3QnV0dG9uID0gbmV3IEJ1dHRvbihcIiN7aX1cIilcblx0XHRcdEBidXR0b25zLnB1c2ggbmV3QnV0dG9uXG5cdFx0XHRAYnV0dG9uQ29udGFpbmVyLmFwcGVuZENoaWxkIG5ld0J1dHRvbi5nZXRFbGVtZW50KClcblx0XHRcdG5ld0J1dHRvbi5vbiBcImNsaWNrXCIsIEBfb25CdXR0b25DbGlja1xuXHRcdFx0bmV3QnV0dG9uLm9uIFwicmVsZWFzZVwiLCBAX29uQnV0dG9uUmVsZWFzZVxuXG5cdFx0QGJ1dHRvbnMucHVzaCBAb25lU2hvdEJ1dHRvblxuXG5cdFx0IyBjcmVhdGUgRlggY29udHJvbGxlclxuXHRcdEBmeCA9IG5ldyBDb250cm9sbGVyRngoKVxuXG5cdFx0IyBTb2NrZXQuaW8gaGFuZGxlcnNcblxuXHRcdGlmICh0eXBlb2YoaW8pICE9IFwidW5kZWZpbmVkXCIpXG5cdFx0XHRAc29ja2V0ID0gaW8uY29ubmVjdChcImh0dHA6Ly9cIiArIENvbmZpZy5TRVJWRVJfSVAgKyBcIjpcIiArIENvbmZpZy5TRVJWRVJfUE9SVClcblxuXHRcdFx0QHNvY2tldC5vbiBcIm5ld3NcIiwgKGRhdGEpPT5cblx0XHRcdFx0Y29uc29sZS5sb2cgZGF0YVxuXHRcdFx0XHRAc29ja2V0LmVtaXQgJ215IG90aGVyIGV2ZW50JywgeyBteSA6ICdkYXRhJyB9XG5cblx0XHRcdEBzb2NrZXQub24gXCJsb2dcIiwgKGxhYmVsLCBkYXRhKT0+XG5cdFx0XHRcdGNvbnNvbGUubG9nIGxhYmVsXG5cdFx0XHRcdGNvbnNvbGUubG9nIGRhdGFcblxuXHRcdFx0QHNvY2tldC5vbiBcImNvbm5lY3RcIiwgQF9vblNvY2tldENvbm5lY3Rcblx0XHRcdEBzb2NrZXQub24gXCJkaXNjb25uZWN0XCIsIEBfb25Tb2NrZXREaXNjb25uZWN0XG5cdFx0XHRAc29ja2V0Lm9uIFwiYXNzaWduQnV0dG9uc1wiLCBAX29uU29ja2V0QXNzaWduQnV0dG9uc1xuXG5cdFx0XHRAc29ja2V0Lm9uIFwicGVlckJ1dHRvblByZXNzZWRcIiwgQF9vblNvY2tldFBlZXJCdXR0b25QcmVzc2VkXG5cdFx0XHRAc29ja2V0Lm9uIFwicGVlckJ1dHRvblJlbGVhc2VkXCIsIEBfb25Tb2NrZXRQZWVyQnV0dG9uUmVsZWFzZWRcblxuXHRcdFx0IyBkZXZpY2UgbW90aW9uXG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciBcImRldmljZW1vdGlvblwiLCBAX29uRGV2aWNlTW90aW9uLCB0cnVlXG5cblx0XHRcdCMgd2luZG93Lm9uZGV2aWNlbW90aW9uID0gKCk9PlxuXHRcdFx0I1x0aWYgQHRpbHRcblx0XHRcdCNcdFx0QHNvY2tldC5lbWl0ICdkaWRBY2NlbGVyYXRlJywgQHRpbHRcblxuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIgXCJyZXNpemVcIiwgQHJlc2l6ZVxuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIgXCJvcmllbnRhdGlvbmNoYW5nZVwiLCBAcmVzaXplXG5cblx0XHRAcmVzaXplKClcblxuXHRcdCMgc2V0VGltZW91dCgoKT0+XG5cdFx0IyBcdEBidXR0b25zWzBdLmVuYWJsZWQgPSB0cnVlXG5cdFx0IyBcdEBidXR0b25zWzBdLm9uQ2xpY2soeyBwcmV2ZW50RGVmYXVsdCA6ICgpPT4gfSlcblx0XHQjICw1MDApXG5cdFx0XG5cblx0X29uQnV0dG9uQ2xpY2s6KGRhdGEpPT5cblx0XHRpZiBAc29ja2V0IHRoZW4gQHNvY2tldC5lbWl0IFwiYnV0dG9uUHJlc3NlZFwiLCBkYXRhLmlkXG5cdFx0QGZ4LmJ1dHRvblByZXNzZWQgZGF0YS5pZCwgQGJ1dHRvbnNbZGF0YS5pZF1cblxuXHRcdGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCBcImJ1dHRvbi0je2RhdGEuaWR9XCJcblxuXHRfb25CdXR0b25SZWxlYXNlOihkYXRhKT0+XG5cdFx0aWYgQHNvY2tldCB0aGVuIEBzb2NrZXQuZW1pdCBcImJ1dHRvblJlbGVhc2VkXCIsIGRhdGEuaWRcblx0XHRAZnguYnV0dG9uUmVsZWFzZWQgZGF0YS5pZFxuXG5cdFx0ZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlIFwiYnV0dG9uLSN7ZGF0YS5pZH1cIlxuXG5cdF9vblNvY2tldENvbm5lY3Q6KCk9PlxuXG5cdFx0QHNvY2tldENvbm5lY3RlZCA9IHRydWVcblxuXHRcdCMgVE9ETyA6IHNob3cgYW5pbWF0aW9uIGluZGljYXRpbmcgd2UndmUgY29ubmVjdGVkXG5cblx0XHRAc29ja2V0LmVtaXQgJ2FkZHVzZXInLCBAY2xpZW50TmFtZVxuXG5cdFx0ZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkIFwiY29ubmVjdGVkXCJcblxuXHRfb25Tb2NrZXREaXNjb25uZWN0OigpPT5cblxuXHRcdEBzb2NrZXRDb25uZWN0ZWQgPSBmYWxzZVxuXG5cdFx0ZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlIFwiY29ubmVjdGVkXCJcblxuXHRcdCMgVE9ETyA6IHNob3cgYW5pbWF0aW9uIGluZGljYXRpbmcgd2UndmUgZGlzY29ubmVjdGVkXG5cblx0X29uU29ja2V0QXNzaWduQnV0dG9uczoodXNlcnMpPT5cblxuXHRcdGZvciBidXR0b24gaW4gQGJ1dHRvbnNcblx0XHRcdGJ1dHRvbi5kaXNhYmxlKClcblxuXHRcdGZvciB1c2VyIGluIHVzZXJzXG5cdFx0XHRpZiB1c2VyLnVzZXJOYW1lID09IEBjbGllbnROYW1lXG5cdFx0XHRcdGZvciBidXR0b25JZCBpbiB1c2VyLmFzc2lnbmVkQnV0dG9uc1xuXHRcdFx0XHRcdEBidXR0b25zW2J1dHRvbklkXS5lbmFibGUoKVxuXG5cdF9vblNvY2tldFBlZXJCdXR0b25QcmVzc2VkOihidXR0b25JZCk9PlxuXG5cdFx0aWYgQGJ1dHRvbnNbYnV0dG9uSWRdXG5cdFx0XHRAYnV0dG9uc1tidXR0b25JZF0ucGVlclByZXNzZWQoKVxuXHRcdGVsc2Vcblx0XHRcdGNvbnNvbGUuZXJyb3IgXCJObyBidXR0b24gI3tidXR0b25JZH0gZm91bmQgb24gcGVlciBwcmVzc2VkXCJcblxuXG5cdF9vblNvY2tldFBlZXJCdXR0b25SZWxlYXNlZDooYnV0dG9uSWQpPT5cblxuXHRcdGlmIEBidXR0b25zW2J1dHRvbklkXVxuXHRcdFx0QGJ1dHRvbnNbYnV0dG9uSWRdLnBlZXJSZWxlYXNlZCgpXG5cdFx0ZWxzZVxuXHRcdFx0Y29uc29sZS5lcnJvciBcIk5vIGJ1dHRvbiAje2J1dHRvbklkfSBmb3VuZCBvbiBwZWVyIHJlbGVhc2VkXCJcblxuXHRfb25EZXZpY2VNb3Rpb246KGV2ZW50KT0+XG5cdFx0QHRpbHQgPSBbXG5cdFx0XHQoZXZlbnQuYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eS54LzEwKSwgXG5cdFx0XHQoZXZlbnQuYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eS55LzEwKSxcblx0XHRcdChldmVudC5hY2NlbGVyYXRpb24uei8xMClcblx0XHRdXG5cblx0cmVzaXplOigpPT5cblxuXHRcdEBidXR0b25Db250YWluZXIuc3R5bGUuaGVpZ2h0ID0gQGJ1dHRvbkNvbnRhaW5lci5jbGllbnRXaWR0aCArIFwicHhcIlxuXG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbGxlckFwcCIsIkNvbmZpZyA9IHtcblx0XG5cdFRPVEFMX0JVVFRPTl9DT1VOVCA6IDZcblx0U0VSVkVSX0lQIDogZG9jdW1lbnQubG9jYXRpb24uaG9zdG5hbWUuc3BsaXQoXCI6XCIpWzBdXG5cdFNFUlZFUl9QT1JUIDogXCI4MDg4XCJcblx0QlVUVE9OX1RJTUVPVVQgOiA1ICogMTAwMFxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29uZmlnIiwiIyBDb250cm9sbGVyIG1haW5cblxuQXBwID0gcmVxdWlyZSBcIi4vYXBwL2FwcC1jb250cm9sbGVyLmNvZmZlZVwiXG5cbk1haW4gPSBuZXcgLT5cblx0aW5pdGlhbGl6ZWQgPSBmYWxzZVxuXHRhcHAgPSBudWxsXG5cdHN0YXRzID0gbnVsbFxuXHRxdWVyeVBhcmFtcyA9IG51bGxcblxuXHRpbml0ID0gKCkgLT5cblx0XHRpZiAhaW5pdGlhbGl6ZWRcblx0XHRcdGluaXRpYWxpemVkID0gdHJ1ZVxuXG5cdFx0XHRxdWVyeVBhcmFtcyA9IHBhcnNlUXVlcnlTdHJpbmcoKVxuXG5cdFx0XHRhcHAgPSBuZXcgQXBwKClcblx0XHRcdGFwcC5pbml0KClcblxuXHRwYXJzZVF1ZXJ5U3RyaW5nID0gKCkgLT5cblx0XHRxdWVyeVN0cmluZyA9IGRvY3VtZW50LmxvY2F0aW9uLmhyZWZcblx0XHRxdWVyeUluZGV4ID0gcXVlcnlTdHJpbmcuaW5kZXhPZihcIj9cIilcblx0XHRxdWVyeVN0cmluZ0FycmF5ID0gW11cblxuXHRcdGlmIHF1ZXJ5SW5kZXggIT0gLTEgJiYgcXVlcnlJbmRleCsxICE9IHF1ZXJ5U3RyaW5nLmxlbmd0aFxuXHRcdFx0cXVlcnlTdHJpbmcgPSBxdWVyeVN0cmluZy5zdWJzdHJpbmcocXVlcnlJbmRleCsxLCBxdWVyeVN0cmluZy5sZW5ndGgpXG5cdFx0XHRxdWVyeVN0cmluZ0FycmF5ID0gcXVlcnlTdHJpbmcuc3BsaXQoXCImXCIpXG5cblx0XHRyZXR1cm5PYmplY3QgPSB7fVxuXHRcdGZvciBpIGluIFswLi5xdWVyeVN0cmluZ0FycmF5Lmxlbmd0aC0xXSBieSAxXG5cdFx0XHR0ZW1wQXJyYXkgPSBxdWVyeVN0cmluZ0FycmF5W2ldLnNwbGl0KFwiPVwiKVxuXHRcdFx0dmFsID0gdHJ1ZVxuXHRcdFx0aWYgKHR5cGVvZih0ZW1wQXJyYXlbMV0pICE9IFwidW5kZWZpbmVkXCIpIHRoZW4gdmFsID0gdGVtcEFycmF5WzFdXG5cdFx0XHRyZXR1cm5PYmplY3RbdGVtcEFycmF5WzBdXSA9IHZhbFxuXG5cdFx0cmV0dXJuIHJldHVybk9iamVjdFxuXG5cdGdldFF1ZXJ5UGFyYW1zID0gKCkgLT5cblx0XHRyZXR1cm4gcXVlcnlQYXJhbXNcblxuXHRzZXRDU1NQcm9wcyA9ICggZSwgcHJvcHMgKSAtPlxuXHRcdGZvciBrLHYgb2YgcHJvcHNcblx0XHRcdGUuc3R5bGVba10gPSB2XG5cblx0cmV0dXJuIHtcblx0XHRpbml0OiBpbml0XG5cdFx0Z2V0UXVlcnlQYXJhbXMgOiBnZXRRdWVyeVBhcmFtc1xuXHR9XG5cbiMgZ2xvYmFsc1xuZ2xvYmFscyA9XG5cblx0JCA6ICggaWQgKSAtPlxuXHRcdHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCBpZFxuXG5cdGVsIDogKCB0eXBlLCBjbHMgKSAtPlxuXHRcdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50IHR5cGVcblx0XHRpZiAoIGNscyApIFxuXHRcdFx0ZS5jbGFzc05hbWUgPSBjbHM7XG5cdFx0cmV0dXJuIGVcblxuXHRNYWluOiBNYWluXG5cbmZvciBrLHYgb2YgZ2xvYmFsc1xuXHR3aW5kb3dba10gPSB2XG5cblxuI2xhdW5jaFxuaWYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcblx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJ2xvYWQnLCAoIGUgKSAtPlxuXHRcdE1haW4uaW5pdCgpXG5cdCwgZmFsc2VcbmVsc2UgaWYgd2luZG93LmF0dGFjaEV2ZW50XG5cdHdpbmRvdy5hdHRhY2hFdmVudCAnbG9hZCcsICggZSApIC0+XG5cdFx0TWFpbi5pbml0KClcblx0LCBmYWxzZSIsIlxuXG5OVU1fQ0lSQ0xFUyA9IDEwXG5cbmNsYXNzIENpcmNsZUZ4XG5cdGNvbnN0cnVjdG9yOigpLT5cblxuXG5cdHNob3c6KEBzbmFwKT0+XG5cblx0XHRAcyA9IEBzbmFwLnN2ZygwLDAsXCIxMDAlXCIsIFwiMTAwJVwiLCAwLDAsMTAwMCwxMDAwKS5hdHRyKHsgY2xhc3MgOiAnY2lyY2xlcycgfSlcblx0XHRAZyA9IEBzLmcoKVxuXG5cdFx0QGNpcmNsZXMgPSBbXVxuXG5cdFx0Zm9yIGkgaW4gWzAuLk5VTV9DSVJDTEVTXSBieSAxXG5cdFx0XHRuZXdDaXJjbGUgPSBAcy5jaXJjbGUoNTAwLDUwMCw0MDApLmF0dHIoIHsgY2xhc3MgOiBcImNpcmNsZVwiIH0pXG5cdFx0XHRAY2lyY2xlcy5wdXNoIG5ld0NpcmNsZVxuXHRcdFx0QGcuYWRkIG5ld0NpcmNsZVxuXG5cblx0aGlkZTooKT0+XG5cdFx0Zm9yIGNpcmNsZSBpbiBAY2lyY2xlc1xuXHRcdFx0Y2lyY2xlLnJlbW92ZSgpXG5cblx0XHRAcy5yZW1vdmUoKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gQ2lyY2xlRngiLCJFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiZXZlbnRzXCIpLkV2ZW50RW1pdHRlclxuXG5DaXJjbGVGeCA9IHJlcXVpcmUgXCIuL0NpcmNsZUZ4LmNvZmZlZVwiXG5cbmNsYXNzIENvbnRyb2xsZXJGeCBleHRlbmRzIEV2ZW50RW1pdHRlclxuXHRjb25zdHJ1Y3RvcjooKS0+XG5cblx0XHRAb3ZlcmxheSA9ICQgXCJidXR0b25PdmVybGF5XCJcblx0XHRAbGFzdEJ1dHRvbklkID0gXCJcIlxuXG5cdFx0QGNpcmNsZUZ4ID0gbmV3IENpcmNsZUZ4KClcblxuXHRidXR0b25QcmVzc2VkOihAbGFzdEJ1dHRvbklkLCBidXR0b25PYmopPT5cblx0XHRAb3ZlcmxheS5jbGFzc0xpc3QuYWRkIFwidmlzaWJsZVwiXG5cdFx0QG92ZXJsYXkuY2xhc3NMaXN0LmFkZCBAbGFzdEJ1dHRvbklkXG5cblx0XHQjICMgVE9ETyAtIGFkZCBtb3JlIEZYXG5cdFx0IyBAY2lyY2xlRnguc2hvdyBidXR0b25PYmouc25hcFxuXG5cdGJ1dHRvblJlbGVhc2VkOigpPT5cblx0XHRAb3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlIFwidmlzaWJsZVwiXG5cdFx0QG92ZXJsYXkuY2xhc3NMaXN0LnJlbW92ZSBAbGFzdEJ1dHRvbklkXG5cblx0XHQjIEBjaXJjbGVGeC5oaWRlKClcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyRngiLCJFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiZXZlbnRzXCIpLkV2ZW50RW1pdHRlclxuXG5Db25maWcgPSByZXF1aXJlIFwiLi4vY29uZmlnL0NvbmZpZy5jb2ZmZWVcIlxuXG5jbGFzcyBCdXR0b24gZXh0ZW5kcyBFdmVudEVtaXR0ZXJcblx0Y29uc3RydWN0b3I6KEBpZCktPlxuXG5cdFx0QGVuYWJsZWQgPSBmYWxzZVxuXHRcdEBjbGlja2VkID0gZmFsc2Vcblx0XHRAZWxlbWVudCA9IGVsIFwiZGl2XCIsIFwiYnRuXCJcblxuXHRcdEBlbGVtZW50LnNldEF0dHJpYnV0ZSBcImlkXCIsIFwiYnRuI3tAaWR9XCJcblx0XHRAZWxlbWVudC5zZXRBdHRyaWJ1dGUgXCJidXR0b25JbmRleFwiLCBcIiN7QGlkfVwiXG5cblx0XHRAYW5pbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJzdmdcIik7XG5cdFx0QGFuaW0uY2xhc3NMaXN0LmFkZCBcImFuaW1cIlxuXHRcdEBlbGVtZW50LmFwcGVuZENoaWxkIEBhbmltXG5cblx0XHQjIGNpcmNsZSBGWFxuXG5cdFx0QGNpcmNsZUVsZW1lbnRzID0gW11cblx0XHRAY2lyY2xlQ29udGFpbmVyID0gZWwgXCJkaXZcIiwgXCJjaXJjbGVDb250YWluZXJcIlxuXHRcdGZvciBpIGluIFswLi41XSBieSAxXG5cdFx0XHRuZXdDaXJjbGUgPSBlbCBcImRpdlwiLCBcImNpcmNsZVwiXG5cdFx0XHRAY2lyY2xlRWxlbWVudHMucHVzaCBuZXdDaXJjbGVcblx0XHRcdEBjaXJjbGVDb250YWluZXIuYXBwZW5kQ2hpbGQgbmV3Q2lyY2xlXG5cblx0XHRAZWxlbWVudC5hcHBlbmRDaGlsZCBAY2lyY2xlQ29udGFpbmVyXG5cblx0XHRAbGFiZWwgPSBlbCBcImRpdlwiLCBcImxhYmVsXCJcblx0XHRAZWxlbWVudC5hcHBlbmRDaGlsZCBAbGFiZWxcblxuXHRcdEBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgXCJ0YXBob2xkXCIsIChldmVudCk9PlxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG5cdFx0QGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciBcInRvdWNoc3RhcnRcIiwgQG9uQ2xpY2tcblx0XHRAZWxlbWVudC5hZGRFdmVudExpc3RlbmVyIFwibW91c2Vkb3duXCIsIEBvbkNsaWNrXG5cdFx0IyBAZWxlbWVudC5hZGRFdmVudExpc3RlbmVyIFwidm1vdXNlZG93blwiLCBAb25DbGlja1xuXG5cdFx0QGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciBcInRvdWNoZW5kXCIsIEBvblJlbGVhc2Vcblx0XHRAZWxlbWVudC5hZGRFdmVudExpc3RlbmVyIFwibW91c2V1cFwiLCBAb25SZWxlYXNlXG5cdFx0IyBAZWxlbWVudC5hZGRFdmVudExpc3RlbmVyIFwidm1vdXNldXBcIiwgQG9uUmVsZWFzZVxuXG5cdFx0XG5cdFx0QGF1dG9UaW1lb3V0SWQgPSAtMVxuXG5cblx0Z2V0RWxlbWVudDooKT0+XG5cdFx0cmV0dXJuIEBlbGVtZW50XG5cblx0c2V0TGFiZWw6KGxhYmVsVGV4dCk9PlxuXHRcdEBsYWJlbC5pbm5lckhUTUwgPSBsYWJlbFRleHRcblxuXG5cdG9uQ2xpY2s6KGV2ZW50KT0+XG5cdFx0XG5cdFx0aWYgZXZlbnRcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuXHRcdGNsZWFyVGltZW91dChAYXV0b1RpbWVvdXRJZClcblx0XHRAYXV0b1RpbWVvdXRJZCA9IHNldFRpbWVvdXQoQG9uUmVsZWFzZSwgQ29uZmlnLkJVVFRPTl9USU1FT1VUKVxuXG5cdFx0QHNuYXAgPSBTbmFwKEBhbmltKVxuXG5cdFx0aWYgQGVuYWJsZWQgYW5kIG5vdCBAY2xpY2tlZFxuXHRcdFx0QGNsaWNrZWQgPSB0cnVlXG5cdFx0XHRAZW1pdChcImNsaWNrXCIsIHsgaWQgOiBAaWQgfSlcblx0XHRcdEBlbGVtZW50LmNsYXNzTGlzdC5hZGQgXCJjbGlja2VkXCJcblxuXHRcdFx0IyBzZXRUaW1lb3V0KCgpPT5cblx0XHRcdCMgXHRpZiBAZW5hYmxlZFxuXHRcdFx0IyBcdFx0QGVtaXQgXCJyZWxlYXNlXCIsIHsgaWQgOiBAaWQgfVxuXHRcdFx0IyBcdFx0QGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSBcImNsaWNrZWRcIlxuXHRcdFx0IyBcdFx0QGFuaW0uaW5uZXJUZXh0ID0gXCJcIlxuXHRcdFx0IyBcdFx0QHNuYXAgPSBudWxsXG5cdFx0XHQjICw1MDAwKVxuXG5cdG9uUmVsZWFzZTooZXZlbnQpPT5cblxuXHRcdGlmIGV2ZW50XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cblx0XHRjbGVhclRpbWVvdXQoQGF1dG9UaW1lb3V0SWQpXG5cblx0XHRpZiBAZW5hYmxlZCBhbmQgQGNsaWNrZWRcblx0XHRcdEBjbGlja2VkID0gZmFsc2Vcblx0XHRcdEBlbWl0IFwicmVsZWFzZVwiLCB7IGlkIDogQGlkIH1cblx0XHRcdEBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUgXCJjbGlja2VkXCJcblx0XHRcdEBhbmltLmlubmVyVGV4dCA9IFwiXCJcblx0XHRcdEBzbmFwID0gbnVsbFxuXG5cdGVuYWJsZTooKT0+XG5cdFx0QGVuYWJsZWQgPSB0cnVlXG5cblx0XHQjIFRPRE8gOiBjc3MgY2hhbmdlcyBmb3IgZW5hYmxlZCAvIGRpc2FibGVkIHN0YXRlXG5cdFx0QGVsZW1lbnQuY2xhc3NMaXN0LmFkZCBcImVuYWJsZWRcIlxuXG5cdGRpc2FibGU6KCk9PlxuXHRcdEBlbmFibGVkID0gZmFsc2VcblxuXHRcdCMgVE9ETyA6IGNzcyBjaGFuZ2VzIGZvciBlbmFibGVkIC8gZGlzYWJsZWQgc3RhdGVcblx0XHRAZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlIFwiZW5hYmxlZFwiXG5cblxuXHRwZWVyUHJlc3NlZDooKT0+XG5cblx0XHRAZWxlbWVudC5jbGFzc0xpc3QuYWRkIFwicGVlclByZXNzZWRcIlxuXG5cdHBlZXJSZWxlYXNlZDooKT0+XG5cblx0XHRAZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlIFwicGVlclByZXNzZWRcIlxuXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbiJdfQ==
