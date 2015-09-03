require("babel/register");

let _ = require("lodash");
// let expect = require("chai").expect;

let expect = require("must");
let sinon = require("sinon");

const {
  syncExperiment,
  Experiment,
} = require("../lib");

let {
  omitNonDeterministic,
  spyEvent,
} = require("./helpers");

let noop = () => {};
let id = x => x;
let no = () => false;
let yes = () => true;
let add = (a, b) => a + b;
let multiply = (a, b) => a * b;
function self () { return this; }

// minimum amount of work required to initialize an experiment
function executor (e) { e.use(noop); }

function make (f, g) {
  return syncExperiment("test", e => {
    e.use(f);
    if (g) e.try(g);
  });
}

describe("syncExperiment 'constructor'", () => {

  it("takes a `name` string as it's required first argument", () => {
    expect(() => syncExperiment()).to.throw(/argument must be a string/i);
  });

  it("takes an `executor` function as it's required second argument", () => {
    expect(() => syncExperiment("")).to.throw(/argument must be a function/i);
    expect(() => syncExperiment("", "")).to.throw(/argument must be a function/i);
  });

  it("returns a function", function () {
    expect(typeof syncExperiment("", executor)).to.equal("function");
  });

  xit("copies own enumerable properties from the control to the experiment", () => {

    function f () {}

    var a = {}, b = {};

    Object.defineProperties(f, {
      "a": {enumerable: true, value: a},
      "b": {value: b},
    });

    var exp = syncExperiment("test", e => {
      e.use(f);
    });

    expect(exp.a).to.equal(a);
    expect(exp.hasOwnProperty("b")).to.equal(false);

  });

  describe("executor function invocation", () => {

    it("executor's `this` context and executor's argument are the same object", () => {
      let ctx = {};
      let arg = {};

     syncExperiment("test", function (e) {
        e.use(noop);
        ctx = this;
        arg = e;
      });

      expect(arg).to.equal(ctx);
    });

    it("the argument/context is an instance of Experiment", () => {
      let exp;

      syncExperiment("test", e => {
        e.use(noop);
        exp = e;
      });

      expect(exp instanceof Experiment).to.equal(true);
    });

  });

});




describe("invocation of Experiment instance methods", () => {

  describe("#use", () => {
    let exp;

    it("sets the experiment's control behavior", () => {
      let fn = syncExperiment("test", (e) => {
        exp = e.use(yes);
      });
      expect(exp.control).to.equal(yes);
      expect(fn()).to.equal(yes());
    });

    it("an experiment whose control behavior throws an error will throw that error", () => {
      let fn = syncExperiment("test", e => {
        e.use(function () {
          throw new Error("Kaboom!");
        });
      });
      expect(fn).to.throw(/kaboom/i);
    });

    describe("dynamic `this` context", () => {
      let obj;

      beforeEach(() => {
        obj = { method: make(self) };
      });

      it("passes the calling context correctly", () => {
        expect(obj.method()).to.equal(obj);
      });

      it("works with explicit context setting", () => {
        let thing = {};
        expect(obj.method.call(thing)).to.equal(thing);
      });

    });
  });




  describe("#try", () => {

    let ySpy, nSpy, exp, fn;

    beforeEach(() => {
      ySpy = sinon.spy(yes);
      nSpy = sinon.spy(no);
      fn = syncExperiment("test", (e) => {
        exp = e.use(ySpy).try(nSpy);
      });
    });

    it("sets the experiment's control behavior", () => {
      expect(exp.candidate).to.equal(nSpy);
      expect(fn()).to.equal(ySpy());
    });

    it("it is invoked when the experiment is called", () => {
      fn();
      expect(ySpy.callCount).to.equal(1);
      expect(nSpy.callCount).to.equal(1);
    });

    it("an experiment whose candidate behavior throws an error will not throw", () => {

      fn = syncExperiment("test", e => {
        e.use(yes);
        e.try(() => { throw new Error("Kaboom!"); });
        exp = e;
      });

      expect(fn()).to.equal(true);
    });

  });

  describe("#metadata", () => {

    it("merges the argument into the experiment's metadata", () => {
      let trial;

      syncExperiment("test", e => {
        e.use(add).try(noop);
        e.setMetadata({a: 1});
        e.setMetadata({a: 2, b: 3});
        e.on("trial", (t) => trial = t);
      })();

      expect(trial).to.exist();
      expect(trial.metadata.a).to.equal(2);
    });
  });

  describe("#enabled", () => {
    it("is run to see if the candidate should be executed", () => {
      let candidate = sinon.spy(multiply);
      let enabler = sinon.spy(no);

      let fn = syncExperiment("test", e => {
        e.use(add).try(candidate);
        e.enabled = enabler;
      });

      fn(2, 3);

      expect(enabler.callCount).to.equal(1);
      expect(candidate.callCount).to.equal(0);

    });

    it("is passed the calling arguments", () => {
      let candidate = sinon.spy(multiply);
      let enabler = sinon.spy(yes);

      let fn = syncExperiment("test", e => {
        e.use(add).try(candidate);
        e.enabled = enabler;
      });

      fn(2, 3);

      expect(enabler.args[0]).to.eql([2, 3]);
    });
  });



  describe("#beforeRun", () => {
    let sid, exp, fn;

    beforeEach(() => {
      sid = sinon.spy(id);
      fn = syncExperiment("test", e => {
        e.use(id);
        e.beforeRun = sid;
        exp = e;
      });
    });


    it("runs only if the candidate is going to run (no candidate)", () => {
      fn([1, 2, 3]);
      expect(sid.callCount).to.equal(0);
    });

    it("runs only if the candidate is going to run (candidate disabled)", () => {
      let candidate = sinon.spy(noop);
      exp.enabled = no;
      exp.try(candidate);

      fn([1, 2, 3]);
      expect(candidate.callCount).to.equal(0);
      expect(sid.callCount).to.equal(0);
    });

    it("receives the arguments as an array", () => {
      let o = {};
      exp.try(noop);

      fn(o);
      expect(Array.isArray(sid.args[0][0])).to.equal(true);
      expect(sid.args[0][0][0]).to.equal(o);
    });

    it("defaults to returning the arguments array", () => {
      let trial, o = {};
      exp.try(noop).on("trial", t => trial = t);
      fn(o);

      expect(trial.control.args[0]).to.equal(o);
      expect(trial.candidate.args[0]).to.equal(o);
    });

    it("the candidate is called with the result of beforeRun", () => {
      let o = {};

      before = sinon.spy(args => {
        return args.map(_.clone);
      });

      let candidate = sinon.spy(id);
      let control = sinon.spy(id);

      fn = syncExperiment("test", ex => {
        ex.use(control).try(candidate);
        ex.beforeRun = before;
      });

      fn(o);
      expect(before.returnValues[0][0]).to.equal(candidate.args[0][0]);
      expect(control.args[0][0]).to.equal(o);
      expect(candidate.args[0][0]).to.not.equal(o);
    });

    it("if the beforeRun function doesn't return an array, an exception is thrown", () => {
      exp.beforeRun = noop;
      exp.try(noop);
      expect(fn).to.throw(/must return an array/i);
    });

  });

  describe("events", () => {

    describe("skip", () => {
      it("is emitted when an experiment is skip (candidate is not run)", () => {
        let stub;

        syncExperiment("test", e => {
          stub = sinon.stub();
          e.use(noop).on("skip", stub);
        })();

        expect(stub.callCount).to.equal(1);
      });

      it("not emitted when an experiemnt runs", () => {
        let stub;

        syncExperiment("test", e => {
          stub = sinon.stub();
          e.use(noop).try(noop).on("skip", stub);
        })();

        expect(stub.callCount).to.equal(0);
      });
    });

    describe("trial", () => {
      xit("is emitted whenever an experiment runs", () => {

      });
    });

    describe("match", () => {
      xit("is emitted whenever a trial satisfies the experiment's match method", () => {

      });
    });

    describe("mismatch", () => {
      xit("is emitted whenever a trial does not satisfy the experiment's match method", () => {

      });
    });

  });
});





