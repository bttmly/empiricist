var assert = require("assert");

var asyncExperiment = require("../../js/async-experiment.js");

function multiply (a, b) { return a * b; }

var exp = asyncExperiment("basic-example", function (e) {

  e.use(function (a, b, c, d, cb) {
    setTimeout(function () {
      var result = [a, b, c, d].reduce(multiply);
      cb(null, result);
    }, 2000);
  });

  e.try(function (a, b, c, d, cb) {
    setTimeout(function () {
      var result = [a, b, c, d].reduce(multiply);
      cb(null, result);
    }, 1000);
  });

  e.report(function (trial) {
    console.log(trial);
  });

});

exp(1, 2, 3, 4, function (err, result) {
  assert.equal(err, null);
  assert.equal(result, 24);
  console.log("Done!");
});
