require("babel/register");

var expect = require("chai").expect;
var sinon = require("sinon");

var experiment = require("../src/experiment");

var {omitNonDeterministic} = require("./helpers");

var add = (a, b) => a + b
var multiply = (a, b) => a * b

var noop = () => {};


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




describe("instance methods", () => {




  describe("#use", () => {
    it("sets the experiment's control behavior", () => {
      var sayHi = () => "Hello!"

      var exp = experiment("test", (e) => {
        e.use(sayHi);
      });

      expect(exp.control).to.equal(sayHi);
      expect(exp()).to.equal(sayHi());
    });

    it("an experiment will throw an error when called if not set", () => {
      var exp = experiment("test", () => null);

      expect(() => exp()).to.throw(/can't run experiment without control/i);
    });

    it("an experiment whose control behavior throws an error will throw that error", () => {
      var exp = experiment("test", (e) => {
        e.use(() => {throw new Error("Kaboom!")});
      })

      expect(() => exp()).to.throw(/kaboom/i);
    });
  });




  describe("#try", () => {

    var sayHi, sayBye, exp;

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
      var exp = experiment("test", (e) => {
        e.use(() => "didn't throw");
        e.try(() => {throw new Error("Kaboom!")});
      });

      expect(exp()).to.equal("didn't throw");
    });
  });




  describe("#context", () => {

    it("sets the experiment's `this` context", () => {
      var ctx;
      var obj = {};
      var exp = experiment("test", (e) => {
        e.use(function () { ctx = this; });
        e.context(obj);
      });

      exp();
      expect(ctx).to.equal(obj);
    });

    it("overrides calling context if set", () => {
      var ctx;
      var obj1 = {};
      var obj2 = {};

      var exp = experiment("test", (e) => {
        e.use(function () { ctx = this; });
        e.context(obj1);
      });

      exp.call(obj2)
      expect(ctx).to.equal(obj1);

    });

    it("defers to the calling context if unset", () => {
      var ctx;
      var obj = {};

      var exp = experiment("test", (e) => {
        e.use(function () { ctx = this; });
      });

      exp.call(obj)
      expect(ctx).to.equal(obj);

    });

  });




  describe("#report", () => {
    var trials = [];

    var spy = sinon.spy((x) => trials.push(x))

    it("sets the experiment's trial reporter", () => {

      var exp = experiment("test", (e) => {
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
      var trials = [];
      var reporter = sinon.spy((arg) => trials.push(arg));

      var cleaner = sinon.spy((result) => {
        return {
          name: result.name,
          control: result.control.returned,
          candidate: result.candidate.returned
        };
      });

      var exp = experiment("test", (e) => {
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
      var candidate = sinon.spy(multiply);
      var enabler = sinon.spy(() => false);

      experiment("test", (e) => {
        e.use(add);
        e.try(candidate);
        e.enabled(enabler);
      })(2, 3);

      expect(enabler.callCount).to.equal(1);
      expect(candidate.callCount).to.equal(0);

    });

    it("is passed the calling arguments", () => {
      var candidate = sinon.spy(multiply);
      var enabler = sinon.spy(() => true);

      experiment("test", (e) => {
        e.use(add);
        e.try(candidate);
        e.enabled(enabler);
      })(2, 3);

      expect(enabler.args[0]).to.deep.equal([2, 3]);
    });
  });



  describe("#beforeRun", () => {

    var emptyArr, exp, id;

    beforeEach(() => {
      emptyArr = sinon.spy((arr) => { while (arr.length) arr.pop() });
      id = sinon.spy(x => x);
      exp = experiment("test", (e) => {
        e.use(emptyArr);
        e.beforeRun(id);
      });
    });


    it("runs only if the candidate is going to run", () => {
      exp([1, 2, 3]);
      expect(id.callCount).to.equal(0);

      var candidate = sinon.spy(noop);
      exp.try(candidate);
      exp.enabled(() => false);
      exp([1, 2, 3]);
      expect(candidate.callCount).to.equal(0);
      expect(id.callCount).to.equal(0);
    });

    it("receives the calling arguments as it's arguments", () => {
      var a = [1];
      var b = [2];

      var candidate = sinon.spy(noop);
      exp.try(candidate);

      exp(a, b);

      expect(id.callCount).to.equal(1);

      expect(id.args[0].length).to.equal(2);
      var [x, y] = id.args[0];
      expect(x).to.equal(a);
      expect(y).to.equal(b);
    });

    it("the candidate is called with the result of beforeRun", () => {
      var a = [1, 2, 3, 4];

      before = sinon.spy((args) => {
        return args.map((a) => a.slice())
      });

      var candidate = sinon.spy(noop);
      exp.try(candidate).beforeRun(before);

      exp(a);

      expect(before.callCount).to.equal(1);

      expect(before.returnValues[0]).to.equal(candidate.args[0][0]);

      expect(emptyArr.args[0][0]).to.equal(a);
      expect(candidate.args[0][0]).to.not.equal(a);
    });

  });
});





