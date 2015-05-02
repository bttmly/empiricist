"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var assert = require("assert");
var domain = require("domain");

var async = require("async");

var _require = require("./util");

var makeId = _require.makeId;
var shouldRun = _require.shouldRun;
var isFunction = _require.isFunction;
var isString = _require.isString;

var experimentProto = require("./experiment-proto");

function asyncExperimentFactory(name, init) {

  assert(isString(name), "first argument must be a string");

  Object.assign(experiment, experimentProto());

  if (init != null) {
    assert(isFunction(init), "second argument must be a function");
    init.call(experiment, experiment);
  }

  function experiment() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    assert(isFunction(experiment.control), "Can't run experiment without control");

    var finish = args.pop(),
        ctx = experiment._context || this,
        trial = { name: name, id: makeId() };

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!shouldRun(experiment, args)) {
      experiment.control.apply(ctx, args.concat(finish));
      return;
    }

    var options = { trial: trial, ctx: ctx, metadata: experiment._metadata };

    var controlOptions = Object.assign({
      fn: experiment.control,
      which: "control",
      args: args
    }, options);

    var candidateArgs = experiment._beforeRun(args);

    assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

    var candidateOptions = Object.assign({
      fn: experiment.candidate,
      which: "candidate",
      args: candidateArgs
    }, options);

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, results) {
      var args = results[0];
      experiment._report(experiment._clean(trial));
      finish.apply(undefined, _toConsumableArray(args));
    });
  }

  return experiment;
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
      observation.error = e;
      next();
    });

    return fn.apply(ctx, args.concat(next));
  }

  fn.apply(ctx, args.concat(next));
}

module.exports = asyncExperimentFactory;