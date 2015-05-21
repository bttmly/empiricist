
function promiseExperimentFactory (name, executor) {
  assert(isString(name), `'name' argument must be a string, found ${name}`);
  assert(isFunction(executor), `'executor' argument must be a function, found ${executor}`);

}

function makePromiseObservation (options) {

  const {fn, trial, ctx, args, metadata, which} = options;
  const observation = {args, metadata};
  const start = Date.now();

  function onSuccess (d) {
    observation.returned = d;
    observation.duration = Date.now() - start;
    return Promise.resolve(d);
  }

  function onError (e) {
    observation.error = e;
    observation.duration = Date.now() - start;
    if (which === "candidate") {
      return Promise.resolve(null);
    }
    return Promise.reject(e);
  }

  observation.promise = fn.apply(ctx, args).then(onSuccess, onError);
}
