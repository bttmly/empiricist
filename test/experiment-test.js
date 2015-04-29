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

    it("an experiment whose control behavior throws an error will throw that error", () => {
      var exp = experiment("test", function (e) {
        e.use(function () { throw new Error("Kaboom!") });
      })

      expect(() => exp()).to.throw(/kaboom/i);
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

    it("an experiment whose candidate behavior throws an error will not throw", () => {
      var exp = experiment("test", function (e) {
        e.use(function () { return "didn't throw" })
        e.try(function () { throw new Error("Kaboom!") });
      });

      expect(exp()).to.equal("didn't throw");
    });
  });

  describe("#context", function () {

    it("sets the experiment's `this` context", () => {
      var ctx;
      var obj = {};
      var exp = experiment("test", function (e) {
        e.use(function () {
          ctx = this;
        });
        e.context(obj);
      });

      exp();
      expect(ctx).to.equal(obj);
    });

    it("overrides calling context if set", function () {
      var ctx;
      var obj1 = {};
      var obj2 = {};

      var exp = experiment("test", function (e) {
        e.use(function () {
          ctx = this;
        });
        e.context(obj1);
      });

      exp.call(obj2)
      expect(ctx).to.equal(obj1);

    });

    it("defers to the calling context if unset", () => {
      var ctx;
      var obj = {};

      var exp = experiment("test", function (e) {
        e.use(function () {
          ctx = this;
        });
      });

      exp.call(obj)
      expect(ctx).to.equal(obj);

    });

  });

  describe("#report", function () {
    var trials = [];

    var spy = sinon.spy(function (arg) {
      trials.push(arg);
    });

    it("sets the experiment's trial reporter", function () {

      var exp = experiment("test", function (e) {
        e.use(function (a, b) { return a + b });
        e.try(function (a, b) { return a * b });
        e.report(spy);
      });

      exp(2, 3);

      expect(spy.calledOnce).to.equal(true);
      expect(trials.length).to.equal(1);

      expect(trials[0]).to.deep.equal({
        name: "test",
        control: { 
          args: [ 2, 3 ],
          metadata: {},
          returned: 5,
          duration: 0
        },
        candidate: {
          args: [ 2, 3 ],
          metadata: {},
          returned: 6,
          duration: 0
        }
      });
    });
  });

  describe("#clean", function () {
    it("is applied to a trial object before it gets to the reporter", function () {
      var trials = [];
      var reporter = sinon.spy(function (arg) {
        trials.push(arg);
      });

      var cleaner = sinon.spy(function (result) {
        return {
          name: result.name,
          control: result.control.returned,
          candidate: result.candidate.returned
        };
      });

      var exp = experiment("test", function (e) {
        e.use(function (a, b) { return a + b });
        e.try(function (a, b) { return a * b });
        e.report(reporter);
        e.clean(cleaner);
      });

      exp(2, 3);

      expect(reporter.callCount).to.equal(1);
      expect(cleaner.callCount).to.equal(1);
      expect(trials.length).to.equal(1);

      expect(cleaner.args[0][0]).to.deep.equal({
        name: "test",
        control: { 
          args: [ 2, 3 ],
          metadata: {},
          returned: 5,
          duration: 0
        },
        candidate: {
          args: [ 2, 3 ],
          metadata: {},
          returned: 6,
          duration: 0
        }
      });

      expect(reporter.args[0][0]).to.deep.equal({
        name: "test",
        control: 5,
        candidate: 6
      });

    });
  });

  describe("#enabled", function () {

  });

});