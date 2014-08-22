'use strict';

var contrib = require('../lib/contrib.js');
var sinon = require('sinon');
var fs = require('fs');

// require libs for stubbing
var shell = require('shelljs');
var prompt = require('../lib/prompt');
var log = require('../lib/log');
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

// exports['contrib'] = {
//   setUp: function(done) {
//     // create stubs for commands
//     var exec = sinon.stub(shell, 'exec');
//     exec.returns({ code: 0, output: '' });

//     sinon.stub(prompt, 'confirm').callsArg(1);
//     sinon.stub(log, 'writeln');

//     done();
//   },
//   tearDown: function(done){
//     // restore stubs
//     shell.exec.restore();
//     prompt.confirm.restore();
//     log.writeln.restore();

//     done();
//   },
//   'contrib step types': function(test) {
//     // test.expect(1);

//     // exec
//     contrib({
//       install: {
//         steps: ['test string exec']
//       }
//     }, ['install']);
//     test.ok(shell.exec.getCall(0).calledWith('test string exec'), '`test string exec` should be executed');
//     shell.exec.reset();

//     contrib({
//       install: {
//         steps: [
//           { exec: 'test key exec' }
//         ]
//       }
//     }, ['install']);
//     test.ok(shell.exec.getCall(0).calledWith('test key exec'), '`test key exec` should be executed');
//     shell.exec.reset();

//     contrib({
//       install: {
//         steps: [
//           ['test array exec', 'description']
//         ]
//       }
//     }, ['install']);
//     test.ok(shell.exec.getCall(0).calledWith('test array exec'), '`test array exec` should be executed');
//     shell.exec.reset();

//     // confirm
//     contrib({
//       update: {
//         steps: [{ confirm: 'my message' }]
//       }
//     }, ['update']);
//     test.ok(prompt.confirm.called, '`my message` should be prompted');
//     prompt.confirm.reset();

//     test.done();
//   },
//   'contrib step series': function(test) {
//     contrib({
//       update: {
//         steps: [
//           { exec: 'exec 1' },
//           { confirm: 'prompt 1' },
//           { exec: 'exec 2' },
//           { confirm: 'prompt 2' },
//           { exec: 'exec 3' }
//         ]
//       }
//     }, ['update']);

//     test.equal(shell.exec.firstCall.args[0], 'exec 1', 'exec 1 should be 1st');
//     test.equal(prompt.confirm.firstCall.args[0].message, 'prompt 1', 'prompt 1 should be 2nd');
//     test.equal(shell.exec.secondCall.args[0], 'exec 2', 'exec 2 should be 3rd');
//     test.equal(prompt.confirm.lastCall.args[0].message, 'prompt 2', 'prompt 2 should be 4th');
//     test.equal(shell.exec.lastCall.args[0], 'exec 3', 'exec 3 should be 5th');

//     test.done();
//   },
//   'subcommands': function(test){
//     contrib({
//       feature: {
//         new: {
//           steps: ['new 1']
//         }
//       }
//     }, ['feature', 'new']);

//     test.ok(shell.exec.calledWith('new 1'), 'new 1 should be called');
//     shell.exec.reset();

//     test.done();
//   },
//   'embedded contrib commands': function(test){
//     contrib({
//       install: {
//         steps: [
//           'install 1',
//           {
//             include: 'update'
//           }
//         ]
//       },
//       update: {
//         steps: ['update 1']
//       }
//     }, ['install']);

//     test.ok(shell.exec.calledWith('install 1'), 'install 1 should be called');
//     test.ok(shell.exec.calledWith('update 1'), 'update 1 should be called');
//     shell.exec.reset();

//     contrib({
//       update: {
//         steps: ['update step']
//       },
//       feature: {
//         part1: {
//           steps: [
//             'part1 step',
//             { include: 'feature part2'  },
//             { include: 'update' }
//           ]
//         },
//         part2: {
//           steps: ['part2 step']
//         }
//       }
//     }, ['feature', 'part1']);

//     test.ok(shell.exec.calledWith('part1 step'), 'part 1 should be called');
//     test.ok(shell.exec.calledWith('part2 step'), 'part 2 should be called');
//     test.ok(shell.exec.calledWith('update step'), 'update should be called');
//     shell.exec.reset();

//     test.done();
//   },
//   'template var interpolation': function(test){
//     contrib({
//       project: {
//         foo: 'world'
//       },
//       install: {
//         steps: ['hello {{ project.foo }}']
//       }
//     }, ['install']);

//     test.ok(shell.exec.calledWith('hello world'), 'project var should be used in template');
//     shell.exec.reset();

//     test.done();
//   }

//   // 'descriptions': function(test){
//   //   contrib({
//   //     install: {
//   //       steps: [{
//   //         desc: 'description',
//   //         exec: 'desc exec'
//   //       }]
//   //     }
//   //   }, ['install']);

//   //   test.ok(log.writeln.calledWith('description'), 'description should be written');

//   //   test.done();
//   // },

//   // Trying to move away from requirements being a built in operation
//   // 'requirements': function(test){
//   //   var fixture = fs.readFileSync(__dirname+'/fixtures/requirements.txt', 'utf8');

//   //   contrib({
//   //     project: {
//   //       requirements: [
//   //         'git',
//   //         {
//   //           "name": "node.js",
//   //           "url": "http://nodejs.org"
//   //         }
//   //       ]
//   //     },
//   //     install: {
//   //       steps: ['echo foo']
//   //     }
//   //   }, ['install']);

//   //   test.ok(log.writeln.calledWith(fixture), 'requirements were listed correctly');

//   //   test.done();
//   // }
// };

