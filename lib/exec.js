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
var Exec = module.exports = {};

var shell = require('shelljs');
var handlebars = require('handlebars');
var log = require('./log');
var Command = require('./command');
var _ = require('lodash');
var Errors = require('./errors');

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

    if (/^cd\s.+/.test(script)) {
      shell.cd(script.replace('cd ', ''));

      console.log('result', result, script.replace('cd ', ''));

      return callback(null, '');
    }

    // There's a few difficulties with using exec

    // testing the use of spawn instead of exec
    // was running into issue with exec not capturing all output
    // example `whois a.io`
    if (!step.useExec) {

      // Trying to find a way to not split on spaces within quotes...
      // e.g. "grunt chg-add:'blah blah'"
      // script = script.split(/([^\s]*\'.*?\')|(\s)/);
      // script = _.reject(script, function(i){ return !(i && i.trim()); });
      // script = script.match(/[^\s"']+|((?!\\)"([^"]*)(?!\\)")|.?(?!\\)'([^']*)'/g);
      // script = script.split(' ');

      var exec = require('child_process').exec;

      exec(__dirname+'/../bin/args '+script, function(error, stdout, stderr){
        var args = JSON.parse(stdout).slice(2);
        // args now split

        cmd = args[0];
        args = args.slice(1);

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
            var error = new Errors.Exec(step.fail, { code: result.code });
            callback(error);
          } else {
            callback(null, result.trim());
          }
        });
      });

    } else {
      result = shell.exec(cmd);

      if (result.code > 0) {
        var error = new Errors.Exec(step.fail, { code: result.code });
        return callback(error);
      }

      callback(null, result.output.trim());
    }
  });
};
