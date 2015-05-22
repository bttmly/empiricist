const assert = require("assert");
const domain = require("domain");

const async = require("async");
const assign = require("object-assign");

const {createOptions, createExperiment} = require("./shared");

const {
  makeId,
  shouldRun,
  isFunction,
  isString
} = require("./util");

function wrapAsyncExperiment (_exp) {

  function experiment (...args) {

    const finish = args.pop();
    const ctx    = _exp._context || this;
    const trial  = {name: _exp.name, id: makeId()};

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!shouldRun(_exp, args)) {
      _exp.control.apply(ctx, args.concat(finish));
      return;
    }

    const {controlOptions, candidateOptions} = createOptions(_exp, args, ctx);

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, observations) {
      trial.control = observations[0];
      trial.candidate = observations[1];
      _exp._report(_exp._clean(trial));
      finish(...trial.control.cbArgs);
    });
  }

  assign(experiment, _exp.control);

  return experiment;
}

function makeAsyncObservation (options, cb) {
  const {fn, ctx, args, metadata, which} = options;
  const start = Date.now();
  const observation = {args, metadata};
  let d;

  function next (...cbArgs) {
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
