require("babel/register");

var expect = require("chai").expect;

var experiment = require("../src/experiment");

describe("experiment 'factory'", function () {

  it("takes a `name` string as it's first argument", function () {
    expect(() => experiment()).to.throw(/argument must be a string/i);
  });

  it("takes an `init` function as it's second argument", function () {
    expect(() => experiment("")).to.throw(/argument must be a function/i)
  });

});