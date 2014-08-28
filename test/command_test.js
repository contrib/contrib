'use strict';

var contrib = require('../lib/contrib.js');
var sinon = require('sinon');
var fs = require('fs');

// require libs for stubbing
var shell = require('shelljs');
var prompt = require('../lib/prompt');
var log = require('../lib/log');
var child_process = require('child_process');
var Exec = require('../lib/exec');

// var open = require('../lib/open');

// https://github.com/tschaub/mock-fs

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['command_test'] = {
  setUp: function(done) {
    // create stubs for commands
    sinon.stub(prompt, 'confirm').callsArg(1);
    sinon.stub(log, 'writeln');
    sinon.stub(Exec, 'do').callsArg(1);

    done();
  },
  tearDown: function(done){
    // restore stubs
    prompt.confirm.restore();
    log.writeln.restore();
    Exec.do.restore();

    done();
  },
  'basic commands': function(test) {
    // test.expect(1);

    // exec
    contrib({
      example: {
        steps: ['test string exec']
      }
    }, ['example']);

    test.ok(Exec.do.getCall(0), 'first step executed');
    test.equal(Exec.do.firstCall.args[0].exec, 'test string exec', '`test string exec` should be executed');
    Exec.do.reset();

    contrib({
      example: {
        steps: [
          'echo hello',
          'echo world'
        ]
      }
    }, ['example']);

    test.ok(Exec.do.getCall(0), 'first step executed');
    test.equal(Exec.do.getCall(0).args[0].exec, 'echo hello', '`echo hello` should be executed');
    test.ok(Exec.do.getCall(1), 'second step executed');
    test.equal(Exec.do.getCall(1).args[0].exec, 'echo world', '`echo world` should be executed');
    Exec.do.reset();

    test.done();
  },
  'command defined with array': function(test) {
    contrib({
      example: [
        'echo hello',
        'echo world'
      ]
    }, ['example']);

    test.ok(Exec.do.getCall(0), 'first step executed');
    test.equal(Exec.do.getCall(0).args[0].exec, 'echo hello', '`echo hello` should be executed');
    test.ok(Exec.do.getCall(1), 'second step executed');
    test.equal(Exec.do.getCall(1).args[0].exec, 'echo world', '`echo world` should be executed');

    test.done();
  },
  'command defined with string': function(test) {
    contrib({
      example: 'echo hello world'
    }, ['example']);

    test.ok(Exec.do.getCall(0), 'first step executed');
    test.equal(Exec.do.getCall(0).args[0].exec, 'echo hello world', 'command defined as string was executed');

    test.done();
  },
  'subcommands': function(test) {
    contrib({
      "feature": {
        "start": {
          "steps": [
            "feature step 1",
            "feature step 2"
          ]
        }
      }
    }, ['feature', 'start']);

    test.equal(Exec.do.getCall(0).args[0].exec, 'feature step 1', 'first subcommand step executed');
    test.equal(Exec.do.getCall(1).args[0].exec, 'feature step 2', 'second subcommand step executed');

    test.done();
  },
  'include': function(test) {
    contrib({
      "foo": {
        "steps": [
          { "exec": "echo hello" },
          { "include": "bar" }
        ]
      },
      "bar": {
        "steps": [
          { "exec": "echo world" }
        ]
      }
    }, ['foo']);

    test.equal(Exec.do.getCall(0).args[0].exec, 'echo hello', 'first step executed');
    test.equal(Exec.do.getCall(1).args[0].exec, 'echo world', 'included step executed correctly');

    test.done();
  }
};

