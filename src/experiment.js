const assert = require("assert");
const {EventEmitter} = require("events");

const {isFunction, isObject, makeId} = require("./pkg-util");

function isMaybeFunction (maybeFn) {
  return maybeFn == null || isFunction(maybeFn);
}

class Experiment extends EventEmitter {

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
    this.metadata = {...this.metadata, ...metadata};
    return this;
  }

  emitTrial (control, candidate) {
    const data = {
      name: this.name, 
      id: makeId(), 
      metadata: this.metadata,
      control, 
      candidate,
    };

    this.emit((this.match(control, candidate) ? "match" : "mismatch"), data);
    this.emit("trial", data);
    return this;
  }

  enabled () {
    return isFunction(this.candidate);
  }

  match (control, candidate) {
    return control.returned === candidate.returned;
  }

  beforeRun (args) {
    return args;
  }

}

module.exports = Experiment;
