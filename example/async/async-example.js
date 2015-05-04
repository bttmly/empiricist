require("babel/register");

let assert = require("assert");

let asyncExperiment = require("../../src/async-experiment.js");

function multiply (a, b) { return a * b; }

let exp = asyncExperiment("basic-example")
  .use(function (a, b, c, d, cb) {
    setTimeout(function () {
      let result = [a, b, c, d].reduce(multiply);
      cb(null, result);
    }, 2000);
  })
  .try(function (a, b, c, d, cb) {
    setTimeout(function () {
      let result = [a, b, c, d].reduce(multiply);
      cb(null, result);
    }, 1000);
  })
  .report(console.log);

console.log("Running async example...");

exp(1, 2, 3, 4, function (err, result) {
  assert.equal(err, null);
  assert.equal(result, 24);
});
