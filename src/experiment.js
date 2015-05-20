const assert = require("assert");

const assign = require("object-assign");

const {isFunction} = require("./util");

function noop () {}
function id (x) { return x; }
function yes () { return true; }

class Experiment {

  constructor () {
    assign(this, {
      _context: null,
      _metadata: {},
      _clean: id,
      _beforeRun: id,
      _report: noop,
      _enabled: yes
    });
  }

  use (fn) {
    assert(isFunction(fn), "`use` requires a function argument.");
    this.control = fn;
    return this;
  }

  try (fn) {
    assert(isFunction(fn), "`try` requires a function argument.");
    this.candidate = fn;
    return this;
  }

  enabled (fn) {
    assert(isFunction(fn), "`enabled` requires a function argument.");
    this._enabled = fn;
    return this;
  }

  report (fn) {
    assert(isFunction(fn), "`report` requires a function argument.");
    this._report = fn;
    return this;
  }

  clean (fn) {
    assert(isFunction(fn), "`clean` requires a function argument.");
    this._clean = fn;
    return this;
  }

  beforeRun (fn) {
    assert(isFunction(fn), "`beforeRun` requires a function argument.");
    this._beforeRun = fn;
    return this;
  }

  metadata (obj) {
    assign(this._metadata, obj);
    return this;
  }

  context (ctx) {
    this._context = ctx;
    return this;
  }

};

module.exports = Experiment
