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
    const ctx = exp.contextWasSet ? exp.context : this;

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
    const [error, result] = observation.cbArgs = cbArgs;

    if (error) observation.error = error;
    if (result) observation.result = result;

    cb(null, observation);
  }

  function go () {
    fn.apply(ctx, args.concat(next));
  }

  if (which === "candidate") {
    d = domain.create();
    d.on("error", function (e) {
      observation.error = e;
      next();
    });
    return d.run(go);
  }

  go();
}

module.exports = createExperimentFactory(wrapAsyncExperiment);
