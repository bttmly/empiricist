const assert = require("assert");
const domain = require("domain");

const async = require("async");
const assign = require("object-assign");

const {createOptions, createExperimentFactory} = require("./shared");
const {isFunction} = require("./pkg-util");
const Trial = require("./trial");

function wrapAsyncExperiment (exp) {

  function experimentFunc (...args) {

    const finish = args.pop();
    const ctx = exp.context || this;

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!exp.enabled(...args)) {
      exp.control.apply(ctx, args.concat(finish));
      return;
    }

    const {controlOptions, candidateOptions} = createOptions(exp, args, ctx);

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, observations) {
      const trial = new Trial(exp, observations);
      exp.emitTrial(trial);
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

    const [result, error] = cbArgs;
    if (error != null) observation.error = error;
    if (result != null) observation.result = result;

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
