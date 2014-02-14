'use strict';

var contrib = require('../lib/contrib.js');
var sinon = require('sinon');

// require libs for stubbing
var shell = require('shelljs');
var prompts = require('../lib/prompts');
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

// var config = {
//   install: {
//     steps: [
//       {
//         desc: 'test exec',
//         exec: 'test exec'
//       }
//     ]
//   },
//   contributions: {
//     feature: {
//       start: {
//         steps: [
//           {
//             desc: "feature step 1",
//             exec: "exec feature step 1"
//           }
//         ]
//       }
//     },

//     bug: {
//       desc: "Submit a bug",
//       steps: [
//         {
//           url: 'http://url'
//         }
//       ]
//     }
//   }
// };

exports['contrib'] = {
  setUp: function(done) {
    // create stubs for commands
    sinon.stub(shell, 'exec');
    sinon.stub(prompts, 'confirm').callsArg(2);
    sinon.stub(log, 'writeln');

    done();
  },
  tearDown: function(done){
    // restore stubs
    shell.exec.restore();
    prompts.confirm.restore();
    log.writeln.restore();

    done();
  },
  'contrib step types': function(test) {
    // test.expect(1);

    // exec
    contrib({
      install: {
        steps: ['test string exec']
      }
    }, ['node', 'contrib', 'install' ]);
    test.ok(shell.exec.getCall(0).calledWith('test string exec'), '`test string exec` should be executed');
    shell.exec.reset();

    contrib({
      install: {
        steps: [{ exec: 'test key exec' }]
      }
    }, ['node', 'contrib', 'install' ]);
    test.ok(shell.exec.getCall(0).calledWith('test key exec'), '`test key exec` should be executed');
    shell.exec.reset();

    // prompt
    contrib({
      install: {
        steps: [{ prompt: 'my message' }]
      }
    }, ['node', 'contrib', 'install' ]);
    test.ok(prompts.confirm.calledWith('my message'), '`my message` should be prompted');
    prompts.confirm.reset();

    test.done();
  },
  'contrib step series': function(test) {
    contrib({
      install: {
        steps: [
          { exec: 'exec 1' },
          { prompt: 'prompt 1' },
          { exec: 'exec 2' },
          { prompt: 'prompt 2' },
          { exec: 'exec 3' }
        ]
      }
    }, ['node', 'contrib', 'install' ]);

    test.equal(shell.exec.getCall(0).args[0], 'exec 1', 'exec 1 should be 1st');
    test.ok(prompts.confirm.calledWith('prompt 1'), 'prompt 1 should be 2nd');
    test.equal(shell.exec.getCall(1).args[0], 'exec 2', 'exec 2 should be 3rd');
    test.ok(prompts.confirm.calledWith('prompt 2'), 'prompt 2 should be 4th');
    test.equal(shell.exec.getCall(2).args[0], 'exec 3', 'exec 3 should be 5th');

    test.done();
  },
  'contributions': function(test){
    contrib({
      contributions: {
        feature: { steps: ['feature 1'] }
      }
    }, ['node', 'contrib', 'feature' ]);

    test.ok(shell.exec.calledWith('feature 1'), 'feature 1 should be called');
    shell.exec.reset();

    test.done();
  },
  'contribution subcommands': function(test){
    contrib({
      contributions: {
        feature: {
          new: {
            steps: ['new 1']
          }
        }
      }
    }, ['node', 'contrib', 'feature', 'new' ]);

    test.ok(shell.exec.calledWith('new 1'), 'new 1 should be called');
    shell.exec.reset();

    test.done();
  },
  // 'descriptions': function(test){
  //   contrib({
  //     install: {
  //       steps: [{
  //         desc: 'description',
  //         exec: 'desc exec'
  //       }]
  //     }
  //   }, ['node', 'contrib', 'install' ]);

  //   test.ok(log.writeln.calledWith('description'), 'description should be written');

  //   test.done();
  // }
};
