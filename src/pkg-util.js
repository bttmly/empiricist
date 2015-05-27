const {isFunction} = require("util");

function makeId () {
  return Date.now() + "-" + Math.random().toString(16).slice(2);
}

function isThennable (p) {
  return (
    p &&
    isFunction(p.then) &&
    isFunction(p.catch)
  );
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
  makeId
};
