/*
 * contrib
 * https://github.com/contrib/contrib
 *
 * Copyright (c) 2014 Steve Heffernan
 * Licensed under the Apache license.
 */

'use strict';

/**
 * Export the main function
 */
exports = module.exports = exec;

var shell = require('shelljs');
var handlebars = require('handlebars');
var log = require('./log');

/**
 * Perforn an exec step
 * @param  {String|Object}   step     The step configuration
 * @param  {Object}   options  Global config options
 * @param  {Function} callback
 */
function exec(contrib, step, callback){
  var command = step.command;
  var options = command.options;

  if (options['dry-run']) {
    log.writeln('$ '+step.exec);
    return callback();
  }

  // Need to check which previous steps might be needed before this one
  // in the case of using --begin [step]
  // Not doing anything with this yet. Need to find the best approach
  // for running previous steps
  var missingInfo = {};
  var needsMissingInfo = false;
  var Proxy = require('node-proxy');
  var proxy = Proxy.create({
    get: function(receiver, name){
      if (command.data[name] === undefined) {
        needsMissingInfo = true;
        missingInfo[name] = true;
      }
      return command.data[name];
    }
  });
  handlebars.compile(step.exec)(proxy);

  if (needsMissingInfo) {
    return callback('This step requires info from previous steps. Please start over from the beginning.');
  }

  // add stored values
  var cmd = handlebars.compile(step.exec)(command.data);

  // display the command
  log.writeln('$ '+cmd);

  contrib.confirmStep(options.interactive, function(err){
    if (err) { return callback(err); }

    var result = shell.exec(cmd);

    if (result.code > 0) {
      return callback(step.fail || 'exec failed');
    }

    callback(null, result.output.trim());
  });
}

// Exec.prototype.describe = function(step, callback){
//   var command = step.command;

//   if (command.options['dry-run']) {
//     log.writeln('$ '+step.exec);
//     return callback();
//   }

//   // Need to check which previous steps might be needed before this one
//   // in the case of using --begin [step]
//   // Not doing anything with this yet. Need to find the best approach
//   // for running previous steps
//   // Could possibly just assume any step with an ID is needed
//   // and the let 'required' and 'notRequred' keys undo that
//   // var missingInfo = {};
//   // var needsMissingInfo = false;
//   // var Proxy = require('node-proxy');
//   // var proxy = Proxy.create({
//   //   get: function(receiver, name){
//   //     if (command.data[name] === undefined) {
//   //       needsMissingInfo = true;
//   //       missingInfo[name] = true;
//   //     }
//   //     return command.data[name];
//   //   }
//   // });
//   // handlebars.compile(step.exec)(proxy);

//   // if (needsMissingInfo) {
//   //   return callback('This step requires info from previous steps. Please start over from the beginning.');
//   // }

//   // add stored values
//   var cmd = handlebars.compile(step.exec)(command.data);

//   // display the command
//   log.writeln('$ '+cmd);
// };

// exec.do = function(callback){
//   var result = shell.exec(cmd);

//   if (result.code > 0) {
//     return callback(step.fail || 'exec failed');
//   }

//   callback(null, result.output.trim());
// };
