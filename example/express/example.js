var fs = require("fs");

var router = require("express").Router();

var exp = experiment("express-example")
  .use(function (req, cb) {
    fs.readFile(__dirname + "/big.json", cb);
  })
  .try(function (req, cb) {
    fs.readFile(__dirname + "./small.json", cb);
  })
  .report(console.log);

});

router.get("/", function (req, res) {
  exp(function (err, data) {
    if (err) return res.statusOut(500);
    res.status(200).json({data});
  });
});
