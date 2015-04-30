require("babel/register");

var _ = require("lodash");
var expect = require("chai").expect;
var sinon = require("sinon");

var asyncExperiment = require("../src/async-experiment");

// function stripRandomFields (obj) {
//   var ret = _.omit(obj, "id")
//   ret.control = _.omit(ret.control, "duration");
//   ret.candidate = _.omit(ret.candidate, "duration");
//   return ret;
// }

describe("asyncExperiment 'factory'", () => {



  it("it handles thrown errors in callbacks", (done) => {

  });

});
