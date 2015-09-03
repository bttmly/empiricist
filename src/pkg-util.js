const assert = require("assert");

function isFunction (f) {
  return typeof f === "function";
}

function isString (s) {
  return typeof s === "string";
}

function isObject (o) {
  return Object(o) === o;
}

function makeId () {
  return Date.now() + "-" + Math.random().toString(16).slice(2);
}

function isThennable (p) {
  return (p && isFunction(p.then) && isFunction(p.catch));
}

function assertHasMethods (obj, args) {
  args.forEach((m) => assert(isFunction(obj[m])));
}

function isGenerator (f) {
  return isFunction(f) && /^function\s*\*/.test(f.toString());
}

function isSafeProperty (prop) {
  return (
    prop !== "name" &&
    prop !== "arguments" &&
    prop !== "caller" 
  );
}

function safeFuncProps (obj) {
  return isFunction(obj) ? isSafeProperty : () => true;
}

function ownMethods (obj) {
  return Object.getOwnPropertyNames(obj)
    .filter(safeFuncProps(obj))
    .filter(m => isFunction(obj[m]));
}

function defer (fn) {
  return function (...args) {
    setImmediate(() => fn(...args));
  };
}

module.exports = {
  makeId,
  ownMethods,
  assertHasMethods,
  isThennable,
  isGenerator,
  isFunction,
  isString,
  isObject,
  defer,
};
