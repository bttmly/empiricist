"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var assert = require("assert");
var domain = require("domain");

var async = require("async");
var assign = require("object-assign");

var Experiment = require("./experiment");

var _require = require("./util");

var makeId = _require.makeId;
var shouldRun = _require.shouldRun;
var isFunction = _require.isFunction;
var isString = _require.isString;

function asyncExperimentFactory(name, executor) {

  assert(isString(name), "'name' argument must be a string, found " + name);
  assert(isFunction(executor), "'executor' argument must be a function, found " + executor);

  var exp = new Experiment();
  executor.call(exp, exp);

  assert(isFunction(exp.control), "Experiment's control function must be set with `e.use()`");

  var result = function result() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var finish = args.pop(),
        ctx = exp._context || this,
        trial = { name: name, id: makeId() };

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!shouldRun(exp, args)) {
      exp.control.apply(ctx, args.concat(finish));
      return;
    }

    var options = { trial: trial, ctx: ctx, metadata: exp._metadata };

    var controlOptions = assign({
      fn: exp.control,
      which: "control",
      args: args
    }, options);

    var candidateArgs = exp._beforeRun(args);

    assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

    var candidateOptions = assign({
      fn: exp.candidate,
      which: "candidate",
      args: candidateArgs
    }, options);

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, results) {
      var args = results[0];
      exp._report(exp._clean(trial));
      finish.apply(undefined, _toConsumableArray(args));
    });
  };

  assign(result, exp.control);

  return result;
}

function makeAsyncObservation(options, cb) {
  var fn = options.fn;
  var trial = options.trial;
  var ctx = options.ctx;
  var args = options.args;
  var metadata = options.metadata;
  var which = options.which;

  var start = Date.now(),
      observation = { args: args, metadata: metadata },
      d = undefined;

  function next() {
    for (var _len2 = arguments.length, cbArgs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      cbArgs[_key2] = arguments[_key2];
    }

    if (d) d.exit();
    observation.cbArgs = cbArgs;
    observation.duration = Date.now() - start;
    trial[which] = observation;
    cb(null, cbArgs);
  }

  if (which === "candidate") {
    d = domain.create();
    d.enter();
    d.on("error", function (e) {
      observation.threw = e;
      next();
    });

    return fn.apply(ctx, args.concat(next));
  }

  fn.apply(ctx, args.concat(next));
}

module.exports = asyncExperimentFactory;