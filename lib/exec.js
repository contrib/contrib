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
var Exec = module.exports = exports = {};

var shell = require('shelljs');
var handlebars = require('handlebars');
var log = require('./log');
var Command = require('./command');

/**
 * Perforn an exec step
 * @param  {String|Object}   step     The step configuration
 * @param  {Object}   options  Global config options
 * @param  {Function} callback
 */
Exec.do = function(step, callback){
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
  var script = handlebars.compile(step.exec)(command.data);

  // display the command
  log.writeln('$ '+script+'\n');

  Command.confirmStep(options.interactive, function(err){
    var result, cmd, args, cp;

    if (err) { return callback(err); }

    // testing the use of spawn instead of exec
    // was running into issue with exec not capturing all output
    // example `whois a.io`
    if (!step.useExec) {
      script = script.split(' ');

      cmd = script.slice(0,1)[0];
      args = script.slice(1);

      cp = require('child_process').spawn(cmd, args);
      result = '';

      cp.stdout.on('data', function (data) {
        log.write(data);
        result += data;
      });

      cp.stderr.on('data', function (data) {
        log.write(data);
      });

      cp.on('error', function(err){
        log.error(err);
      });

      cp.on('close', function (code) {
        if (code > 0) {
          callback(step.fail || 'exec failed');
        } else {
          callback(null, result.trim());
        }
      });
    } else {
      result = shell.exec(cmd);

      if (result.code > 0) {
        return callback(step.fail || 'exec failed');
      }

      callback(null, result.output.trim());
    }
  });
};
