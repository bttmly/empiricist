const {makeId} = require("./pkg-util");

function validateObservations () {}

module.exports = class Trial {

  static ofExperiment (exp) {
    return (obs) => new this(exp, obs);
  }

  constructor (exp, obs) {
    validateObservations(obs);
    this.name = exp.name;
    this.id = makeId();
    [this.control, this.candidate] = obs;
  }

};
