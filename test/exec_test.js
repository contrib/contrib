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


exports['exec_test'] = {
  setUp: function(done) {
    // create stubs for commands
    sinon.stub(shell, 'exec').returns({ code: 0, output: '' });
    sinon.stub(prompt, 'confirm').callsArg(1);
    sinon.stub(log, 'writeln');

    var noop = function(){};
    sinon.stub(child_process, 'spawn').returns({
      on: function(evt, callback){
        if (evt === 'close') {
          callback(0);
        }
      },
      stdout: { on: noop },
      stderr: { on: noop }
    });

    done();
  },
  tearDown: function(done){
    // restore stubs
    shell.exec.restore();
    prompt.confirm.restore();
    log.writeln.restore();
    child_process.spawn.restore();

    done();
  },
  
  // Currently Switching between exec and spawn to see which is better
  // 'spawn': function(test) {
  //   test.expect(2);
  // 
  //   var step = {
  //     exec: 'echo hi',
  //     command: {
  //       options: {},
  //       data: {}
  //     }
  //   };
  // 
  //   Exec.do(step, function(){
  //     test.ok('callback fired');
  //   });
  // 
  //   test.deepEqual(child_process.spawn.getCall(0).args, ['echo', ['hi']], 'spawn called with correct args');
  // 
  //   test.done();
  // }
};

