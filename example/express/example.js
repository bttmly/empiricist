var fs = require("fs");

var router = require("express").Router();
var asyncExperiment = require("../../src/async-experiment.js");

var exp = asyncExperiment("express-example", function (e) {
  e.use(function (req, cb) {
    fs.readFile(__dirname + "/big.json", cb);
  });
  e.try(function (req, cb) {
    fs.readFile(__dirname + "./small.json", cb);
  });
  e.report(console.log.bind(console));
});

router.get("/", function (req, res) {
  exp(function (err, data) {
    if (err) return res.statusOut(500);
    res.status(200).json({data});
  });
});
