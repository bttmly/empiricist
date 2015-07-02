"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var assert = require("assert");

var _require = require("events");

var EventEmitter = _require.EventEmitter;

var assign = require("object-assign");

var _require2 = require("./pkg-util");

var isFunction = _require2.isFunction;
var isObject = _require2.isObject;
var makeId = _require2.makeId;

function isMaybeFunction(maybeFn) {
  return maybeFn == null || isFunction(maybeFn);
}

module.exports = (function (_EventEmitter) {
  function Experiment(name) {
    _classCallCheck(this, Experiment);

    _get(Object.getPrototypeOf(Experiment.prototype), "constructor", this).call(this);
    this.name = name;
    this.metadata = {};
  }

  _inherits(Experiment, _EventEmitter);

  _createClass(Experiment, [{
    key: "use",
    value: function use(fn) {
      assert(isFunction(fn), "`use` requires a function argument.");
      this.control = fn;
      return this;
    }
  }, {
    key: "try",
    value: function _try(fn) {
      assert(isFunction(fn), "`try` requires a function argument.");
      this.candidate = fn;
      return this;
    }
  }, {
    key: "setMetadata",
    value: function setMetadata(metadata) {
      assert(isObject(metadata), "`setMetadata` requires an object argument");
      assign(this.metadata, metadata);
      return this;
    }
  }, {
    key: "emitTrial",
    value: function emitTrial(control, candidate) {
      var o = { name: this.name, id: makeId(), control: control, candidate: candidate };
      this.emit(this.match(control, candidate) ? "match" : "mismatch", o);
      this.emit("trial", o);
      return this;
    }
  }, {
    key: "enabled",
    value: function enabled() {
      return isFunction(this.candidate);
    }
  }, {
    key: "match",
    value: function match(control, candidate) {
      return control.returned === candidate.returned;
    }
  }, {
    key: "beforeRun",
    value: function beforeRun(args) {
      return args;
    }
  }], [{
    key: "assertValid",
    value: function assertValid(e) {
      assert(isFunction(e.control));
      assert(isFunction(e.enabled));
      assert(isFunction(e.beforeRun));
      assert(isMaybeFunction(e.candidate));
    }
  }]);

  return Experiment;
})(EventEmitter);