'use strict';

var contrib = require('../lib/contrib.js');
var sinon = require('sinon');
var fs = require('fs');

var config = require('../lib/config.js');

// require libs for stubbing
var shell = require('shelljs');
var prompt = require('../lib/prompt');
var log = require('../lib/log');

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

exports['config_test'] = {
  setUp: function(done) {
    done();
  },
  tearDown: function(done){
    done();
  },
  'no config or init command': function(test) {
    // stub config.init to check if it's called
    sinon.stub(config, 'init');
    // stub prompt.confirm to bypass prompt
    sinon.stub(prompt, 'confirm').callsArg(2);

    contrib(undefined, []);
    test.ok(prompt.confirm.called, 'user is asked if the want to create a config');
    test.ok(config.init.called, 'config init is called if there is no config');
    config.init.reset();
    prompt.confirm.reset();

    contrib(undefined, ['init']);
    test.ok(!prompt.confirm.called, 'user should not be asked if the want to create a config');
    test.ok(config.init.called, 'config init is called if the init command is used');
    config.init.reset();
    prompt.confirm.reset();

    config.init.restore();
    prompt.confirm.restore();
    test.done();
  },
  'config init': function(test) {
    // stub fs.existsSync to control what it returns
    var configExists = sinon.stub(fs, 'existsSync');
    // stub fs.writeFileSync to stop it from actually writing the file
    sinon.stub(fs, 'writeFileSync');
    // stub log.error to check if it was called
    sinon.stub(log, 'error');
    // stub log.writeln to prevent it from writing out
    sinon.stub(log, 'writeln');

    configExists.returns(false);
    config.init();
    test.ok(fs.writeFileSync.called, 'config is written out');
    test.ok(log.writeln.called, 'user is notified that config was written');
    fs.writeFileSync.reset();

    configExists.returns(true);
    config.init();
    test.ok(log.error.called, 'an error is logged if a config already exists');
    test.ok(!fs.writeFileSync.called, 'config is not written out');

    log.error.restore();
    log.writeln.restore();
    fs.writeFileSync.restore();
    fs.existsSync.restore();
    test.done();
  }
};
