require("babel/register");

var expect = require("chai").expect;
var sinon = require("sinon");

var experiment = require("../src/experiment");

describe("experiment 'factory'", () => {

  it("takes a `name` string as it's first argument", () => {
    expect(() => experiment()).to.throw(/argument must be a string/i);
  });

  it("takes an `init` function as it's optional second argument", () => {
    expect(() => experiment("")).to.not.throw();
    expect(() => experiment("", "")).to.throw(/argument must be a function/i);
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

  describe("#use", function () {
    it("sets the experiment's control behavior", () => {
      function sayHi () { return "Hello!"; }

      var exp = experiment("test", function (e) {
        e.use(sayHi);
      });

      expect(exp.control).to.equal(sayHi);
      expect(exp()).to.equal(sayHi());
    });

    it("an experiment will throw an error when called if not set", () => {
      var exp = experiment("test", function (e) {});

      expect(() => exp()).to.throw(/can't run experiment without control/i);
    });
  });

  describe("#try", function () {

    var sayHi, sayBye, exp;

    beforeEach(() => {      
      sayHi  = sinon.spy(function () { return "Hi!"  });
      sayBye = sinon.spy(function () { return "Bye!" });
      exp = experiment("test", function (e) {
        e.use(sayHi);
        e.try(sayBye);
      });
    });

    it("sets the experiment's control behavior", () => {
      expect(exp.candidate).to.equal(sayBye);
      expect(exp()).to.equal("Hi!");
    });

    it("it is invoked when the experiment is called", () => {
      exp();
      expect(sayHi.callCount).to.equal(1);
      expect(sayBye.callCount).to.equal(1);
    });
  });

  describe("#context", function () {

  });

  describe("#report", function () {

  });

  describe("#clean", function () {

  });

  describe("#enabled", function () {

  });

});