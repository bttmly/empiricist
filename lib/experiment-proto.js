"use strict";

var assert = require("assert");

var _require = require("./util");

var assertFn = _require.assertFn;

function noop() {}

function id(x) {
  return x;
}

function alwaysTrue() {
  return true;
}

var experimentProto = {

  use: function use(fn) {
    assertFn(fn);
    this.control = fn;
    return this;
  },

  "try": function _try(fn) {
    assertFn(fn);
    this.candidate = fn;
    return this;
  },

  enabled: function enabled(fn) {
    assertFn(fn);
    this._enabled = fn;
    return this;
  },

  report: function report(fn) {
    assertFn(fn);
    this._report = fn;
    return this;
  },

  clean: function clean(fn) {
    assertFn(fn);
    this._clean = fn;
    return this;
  },

  beforeRun: function beforeRun(fn) {
    assertFn(fn);
    this._beforeRun.push(fn);
    return this;
  },

  metadata: function metadata(obj) {
    Object.assign(this._metadata, obj);
    return this;
  },

  context: function context(ctx) {
    this._context = ctx;
    return this;
  }

};

function makeExperiment() {
  return Object.assign({
    _context: null,
    _metadata: {},
    _clean: id,
    _beforeRun: id,
    _report: noop,
    _enabled: alwaysTrue
  }, experimentProto);
}

module.exports = makeExperiment;