require("babel/register");

var expect = require("chai").expect;
var sinon = require("sinon");

var experiment = require("../src/experiment");

describe("experiment 'factory'", () => {

  it("takes a `name` string as it's first argument", () => {
    expect(() => experiment()).to.throw(/argument must be a string/i);
  });

  it("takes an `init` function as it's second argument", () => {
    expect(() => experiment("")).to.throw(/argument must be a function/i)
  });

  it("returns a function", () => {
    expect(typeof experiment("", () => 0)).to.equal("function");
  });

  describe("init function invocation", () => {

    it("init's `this` context, init's argument, and experiment return are all same object", () => {
      var spy = sinon.spy(function (e) {
        expect(this).to.equal(e);
      });

      var ctx = {};
      var arg = {};
      var exp = experiment("test", function (e) {
        ctx = this;
        arg = e;
      });

      expect(arg).to.equal(ctx);
      expect(arg).to.equal(exp);
    });

  });

});