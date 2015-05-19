var server = require("./app");

var request = require("request");

request("http://localhost:3000", function (err, resp) {
  if (err) throw err;
  console.log("done");
  server.close();
});
