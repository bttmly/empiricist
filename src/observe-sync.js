const wrapObserver = require("./wrap-observer");

function observeSync (exp, {control, candidate}) {
  const [controlObs, candidateObs] = [control, candidate].map(makeSyncObservation);
  exp.emitTrial(controlObs, candidateObs);
  if (controlObs.error) {
    throw controlObs.error;
  }
  return controlObs.result;
}

function makeSyncObservation (params) {
  const {fn, ctx, args} = params;
  const observation = {args};
  const start = Date.now();

  try {
    observation.result = fn.apply(ctx, args);
  } catch (e) {
    observation.error = e;
  }
  observation.duration = Date.now() - start;
  return observation;
}


module.exports = observeSync;
