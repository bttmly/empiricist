var assert = require("assert");

function arg (type, fn) {
  return function (_arg) {
    assert.equal(typeof _arg, type, "Argument must be a " + type);
    return fn.call(this, arg);
  }
}

function callableOnce (fn) {
  var called = false;
  return function () {
    if (called) {
      throw new Error("Function may only be called once");
    }
    return fn.apply(this, arguments);
  }
}

function noop () {}

function id (x) { return x; }

function alwaysTrue () { return true; }

var experimentProto = {

  use: function (fn) {
    this.control = fn;
    return this;
  },

  try: function (fn) {
    this.candidate = fn;
    return this;
  },

  metadata: function (obj) {
    assign(this._metadata, obj);
    return this;
  },

  enabled: function (fn) {
    this._enabled = fn;
    return this;
  },

  report: function (fn) {
    this._report = fn;
    return this;
  },

  clean: function (fn) {
    this._cleaner = fn;
    return this;
  },

  beforeRun: function (fn) {
    this._beforeRun.push(fn);
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
    _beforeRun: [],
    _metadata: {},
    _clean: id,
    _report: console.log,
    _enabled: alwaysTrue
  }, experimentProto);
}

module.exports = makeExperiment;
