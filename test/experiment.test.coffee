# {expect} = require "chai"

require("sentence").globals()

Experiment = require "../src/experiment"

describe "Experiment", ->

  describe "#constructor", ->

    it "is a constructor", ->
      expect(new Experiment("")) to be an Experiment

    it "can be called without new", ->
      expect(Experiment "") to be an Experiment

    it "requires a string as the first argument", ->
      expect(-> new Experiment) to error

    it "can be invoked without a second argument", ->
      new Experiment("")

    it "calls the function argument", ->
      called = false
      new Experiment "", -> called = true
      expect(called) to equal true

    it "calls the function argument with the instance as the context", ->
      ctx = null
      instance = new Experiment "", -> ctx = @
      expect(instance) to equal ctx

    it "expected methods are available", ->
      new Experiment "", ->
        [@use, @try]
          .forEach (method) ->
            expect(method) to be a Function


