var fs = require("fs");

var router = require("express").Router();

var exp = experiment("express-example", function (e) {

  e.use(function (req, cb) {
    fs.readFile("./big.json", cb);
  });

  e.try(function (req, cb) {
    fs.readFile("./small.json", cb);
  });

  e.report(console.log);

});

router.get("/", function (req, res) {

  exp(function (err, data) {

    if (err) {
      return res.statusOut(500);
    }

    res.status(200).json({data});

  });
});