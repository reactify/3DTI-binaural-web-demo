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
var JoystickView, PhoneControllerClient, TuneInAppMobile,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

PhoneControllerClient = require("../mobile/PhoneControllerClient.coffee");

JoystickView = require("../mobile/JoystickView.coffee");

TuneInAppMobile = (function() {
  function TuneInAppMobile() {
    this.resize = bind(this.resize, this);
    this.render = bind(this.render, this);
    this.onJoinButtonPress = bind(this.onJoinButtonPress, this);
    this.init = bind(this.init, this);
    this.loaded = false;
    this.codeDialog = $('mobileDialog');
    this.codeInput = this.codeDialog.querySelector("input");
    this.codeInput.addEventListener("change", this.onCodeValueChange);
    this.joystick = new JoystickView();
    this.joystick.init();
    this.controller = new PhoneControllerClient();
    this.controller.on("move", this.joystick.onMove);
    this.controller.on("stop", this.joystick.onStop);
    this.controller.onSocketStart("2");
  }

  TuneInAppMobile.prototype.init = function() {
    window.addEventListener("resize", this.resize);
    window.addEventListener("orientationchange", this.resize);
    this.resize();
    return this.loaded = true;
  };

  TuneInAppMobile.prototype.onJoinButtonPress = function() {
    if (!this.gameId) {
      this.joinButton.classList.remove("enabled");
      this.gameId = this.codeInput.value.toUpperCase();
      console.log("trying to connect with game id : " + this.gameId);
      this.controlClient.on("start", this.onGameStart);
      this.controlClient.on("error", this.onConnectError);
      return this.controlClient.init(this.gameId);
    } else {
      return this.controlClient.connectToGame(this.gameId);
    }
  };

  TuneInAppMobile.prototype.render = function() {};

  TuneInAppMobile.prototype.resize = function() {};

  return TuneInAppMobile;

})();

module.exports = TuneInAppMobile;


},{"../mobile/JoystickView.coffee":4,"../mobile/PhoneControllerClient.coffee":5}],3:[function(require,module,exports){
var App, Main, globals, k, v;

App = require("./app/app.mobile.coffee");

Main = new function() {
  var app, audio, getQueryParams, init, initialized, parseQueryString, queryParams, render, setCSSProps, stats;
  initialized = false;
  app = null;
  stats = null;
  queryParams = null;
  audio = null;
  init = function() {
    if (!initialized) {
      initialized = true;
      queryParams = parseQueryString();
      app = new App();
      app.init();
      return window.requestAnimationFrame(render);
    }
  };
  render = function() {
    window.requestAnimationFrame(render);
    if (initialized) {
      return app.render();
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
    getQueryParams: getQueryParams,
    audio: audio
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


},{"./app/app.mobile.coffee":2}],4:[function(require,module,exports){
var EventEmitter, JoystickView,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventEmitter = require("events").EventEmitter;

JoystickView = (function(superClass) {
  extend(JoystickView, superClass);

  function JoystickView(container) {
    this.container = container;
    this.onStop = bind(this.onStop, this);
    this.onMove = bind(this.onMove, this);
    this.init = bind(this.init, this);
    this.originCanvas = this.container.querySelector("#origin");
    this.touchCanvas = this.container.querySelector("#touch");
    this.bgCanvas = this.container.querySelector("#uiBackground");
  }

  JoystickView.prototype.init = function() {
    return this.originCtx = this.originCanvas.getContext("2d");
  };

  JoystickView.prototype.onMove = function(data) {};

  JoystickView.prototype.onStop = function() {
    return this.touchCanvas.removeClass("visible");
  };

  return JoystickView;

})(EventEmitter);

module.exports = JoystickView;


},{"events":1}],5:[function(require,module,exports){
var EventEmitter, PhoneControllerClient,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventEmitter = require("events").EventEmitter;

PhoneControllerClient = (function(superClass) {
  extend(PhoneControllerClient, superClass);

  function PhoneControllerClient() {
    this.reset = bind(this.reset, this);
    this.onInputStop = bind(this.onInputStop, this);
    this.onInput = bind(this.onInput, this);
    this.onSocketStart = bind(this.onSocketStart, this);
    this.connectToGame = bind(this.connectToGame, this);
    this.origin = null;
  }

  PhoneControllerClient.prototype.init = function(gameId1) {
    this.gameId = gameId1;
    this.socket = io.connect((location.host || 'localhost').split(':')[0] + ":8080");
    this.socket.on("connection", (function(_this) {
      return function() {
        return _this.connectToGame(_this.gameId);
      };
    })(this));
    this.socket.on("errorMessage", (function(_this) {
      return function(data) {
        return _this.emit("error", data);
      };
    })(this));
    return this.socket.on("start", this.onSocketStart);
  };

  PhoneControllerClient.prototype.connectToGame = function(gameId) {
    if (this.socket) {
      return this.socket.emit("identifyPhone", gameId);
    }
  };

  PhoneControllerClient.prototype.onSocketStart = function(data) {
    document.body.removeEventListener("mousemove", this.onInput);
    document.body.addEventListener("mousemove", this.onInput);
    document.body.removeEventListener("mousedown", this.onInput);
    document.body.addEventListener("mousedown", this.onInput);
    return this.emit("start", data);
  };

  PhoneControllerClient.prototype.onInput = function(e) {
    var dX, dY;
    dX = ((e.x / document.body.clientWidth) - 0.5) * 2;
    dY = ((e.y / document.body.clientHeight) - 0.5) * 2;
    if (this.socket) {
      this.socket.emit("moved", {
        x: dX,
        y: dY
      });
    }
    return this.emit("moved", {
      x: dX,
      y: dY
    });
  };

  PhoneControllerClient.prototype.onInputStop = function() {
    if (this.socket) {
      this.socket.emit("stop", null);
    }
    return this.emit("stop", null);
  };

  PhoneControllerClient.prototype.reset = function() {
    return this.origin = null;
  };

  return PhoneControllerClient;

})(EventEmitter);

module.exports = PhoneControllerClient;


},{"events":1}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIi9Vc2Vycy95dWxpbGV2dG92MS93b3Jrc3BhY2UvM0RUSS8zRFRJLWJpbmF1cmFsLXdlYi1kZW1vL3dlYmRlbW8tYXBwL3NyYy9hcHAvYXBwLm1vYmlsZS5jb2ZmZWUiLCIvVXNlcnMveXVsaWxldnRvdjEvd29ya3NwYWNlLzNEVEkvM0RUSS1iaW5hdXJhbC13ZWItZGVtby93ZWJkZW1vLWFwcC9zcmMvbWFpbi5tb2JpbGUuY29mZmVlIiwiL1VzZXJzL3l1bGlsZXZ0b3YxL3dvcmtzcGFjZS8zRFRJLzNEVEktYmluYXVyYWwtd2ViLWRlbW8vd2ViZGVtby1hcHAvc3JjL21vYmlsZS9Kb3lzdGlja1ZpZXcuY29mZmVlIiwiL1VzZXJzL3l1bGlsZXZ0b3YxL3dvcmtzcGFjZS8zRFRJLzNEVEktYmluYXVyYWwtd2ViLWRlbW8vd2ViZGVtby1hcHAvc3JjL21vYmlsZS9QaG9uZUNvbnRyb2xsZXJDbGllbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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R0FBNkM7SUFFbEQsSUFBRyxJQUFDLENBQUEsTUFBSjtNQUNDLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixDQUFhLE9BQWIsRUFBc0I7UUFBRSxDQUFBLEVBQUksRUFBTjtRQUFVLENBQUEsRUFBSSxFQUFkO09BQXRCLEVBREQ7O1dBR0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxPQUFOLEVBQWU7TUFBRSxDQUFBLEVBQUksRUFBTjtNQUFVLENBQUEsRUFBSSxFQUFkO0tBQWY7RUFWTzs7a0NBWVIsV0FBQSxHQUFZLFNBQUE7SUFDWCxJQUFHLElBQUMsQ0FBQSxNQUFKO01BQ0MsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLENBQWEsTUFBYixFQUFxQixJQUFyQixFQUREOztXQUVBLElBQUMsQ0FBQSxJQUFELENBQU0sTUFBTixFQUFjLElBQWQ7RUFIVzs7a0NBK0JaLEtBQUEsR0FBTSxTQUFBO1dBQ0wsSUFBQyxDQUFBLE1BQUQsR0FBVTtFQURMOzs7O0dBMUU2Qjs7QUErRXBDLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIlBob25lQ29udHJvbGxlckNsaWVudCA9IHJlcXVpcmUgXCIuLi9tb2JpbGUvUGhvbmVDb250cm9sbGVyQ2xpZW50LmNvZmZlZVwiXG5Kb3lzdGlja1ZpZXcgPSByZXF1aXJlIFwiLi4vbW9iaWxlL0pveXN0aWNrVmlldy5jb2ZmZWVcIlxuXG5jbGFzcyBUdW5lSW5BcHBNb2JpbGVcblx0Y29uc3RydWN0b3I6KCktPlxuXG5cdFx0QGxvYWRlZCA9IGZhbHNlXG5cblx0XHRAY29kZURpYWxvZyA9ICQoJ21vYmlsZURpYWxvZycpXG5cblx0XHRAY29kZUlucHV0ID0gQGNvZGVEaWFsb2cucXVlcnlTZWxlY3RvcihcImlucHV0XCIpXG5cdFx0QGNvZGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIEBvbkNvZGVWYWx1ZUNoYW5nZSlcblx0XG5cdFx0QGpveXN0aWNrID0gbmV3IEpveXN0aWNrVmlldygpXG5cdFx0QGpveXN0aWNrLmluaXQoKVxuXG5cblx0XHRAY29udHJvbGxlciA9IG5ldyBQaG9uZUNvbnRyb2xsZXJDbGllbnQoKVxuXHRcdEBjb250cm9sbGVyLm9uIFwibW92ZVwiLCBAam95c3RpY2sub25Nb3ZlXG5cdFx0QGNvbnRyb2xsZXIub24gXCJzdG9wXCIsIEBqb3lzdGljay5vblN0b3BcblxuXHRcdCMgREVCVUdcblx0XHRAY29udHJvbGxlci5vblNvY2tldFN0YXJ0KFwiMlwiKVxuXG5cblx0aW5pdDooKT0+XG5cblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciBcInJlc2l6ZVwiLCBAcmVzaXplXG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIgXCJvcmllbnRhdGlvbmNoYW5nZVwiLCBAcmVzaXplXG5cblx0XHRAcmVzaXplKClcblxuXHRcdEBsb2FkZWQgPSB0cnVlXG5cblx0b25Kb2luQnV0dG9uUHJlc3M6KCk9PlxuXG5cdFx0aWYgIUBnYW1lSWRcblx0XHRcdEBqb2luQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJlbmFibGVkXCIpXG5cblx0XHRcdEBnYW1lSWQgPSBAY29kZUlucHV0LnZhbHVlLnRvVXBwZXJDYXNlKClcblxuXHRcdFx0I0RFQlVHXG5cdFx0XHQjIEBnYW1lSWQgPSBcIlRFU1RcIlxuXG5cdFx0XHRjb25zb2xlLmxvZyBcInRyeWluZyB0byBjb25uZWN0IHdpdGggZ2FtZSBpZCA6ICN7QGdhbWVJZH1cIlxuXG5cdFx0XHRAY29udHJvbENsaWVudC5vbihcInN0YXJ0XCIsIEBvbkdhbWVTdGFydClcblx0XHRcdEBjb250cm9sQ2xpZW50Lm9uKFwiZXJyb3JcIiwgQG9uQ29ubmVjdEVycm9yKVxuXG5cdFx0XHRAY29udHJvbENsaWVudC5pbml0KEBnYW1lSWQpXG5cdFx0ZWxzZVxuXHRcdFx0QGNvbnRyb2xDbGllbnQuY29ubmVjdFRvR2FtZShAZ2FtZUlkKVxuXHRcdFxuXG5cdHJlbmRlcjooKT0+XG5cblx0XHQjIGlmIEBsb2FkZWRcblxuXHRyZXNpemU6KCk9PlxuXG5cbm1vZHVsZS5leHBvcnRzID0gVHVuZUluQXBwTW9iaWxlIiwiIyBDb250cm9sbGVyIG1haW5cblxuQXBwID0gcmVxdWlyZSBcIi4vYXBwL2FwcC5tb2JpbGUuY29mZmVlXCJcblxuTWFpbiA9IG5ldyAtPlxuXHRpbml0aWFsaXplZCA9IGZhbHNlXG5cdGFwcCA9IG51bGxcblx0c3RhdHMgPSBudWxsXG5cdHF1ZXJ5UGFyYW1zID0gbnVsbFxuXHRhdWRpbyA9IG51bGxcblxuXHRpbml0ID0gKCkgLT5cblx0XHRpZiAhaW5pdGlhbGl6ZWRcblx0XHRcdGluaXRpYWxpemVkID0gdHJ1ZVxuXG5cdFx0XHRxdWVyeVBhcmFtcyA9IHBhcnNlUXVlcnlTdHJpbmcoKVxuXG5cdFx0XHRhcHAgPSBuZXcgQXBwKClcblx0XHRcdGFwcC5pbml0KClcblxuXHRcdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSByZW5kZXJcblxuXHRyZW5kZXIgPSAoKS0+XG5cdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSByZW5kZXJcblx0XHRcblx0XHRpZiBpbml0aWFsaXplZFxuXHRcdFx0YXBwLnJlbmRlcigpXG5cblxuXHRwYXJzZVF1ZXJ5U3RyaW5nID0gKCkgLT5cblx0XHRxdWVyeVN0cmluZyA9IGRvY3VtZW50LmxvY2F0aW9uLmhyZWZcblx0XHRxdWVyeUluZGV4ID0gcXVlcnlTdHJpbmcuaW5kZXhPZihcIj9cIilcblx0XHRxdWVyeVN0cmluZ0FycmF5ID0gW11cblxuXHRcdGlmIHF1ZXJ5SW5kZXggIT0gLTEgJiYgcXVlcnlJbmRleCsxICE9IHF1ZXJ5U3RyaW5nLmxlbmd0aFxuXHRcdFx0cXVlcnlTdHJpbmcgPSBxdWVyeVN0cmluZy5zdWJzdHJpbmcocXVlcnlJbmRleCsxLCBxdWVyeVN0cmluZy5sZW5ndGgpXG5cdFx0XHRxdWVyeVN0cmluZ0FycmF5ID0gcXVlcnlTdHJpbmcuc3BsaXQoXCImXCIpXG5cblx0XHRyZXR1cm5PYmplY3QgPSB7fVxuXHRcdGZvciBpIGluIFswLi5xdWVyeVN0cmluZ0FycmF5Lmxlbmd0aC0xXSBieSAxXG5cdFx0XHR0ZW1wQXJyYXkgPSBxdWVyeVN0cmluZ0FycmF5W2ldLnNwbGl0KFwiPVwiKVxuXHRcdFx0dmFsID0gdHJ1ZVxuXHRcdFx0aWYgKHR5cGVvZih0ZW1wQXJyYXlbMV0pICE9IFwidW5kZWZpbmVkXCIpIHRoZW4gdmFsID0gdGVtcEFycmF5WzFdXG5cdFx0XHRyZXR1cm5PYmplY3RbdGVtcEFycmF5WzBdXSA9IHZhbFxuXG5cdFx0cmV0dXJuIHJldHVybk9iamVjdFxuXG5cdGdldFF1ZXJ5UGFyYW1zID0gKCkgLT5cblx0XHRyZXR1cm4gcXVlcnlQYXJhbXNcblxuXHRzZXRDU1NQcm9wcyA9ICggZSwgcHJvcHMgKSAtPlxuXHRcdGZvciBrLHYgb2YgcHJvcHNcblx0XHRcdGUuc3R5bGVba10gPSB2XG5cblx0cmV0dXJuIHtcblx0XHRpbml0OiBpbml0XG5cdFx0Z2V0UXVlcnlQYXJhbXMgOiBnZXRRdWVyeVBhcmFtc1xuXHRcdGF1ZGlvIDogYXVkaW9cblx0fVxuXG4jIGdsb2JhbHNcbmdsb2JhbHMgPVxuXG5cdCQgOiAoIGlkICkgLT5cblx0XHRyZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgaWRcblxuXHRlbCA6ICggdHlwZSwgY2xzICkgLT5cblx0XHRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCB0eXBlXG5cdFx0aWYgKCBjbHMgKSBcblx0XHRcdGUuY2xhc3NOYW1lID0gY2xzO1xuXHRcdHJldHVybiBlXG5cblx0TWFpbjogTWFpblxuXG5mb3Igayx2IG9mIGdsb2JhbHNcblx0d2luZG93W2tdID0gdlxuXG5cbiNsYXVuY2hcbmlmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICdsb2FkJywgKCBlICkgLT5cblx0XHRNYWluLmluaXQoKVxuXHQsIGZhbHNlXG5lbHNlIGlmIHdpbmRvdy5hdHRhY2hFdmVudFxuXHR3aW5kb3cuYXR0YWNoRXZlbnQgJ2xvYWQnLCAoIGUgKSAtPlxuXHRcdE1haW4uaW5pdCgpXG5cdCwgZmFsc2UiLCJFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiZXZlbnRzXCIpLkV2ZW50RW1pdHRlclxuXG5cbmNsYXNzIEpveXN0aWNrVmlldyBleHRlbmRzIEV2ZW50RW1pdHRlclxuXHRjb25zdHJ1Y3RvcjooQGNvbnRhaW5lciktPlxuXG5cdFx0QG9yaWdpbkNhbnZhcyA9IEBjb250YWluZXIucXVlcnlTZWxlY3RvcihcIiNvcmlnaW5cIilcblx0XHRAdG91Y2hDYW52YXMgPSBAY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIjdG91Y2hcIilcblx0XHRAYmdDYW52YXMgPSBAY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIjdWlCYWNrZ3JvdW5kXCIpXG5cblxuXG5cblx0aW5pdDooKT0+XG5cblx0XHQjIGRyYXcgb3JpZ2luXG5cdFx0QG9yaWdpbkN0eCA9IEBvcmlnaW5DYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpXG5cblxuXHRvbk1vdmU6KGRhdGEpPT5cblxuXG5cblx0b25TdG9wOigpPT5cblx0XHRAdG91Y2hDYW52YXMucmVtb3ZlQ2xhc3MgXCJ2aXNpYmxlXCJcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gSm95c3RpY2tWaWV3IiwiRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcImV2ZW50c1wiKS5FdmVudEVtaXR0ZXJcblxuXG5jbGFzcyBQaG9uZUNvbnRyb2xsZXJDbGllbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXJcblx0Y29uc3RydWN0b3I6KCktPlxuXG5cdFx0QG9yaWdpbiA9IG51bGxcblxuXHRpbml0OihAZ2FtZUlkKS0+XG5cblx0XHRAc29ja2V0ID0gaW8uY29ubmVjdCgobG9jYXRpb24uaG9zdCB8fCAnbG9jYWxob3N0Jykuc3BsaXQoJzonKVswXSArIFwiOjgwODBcIilcblx0XHRAc29ja2V0Lm9uKFwiY29ubmVjdGlvblwiLCAoKT0+XG5cdFx0XHRAY29ubmVjdFRvR2FtZShAZ2FtZUlkKVxuXHRcdFx0KVxuXG5cdFx0QHNvY2tldC5vbihcImVycm9yTWVzc2FnZVwiLCAoZGF0YSk9PlxuXHRcdFx0QGVtaXQoXCJlcnJvclwiLCBkYXRhKVxuXHRcdClcblx0XHRAc29ja2V0Lm9uKFwic3RhcnRcIiwgQG9uU29ja2V0U3RhcnQpXG5cblx0Y29ubmVjdFRvR2FtZTooZ2FtZUlkKT0+XG5cdFx0aWYgQHNvY2tldFxuXHRcdFx0QHNvY2tldC5lbWl0KFwiaWRlbnRpZnlQaG9uZVwiLCBnYW1lSWQpXG5cblx0b25Tb2NrZXRTdGFydDooZGF0YSk9PlxuXHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBAb25JbnB1dClcblx0XHRkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgQG9uSW5wdXQpXG5cblx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgQG9uSW5wdXQpXG5cdFx0ZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIEBvbklucHV0KVxuXG5cdFx0QGVtaXQoXCJzdGFydFwiLCBkYXRhKVxuXG5cblx0b25JbnB1dDooZSk9PlxuXG5cdFx0IyBjb25zb2xlLmxvZyBlXG5cblx0XHRkWCA9ICgoZS54IC8gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCkgLSAwLjUpICogMlxuXHRcdGRZID0gKChlLnkgLyBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodCkgLSAwLjUpICogMlxuXG5cdFx0aWYgQHNvY2tldFxuXHRcdFx0QHNvY2tldC5lbWl0IFwibW92ZWRcIiwgeyB4IDogZFgsIHkgOiBkWSB9XG5cblx0XHRAZW1pdCBcIm1vdmVkXCIsIHsgeCA6IGRYLCB5IDogZFkgfVxuXG5cdG9uSW5wdXRTdG9wOigpPT5cblx0XHRpZiBAc29ja2V0XG5cdFx0XHRAc29ja2V0LmVtaXQgXCJzdG9wXCIsIG51bGxcblx0XHRAZW1pdCBcInN0b3BcIiwgbnVsbFxuXG5cblx0IyBvbkNsaWNrQnV0dG9uOigpPT5cblx0IyBcdGlmIEBzb2NrZXRcblx0IyBcdFx0QHNvY2tldC5lbWl0IFwiY2xpY2tcIiwgbnVsbFxuXG5cdCMgb25TaWduYWw6KG1lc3NhZ2UpPT5cblx0IyBcdGlmIEBzb2NrZXRcblx0IyBcdFx0QHNvY2tldC5lbWl0IFwic2lnbmFsXCIsIG1lc3NhZ2VcblxuXHQjIG9uRGV2aWNlT3JpZW50YXRpb246KGUpPT5cblxuXHQjIFx0aWYgQG9yaWdpbiA9PSBudWxsXG5cdCMgXHRcdEBvcmlnaW4gPSB7XG5cdCMgXHRcdFx0YWxwaGEgOiBlLmFscGhhXG5cdCMgXHRcdFx0YmV0YSA6IGUuYmV0YVxuXHQjIFx0XHRcdGdhbW1hIDogZS5nYW1tYVxuXHQjIFx0XHR9XG5cdCMgXHRcdHJldHVyblxuXHQjIFx0ZWxzZVxuXHQjIFx0XHRAbW90aW9uRGF0YS5hbHBoYSA9IFV0aWxzLnJkIFV0aWxzLnRyaWdBbmdsZURpZmYoIGUuYWxwaGEsIEBvcmlnaW4uYWxwaGEgKVxuXHQjIFx0XHRAbW90aW9uRGF0YS5iZXRhID0gVXRpbHMucmQgVXRpbHMudHJpZ0FuZ2xlRGlmZiggZS5iZXRhLCBAb3JpZ2luLmJldGEgKVxuXHQjIFx0XHRAbW90aW9uRGF0YS5nYW1tYSA9IFV0aWxzLnJkIFV0aWxzLnRyaWdBbmdsZURpZmYoIGUuZ2FtbWEsIEBvcmlnaW4uZ2FtbWEgKVxuXG5cdCMgXHRcdGlmIEBzb2NrZXRcblx0IyBcdFx0XHRAc29ja2V0LmVtaXQoXCJtb3Rpb25cIiwgQG1vdGlvbkRhdGEpXG5cblx0cmVzZXQ6KCk9PlxuXHRcdEBvcmlnaW4gPSBudWxsXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFBob25lQ29udHJvbGxlckNsaWVudCJdfQ==
