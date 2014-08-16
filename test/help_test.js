'use strict';

var contrib = require('../lib/contrib.js');
var sinon = require('sinon');
var fs = require('fs');

// require libs for stubbing
var shell = require('shelljs');
var prompt = require('../lib/prompt');
var log = require('../lib/log');
var help = require('../lib/help.js');

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

exports['help_test'] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done){
    done();
  },
  'help commands': function(test) {
    // stub help.show to check when it is called
    sinon.stub(help, 'show');

    contrib({}, []);
    test.ok(help.show.called, 'help is displayed if no command is given');
    help.show.reset();

    contrib({}, ['help']);
    test.ok(help.show.called, 'help is displayed if help command is given');
    help.show.reset();

    contrib({}, [], ['--help']);
    test.ok(help.show.called, 'help is displayed if help option is given');
    help.show.reset();

    contrib({}, [], ['-h']);
    test.ok(help.show.called, 'help is displayed if help flag is given');
    help.show.reset();

    help.show.restore();
    test.done();
  },
  'help output': function(test) {
    var helpOutput;

    // stub log.write to check the help output
    sinon.stub(log, 'write');

    help.show({});
    helpOutput = log.write.firstCall.args[0];

    test.ok(helpOutput.indexOf('Usage:') !== -1, 'help output should contain usage');
    test.ok(helpOutput.indexOf('Commands:') !== -1, 'help output should contain commands');
    test.ok(helpOutput.indexOf('Options:') !== -1, 'help output should contain options');

    log.write.restore();
    test.done();
  }
};
