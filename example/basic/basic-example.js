require("babel/register");

var assert = require("assert");

var experiment = require("../../src/sync-experiment.js");

function multiply (a, b) { return a * b; }

var exp = experiment("basic-example", function (e) {
  e.use(function (a, b, c, d) {
    return [a, b, c, d].reduce(multiply);
  });

  e.try(function (a, b, c, d) {
    return [a, b, c, d].reduce(multiply);
  });

  e.report(console.log);
});

console.log("Running basic example...");

exp(1, 2, 3, 4);
