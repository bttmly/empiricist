let _ = require("lodash");
let sinon = require("sinon");

module.exports = {
  omitNonDeterministic (obj) {
    let ret = _.omit(obj, "id");
    ret.control = _.omit(ret.control, "duration");
    ret.candidate = _.omit(ret.candidate, "duration");
    return ret;
  },

  spyEvent (emitter, event) {
    let listener = sinon.stub();
    emitter.on(event, listener);
    return listener;
  },
};
