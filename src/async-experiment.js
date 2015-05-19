let assert = require("assert");
let domain = require("domain");

let async = require("async");
let assign = require("object-assign");

let Experiment = require("./experiment");

let {
  makeId,
  shouldRun,
  isFunction,
  isString
} = require("./util");

function asyncExperimentFactory (name, executor) {

  assert(isString(name), `'name' argument must be a string, found ${name}`);
  assert(isFunction(executor), `'executor' argument must be a function, found ${executor}`);

  var exp = new Experiment();
  executor.call(exp, exp);

  assert(isFunction(exp.control), "Experiment's control function must be set with `e.use()`");

  var result = function (...args) {

    let finish = args.pop(),
        ctx    = exp._context || this,
        trial  = {name, id: makeId()};

    assert(isFunction(finish), "Last argument must be a callback function");

    if (!shouldRun(exp, args)) {
      exp.control.apply(ctx, args.concat(finish));
      return;
    }

    let options = {trial, ctx, metadata: exp._metadata};

    let controlOptions = assign({
      fn: exp.control,
      which: "control",
      args: args
    }, options);

    let candidateArgs = exp._beforeRun(args);

    assert(Array.isArray(candidateArgs), "beforeRun function must return an array.");

    let candidateOptions = assign({
      fn: exp.candidate,
      which: "candidate",
      args: candidateArgs
    }, options);

    async.map([controlOptions, candidateOptions], makeAsyncObservation, function (_, results) {
      let args = results[0];
      exp._report(exp._clean(trial));
      finish(...args);
    });
  }

  assign(result, exp.control);

  return result;
}

function makeAsyncObservation (options, cb) {
  let {fn, trial, ctx, args, metadata, which} = options;

  let start = Date.now(),
      observation = {args, metadata},
      d;

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
