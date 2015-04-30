var assert = require("assert");

var {assertFn} = require("./util");

var noop = () => {}
var id = (x) => x
var alwaysTrue = () => true
var returnArgs = (...args) => args

var experimentProto = {

  use: function (fn) {
    assertFn(fn);
    this.control = fn;
    return this;
  },

  try: function (fn) {
    assertFn(fn);
    this.candidate = fn;
    return this;
  },

  enabled: function (fn) {
    assertFn(fn);
    this._enabled = fn;
    return this;
  },

  report: function (fn) {
    assertFn(fn);
    this._report = fn;
    return this;
  },

  clean: function (fn) {
    assertFn(fn);
    this._clean = fn;
    return this;
  },

  beforeRun: function (fn) {
    assertFn(fn);
    this._beforeRun = fn;
    return this;
  },

  metadata: function (obj) {
    Object.assign(this._metadata, obj);
    return this;
  },

  context: function (ctx) {
    this._context = ctx;
    return this;
  }

};

function makeExperiment () {
  return Object.assign({
    _context: null,
    _metadata: {},
    _clean: id,
    _beforeRun: returnArgs,
    _report: noop,
    _enabled: alwaysTrue
  }, experimentProto);
}

module.exports = makeExperiment;
