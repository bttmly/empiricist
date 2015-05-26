"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var assert = require("assert");

var assign = require("object-assign");

var _require = require("util");

var isFunction = _require.isFunction;
var isObject = _require.isObject;

function noop() {}
function id(x) {
  return x;
}
function yes() {
  return true;
}

var Experiment = (function () {
  function Experiment(name) {
    _classCallCheck(this, Experiment);

    assign(this, {
      name: name,
      _context: null,
      _metadata: {},
      _clean: id,
      _beforeRun: id,
      _report: noop,
      _enabled: yes
    });
  }

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
    value: function enabled(fn) {
      assert(isFunction(fn), "`enabled` requires a function argument.");
      this._enabled = fn;
      return this;
    }
  }, {
    key: "report",
    value: function report(fn) {
      assert(isFunction(fn), "`report` requires a function argument.");
      this._report = fn;
      return this;
    }
  }, {
    key: "clean",
    value: function clean(fn) {
      assert(isFunction(fn), "`clean` requires a function argument.");
      this._clean = fn;
      return this;
    }
  }, {
    key: "beforeRun",
    value: function beforeRun(fn) {
      assert(isFunction(fn), "`beforeRun` requires a function argument.");
      this._beforeRun = fn;
      return this;
    }
  }, {
    key: "metadata",
    value: function metadata(obj) {
      assert(isObject(obj), "`metadata` requires an object argument.");
      assign(this._metadata, obj);
      return this;
    }
  }, {
    key: "context",
    value: function context(ctx) {
      this._context = ctx;
      return this;
    }
  }]);

  return Experiment;
})();

;

module.exports = Experiment;