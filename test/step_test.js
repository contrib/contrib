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
  'step defined with an object': function(test) {
    var step;

    // exec
    contrib({
      example: {
        steps: [{
          "exec": "hello",
          "desc": "my description",
          "id": "myID"
        }]
      }
    }, ['example']);

    step = Exec.do.getCall(0).args[0];
    test.equal(step.exec, 'hello', 'step action is correct');
    test.equal(step.desc, 'my description', 'step description is correct');
    test.equal(step.id, 'myID', 'step ID is correct');

    test.done();
  },
  'step defined with a string': function(test) {
    var step;

    // exec
    contrib({
      example: {
        steps: ['string']
      }
    }, ['example']);

    step = Exec.do.getCall(0).args[0];
    test.equal(step.exec, 'string', 'step action is correct');
    test.equal(step.desc, undefined, 'step description is correct');
    test.equal(step.id, undefined, 'step ID is correct');

    test.done();
  },

  'step defined as an array': function(test) {
    var step;

    // exec
    contrib({
      example: {
        steps: [
          [ 'array exec', 'array desc', 'arrID' ]
        ]
      }
    }, ['example']);

    step = Exec.do.getCall(0).args[0];
    test.equal(step.exec, 'array exec', 'step action is correct');
    test.equal(step.desc, 'array desc', 'step description is correct');
    test.equal(step.id, 'arrID', 'step ID is correct');

    test.done();
  },
  'descriptions': function(test) {
    var step;

    // exec
    contrib({
      example: {
        steps: [{
          "exec": "hello",
          "desc": "my description",
          "id": "myID"
        }]
      }
    }, ['example']);

    test.ok(log.writeln.getCall(1).args[0].indexOf('my description') !== -1, 'description displayed');

    test.done();
  },
  'id with results': function(test) {
    // have to restore Exec.do so we can change what it calls
    Exec.do.restore();
    sinon.stub(Exec, 'do').callsArgWith(1, null, 'exec output');

    // exec
    contrib({
      example: {
        steps: [
          { "exec": "hello", "id": "step1" },
          { "exec": "{{ step1 }}" }
        ]
      }
    }, ['example']);

    var step1Val = Exec.do.getCall(1).args[0].command.data.step1;

    test.equal(step1Val, 'exec output', 'the output of the script was stored as the step ID');

    test.done();
  },
};

