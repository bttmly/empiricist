"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var assert = require("assert");

var _require = require("events");

var EventEmitter = _require.EventEmitter;

var _require2 = require("util");

var isFunction = _require2.isFunction;
var isObject = _require2.isObject;

function isMaybeFunction(maybeFn) {
  return maybeFn == null || isFunction(maybeFn);
}

var Experiment = (function (_EventEmitter) {
  function Experiment(name) {
    _classCallCheck(this, Experiment);

    _get(Object.getPrototypeOf(Experiment.prototype), "constructor", this).call(this);
    this.name = name;
    this._metadata = {};
    this._context = null;
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
    key: "enabled",
    value: function enabled() {
      return this.hasOwnProperty("candidate") && typeof this.candidate === "function";
    }
  }, {
    key: "report",
    value: function report() {}
  }, {
    key: "clean",
    value: function clean(observation) {
      return observation;
    }
  }, {
    key: "match",
    value: function match(_ref) {
      var control = _ref.control;
      var candidate = _ref.candidate;

      return control.returned === candidate.returned;
    }
  }, {
    key: "beforeRun",
    value: function beforeRun(args) {
      return args;
    }
  }, {
    key: "setMetadata",
    value: function setMetadata(metadata) {
      assert(isObject(metadata), "`setMetadata` requires an object argument");
      this._metadata = metadata;
      return this;
    }
  }, {
    key: "setContext",
    value: function setContext(context) {
      this._context = context;
      return this;
    }
  }], [{
    key: "assertValid",
    value: function assertValid(e) {
      assert(isFunction(e.clean));
      assert(isFunction(e.report));
      assert(isFunction(e.control));
      assert(isFunction(e.enabled));
      assert(isFunction(e.beforeRun));
      assert(isMaybeFunction(e.candidate));
    }
  }]);

  return Experiment;
})(EventEmitter);

module.exports = Experiment;