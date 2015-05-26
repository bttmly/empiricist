"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var assert = require("assert");
var domain = require("domain");

var _require = require("util");

var isFunction = _require.isFunction;
var isString = _require.isString;

var async = require("async");
var assign = require("object-assign");

var _require2 = require("./shared");

var createOptions = _require2.createOptions;
var createExperiment = _require2.createExperiment;

var _require3 = require("./pkg-util");

var makeId = _require3.makeId;
var shouldRun = _require3.shouldRun;

function wrapAsyncExperiment(_exp) {

  function experiment() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var finish = args.pop();
    var ctx = _exp._context || this;
    var trial = { name: _exp.name, id: makeId() };

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!shouldRun(_exp, args)) {
      _exp.control.apply(ctx, args.concat(finish));
      return;
    }

    var _createOptions = createOptions(_exp, args, ctx);

    var controlOptions = _createOptions.controlOptions;
    var candidateOptions = _createOptions.candidateOptions;

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, observations) {
      trial.control = observations[0];
      trial.candidate = observations[1];
      _exp._report(_exp._clean(trial));
      finish.apply(undefined, _toConsumableArray(trial.control.cbArgs));
    });
  }

  assign(experiment, _exp.control);
  return experiment;
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
    observation.cbArgs = cbArgs;
    observation.duration = Date.now() - start;
    cb(null, observation);
  }

  if (which === "candidate") {
    d = domain.create();
    d.enter();
    d.on("error", function (e) {
      observation.threw = e;
      next();
    });

    fn.apply(ctx, args.concat(next));
    return;
  }

  fn.apply(ctx, args.concat(next));
}

module.exports = createExperiment(wrapAsyncExperiment);