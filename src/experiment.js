const assert = require("assert");
const {EventEmitter} = require("events");

const assign = require("object-assign");

const {isFunction, isObject, makeId} = require("./pkg-util");

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
    assign(this.metadata, metadata);
    return this;
  }

  emitTrial (control, candidate) {
    const o = {name: this.name, id: makeId(), control, candidate};
    this.emit((this.match(control, candidate) ? "match" : "mismatch"), o);
    this.emit("trial", o);
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

};
