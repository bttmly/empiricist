const assert = require("assert");
const domain = require("domain");
const {isFunction} = require("util");

const async = require("async");
const assign = require("object-assign");

const {createOptions, createExperimentFactory} = require("./shared");
const {makeId} = require("./pkg-util");

function wrapAsyncExperiment (exp) {

  function experimentFunc (...args) {

    const finish = args.pop();
    const ctx = exp.context || this;
    const trial = {name: exp.name, id: makeId()};

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!exp.enabled(...args)) {
      exp.control.apply(ctx, args.concat(finish));
      return;
    }

    const {controlOptions, candidateOptions} = createOptions(exp, args, ctx);

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, observations) {
      trial.control = observations[0];
      trial.candidate = observations[1];
      exp.report(exp.clean(trial));
      if (!exp.match(trial)) exp.emit("mismatch", trial);
      finish(...trial.control.cbArgs);
    });
  }

  assign(experimentFunc, exp.control);
  return experimentFunc;
}

function makeAsyncObservation (options, cb) {
  const {fn, ctx, args, metadata, which} = options;
  const start = Date.now();
  const observation = {args, metadata};
  let d;

  function next (...cbArgs) {
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
