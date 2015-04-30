var _ = require("lodash");

module.exports = {
  omitNonDeterministic (obj) {
    var ret = _.omit(obj, "id")
    ret.control = _.omit(ret.control, "duration");
    ret.candidate = _.omit(ret.candidate, "duration");
    return ret;
  }
}
