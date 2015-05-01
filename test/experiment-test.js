require("babel/register");

let expect = require("chai").expect;
let sinon = require("sinon");

let experiment = require("../src/experiment");

let {omitNonDeterministic} = require("./helpers");

let noop = () => {};
let add = (a, b) => a + b
let multiply = (a, b) => a * b
let clone = (obj) =>
  Object.keys(obj).reduce((ret, key) => { ret[k] = obj[k] }, {});



describe("experiment 'constructor'", () => {

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
      let spy = sinon.spy(function (e) {
        expect(this).to.equal(e);
      });

      let ctx = {};
      let arg = {};
      let exp = experiment("test", function (e) {
        ctx = this;
        arg = e;
      });

      expect(arg).to.equal(ctx);
      expect(arg).to.equal(exp);
    });

  });

});




describe("instance methods", () => {




  describe("#use", () => {
    it("sets the experiment's control behavior", () => {
      let sayHi = () => "Hello!"

      let exp = experiment("test", (e) => {
        e.use(sayHi);
      });

      expect(exp.control).to.equal(sayHi);
      expect(exp()).to.equal(sayHi());
    });

    it("an experiment will throw an error when called if not set", () => {
      let exp = experiment("test", () => null);

      expect(() => exp()).to.throw(/can't run experiment without control/i);
    });

    it("an experiment whose control behavior throws an error will throw that error", () => {
      let exp = experiment("test", (e) => {
        e.use(() => {throw new Error("Kaboom!")});
      })

      expect(() => exp()).to.throw(/kaboom/i);
    });
  });




  describe("#try", () => {

    let sayHi, sayBye, exp;

    beforeEach(() => {
      sayHi  = sinon.spy(() => "Hi!");
      sayBye = sinon.spy(() => "Bye!");
      exp = experiment("test", (e) => {
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
      let exp = experiment("test", (e) => {
        e.use(() => "didn't throw");
        e.try(() => {throw new Error("Kaboom!")});
      });

      expect(exp()).to.equal("didn't throw");
    });
  });




  describe("#context", () => {

    it("sets the experiment's `this` context", () => {
      let ctx;
      let obj = {};
      let exp = experiment("test", (e) => {
        e.use(function () { ctx = this; });
        e.context(obj);
      });

      exp();
      expect(ctx).to.equal(obj);
    });

    it("overrides calling context if set", () => {
      let ctx;
      let obj1 = {};
      let obj2 = {};

      let exp = experiment("test", (e) => {
        e.use(function () { ctx = this; });
        e.context(obj1);
      });

      exp.call(obj2)
      expect(ctx).to.equal(obj1);

    });

    it("defers to the calling context if unset", () => {
      let ctx;
      let obj = {};

      let exp = experiment("test", (e) => {
        e.use(function () { ctx = this; });
      });

      exp.call(obj)
      expect(ctx).to.equal(obj);

    });

  });

  describe("#metadata", () => {
    it("merges the argument into the experiment's metadata", () => {

    });
  });


  describe("#report", () => {
    let trials = [];

    let spy = sinon.spy((x) => trials.push(x))

    it("sets the experiment's trial reporter", () => {

      let exp = experiment("test", (e) => {
        e.use(add);
        e.try(multiply);
        e.report(spy);
      });

      exp(2, 3);

      expect(spy.calledOnce).to.equal(true);
      expect(trials.length).to.equal(1);

      expect(omitNonDeterministic(trials[0])).to.deep.equal({
        name: "test",
        control: {
          args: [ 2, 3 ],
          metadata: {},
          returned: 5,
        },
        candidate: {
          args: [ 2, 3 ],
          metadata: {},
          returned: 6,
        }
      });
    });
  });




  describe("#clean", () => {
    it("is applied to a trial object before it gets to the reporter", () => {
      let trials = [];
      let reporter = sinon.spy((arg) => trials.push(arg));

      let cleaner = sinon.spy((result) => {
        return {
          name: result.name,
          control: result.control.returned,
          candidate: result.candidate.returned
        };
      });

      let exp = experiment("test", (e) => {
        e.use(add);
        e.try(multiply);
        e.report(reporter);
        e.clean(cleaner);
      });

      exp(2, 3);

      expect(reporter.callCount).to.equal(1);
      expect(cleaner.callCount).to.equal(1);
      expect(trials.length).to.equal(1);

      expect(omitNonDeterministic(cleaner.args[0][0])).to.deep.equal({
        name: "test",
        control: {
          args: [ 2, 3 ],
          metadata: {},
          returned: 5,
        },
        candidate: {
          args: [ 2, 3 ],
          metadata: {},
          returned: 6,
        }
      });

      expect(reporter.args[0][0]).to.deep.equal({
        name: "test",
        control: 5,
        candidate: 6
      });

    });
  });




  describe("#enabled", () => {
    it("is run to see if the candidate should be executed", () => {
      let candidate = sinon.spy(multiply);
      let enabler = sinon.spy(() => false);

      experiment("test", (e) => {
        e.use(add);
        e.try(candidate);
        e.enabled(enabler);
      })(2, 3);

      expect(enabler.callCount).to.equal(1);
      expect(candidate.callCount).to.equal(0);

    });

    it("is passed the calling arguments", () => {
      let candidate = sinon.spy(multiply);
      let enabler = sinon.spy(() => true);

      experiment("test", (e) => {
        e.use(add);
        e.try(candidate);
        e.enabled(enabler);
      })(2, 3);

      expect(enabler.args[0]).to.deep.equal([2, 3]);
    });
  });



  describe("#beforeRun", () => {
    let id, exp;

    beforeEach(() => {
      id = sinon.spy(x => x);
      exp = experiment("test", (e) => {
        e.use(x => x);
        e.beforeRun(id);
      });
    });


    it("runs only if the candidate is going to run", () => {
      exp([1, 2, 3]);
      expect(id.callCount).to.equal(0);

      let candidate = sinon.spy(noop);
      exp.try(candidate);
      exp.enabled(() => false);
      exp([1, 2, 3]);
      expect(candidate.callCount).to.equal(0);
      expect(id.callCount).to.equal(0);
    });

    it("receives the arguments as an array", () => {
      let o = {};
      exp.try(() => {});
      exp(o);
      expect(Array.isArray(id.args[0][0])).to.equal(true);
      expect(id.args[0][0][0]).to.equal(o);
    });

    it("defaults to returning the arguments array", () => {
      let o = {};
      let candidate = sinon.spy(noop);
      exp.try(candidate);
      exp(o);
      expect(Array.isArray(id.returnValues[0])).to.equal(true);
      expect(id.returnValues[0][0]).to.equal(o);
    });

    it("the candidate is called with the result of beforeRun", () => {
      let o = {};

      before = sinon.spy((args) => {
        return args.map(clone);
      });

      let candidate = sinon.spy(x => x);
      let control = sinon.spy(x => x);

      exp
        .use(control)
        .try(candidate)
        .beforeRun(before)

      exp(o);

      expect(before.returnValues[0][0]).to.equal(candidate.args[0][0]);

      expect(control.args[0][0]).to.equal(o);
      expect(candidate.args[0][0]).to.not.equal(o)
    });

    it("if the beforeRun function doesn't return an array, an exception is thrown", () => {
      exp.try(x => x).beforeRun(() => {});
      expect(() => exp()).to.throw(/must return an array/i);
    });

  });
});





