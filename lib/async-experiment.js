"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var assert = require("assert");
var domain = require("domain");

var async = require("async");
var assign = require("object-assign");

var _require = require("./shared");

var createOptions = _require.createOptions;
var createExperimentFactory = _require.createExperimentFactory;

var _require2 = require("./pkg-util");

var makeId = _require2.makeId;
var isFunction = _require2.isFunction;

function wrapAsyncExperiment(exp) {

  function experimentFunc() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var finish = args.pop();
    var ctx = exp.context || this;
    var trial = { name: exp.name, id: makeId() };

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!exp.enabled.apply(exp, args)) {
      exp.control.apply(ctx, args.concat(finish));
      return;
    }

    var _createOptions = createOptions(exp, args, ctx);

    var controlOptions = _createOptions.controlOptions;
    var candidateOptions = _createOptions.candidateOptions;

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, observations) {
      trial.control = observations[0];
      trial.candidate = observations[1];
      exp.report(exp.clean(trial));
      if (!exp.match(trial)) exp.emit("mismatch", trial);
      finish.apply(undefined, _toConsumableArray(trial.control.cbArgs));
    });
  }

  assign(experimentFunc, exp.control);
  return experimentFunc;
}

function makeAsyncObservation(options, cb) {
  var fn = options.fn;
  var ctx = options.ctx;
  var args = options.args;
  var metadata = options.metadata;
  var which = options.which;

  var start = Date.now();
  var observation = { args: args, metadata: metadata };
  var d = undefined;

  function next() {
    for (var _len2 = arguments.length, cbArgs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      cbArgs[_key2] = arguments[_key2];
    }

    if (d) d.exit();
    observation.duration = Date.now() - start;

    if (cbArgs[0] != null) {
      observation.error = cbArgs[0];
    }

    if (cbArgs.length > 2) {
      observation.result = cbArgs.slice(1);
    } else if (cbArgs[1] != null) {
      observation.result = cbArgs[1];
    }

    observation.cbArgs = cbArgs;
    cb(null, observation);
  }

  if (which === "candidate") {
    d = domain.create();
    d.enter();
    d.on("error", function (e) {
      observation.error = e;
      next();
    });
  }

  fn.apply(ctx, args.concat(next));
}

module.exports = createExperimentFactory(wrapAsyncExperiment);