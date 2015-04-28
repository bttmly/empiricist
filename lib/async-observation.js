// Generated by CoffeeScript 1.9.2
var AsyncObservation, Observation,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Observation = require("./").Observation;

AsyncObservation = (function() {
  function AsyncObservation() {
    this.call = bind(this.call, this);
    AsyncObservation.__super__.constructor.apply(this, arguments);
  }

  AsyncObservation.prototype.call = function(next) {};

  return AsyncObservation;

})();

module.exports = AsyncObservation;