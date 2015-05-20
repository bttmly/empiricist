const assert = require("assert");
const domain = require("domain");

const async = require("async");
const assign = require("object-assign");

const Experiment = require("./experiment");

const {
  makeId,
  shouldRun,
  isFunction,
  isString
} = require("./util");

function asyncExperimentFactory (name, executor) {

  assert(isString(name), `'name' argument must be a string, found ${name}`);
  assert(isFunction(executor), `'executor' argument must be a function, found ${executor}`);

  const _exp = new Experiment();
  executor.call(_exp, _exp);

  assert(isFunction(_exp.control), "Experiment's control function must be set with `e.use()`");

  function experiment (...args) {

    const finish = args.pop();
    const ctx    = _exp._context || this;
    const trial  = {name, id: makeId()};

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!shouldRun(_exp, args)) {
      return _exp.control.apply(ctx, args.concat(finish));
    }

    const options = {trial, ctx, metadata: _exp._metadata};

    const controlOptions = assign({
      fn: _exp.control,
      which: "control",
      args: args
    }, options);

    const candidateArgs = _exp._beforeRun(args);

    assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

    const candidateOptions = assign({
      fn: _exp.candidate,
      which: "candidate",
      args: candidateArgs
    }, options);

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, results) {
      const args = results[0];
      _exp._report(_exp._clean(trial));
      finish(...args);
    });
  }

  assign(experiment, _exp.control);

  return experiment;
}

function makeAsyncObservation (options, cb) {
  const {fn, trial, ctx, args, metadata, which} = options;
  const start = Date.now();
  const observation = {args, metadata};
  let d;

  function next (...cbArgs) {
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
