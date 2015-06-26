const {makeId} = require("./pkg-util");

function validateObservations () {}

module.exports = class Trial {
  constructor (exp, obs) {
    validateObservations(obs);
    this.name = exp.name;
    this.id = makeId();
    [this.control, this.candidate] = obs;
  }
};
