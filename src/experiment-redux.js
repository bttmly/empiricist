const assert = require("assert");

const assign = require("object-assign");

const {isFunction, isObject} = require("util");

function isMaybeFunction (maybeFn) {
  return maybeFn == null || isFunction(maybeFn);
}

function noop () {}
function id (x) { return x; }
function yes () { return true; }

class Experiment {

  static assertValid (e) {
    assert(isFunction(e.clean));
    assert(isFunction(e.report));
    assert(isFunction(e.control));
    assert(isFunction(e.enabled));
    assert(isFunction(e.beforeRun));
    assert(isMaybeFunction(e.candidate));
  }

  constructor (name) {
    this.name = name;
    this._metadata = {};
    this._context = null;
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

  enabled () {
    return this.hasOwnProperty("candidate");
  }

  report () {}

  clean (observation) {
    return observation;
  }

  beforeRun (args) {
    return args;
  }

  setMetadata (metadata) {
    assert(isObject(metadata), "`setMetadata` requires an object argument");
    this._metadata = metadata;
    return this;
  }

  setContext (context) {
    this._context = context;
    return this;
  }

}

module.exports = Experiment
