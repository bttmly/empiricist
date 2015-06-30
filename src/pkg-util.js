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
  args.forEach((m) => {
    assert(isFunction(obj[m]));
  });
}

function isGenerator (f) {
  return isFunction(f) && /^function\s*\*/.test(f.toString());
}

module.exports = {
  makeId,
  assertHasMethods,
  isThennable,
  isGenerator,
  isFunction,
  isString,
  isObject
};
