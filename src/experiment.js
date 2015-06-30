const assert = require("assert");
const {EventEmitter} = require("events");
const assign = require("object-assign");

const {isFunction, isObject} = require("./pkg-util");

function isMaybeFunction (maybeFn) {
  return maybeFn == null || isFunction(maybeFn);
}

module.exports = class Experiment extends EventEmitter {

  static assertValid (e) {
    assert(isFunction(e.control));
    assert(isFunction(e.enabled));
    assert(isFunction(e.beforeRun));
    assert(isMaybeFunction(e.candidate));
  }

  constructor (name) {
    super();
    this.name = name;
    this.metadata = {};
    this.context = null;
    this.contextWasSet = false;
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

  setMetadata (metadata) {
    assert(isObject(metadata), "`setMetadata` requires an object argument");
    this.metadata = assign(this.metadata, metadata);
    return this;
  }

  setContext (context) {
    this.context = context;
    this.contextWasSet = true;
    return this;
  }

  emitTrial (trial) {
    this.emit((this.match(trial) ? "match" : "mismatch"), trial);
    this.emit("trial", trial);
    return this;
  }

  enabled () {
    return isFunction(this.candidate);
  }

  match ({control, candidate}) {
    return control.returned === candidate.returned;
  }

  beforeRun (args) {
    return args;
  }

};
