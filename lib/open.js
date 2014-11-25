/*
 * contrib
 * https://github.com/contrib/contrib
 *
 * Copyright (c) 2014 Steve Heffernan
 * Licensed under the Apache license.
 */

'use strict';

var Command = require('./command');

/**
 * Export the main function
 */
exports = module.exports = open;

var log = require('./log');
var handlebars = require('handlebars');
var openjs = require('open');

function open(step, callback){
  var command = step.command;

  if (command.options['dry-run']) {
    log.writeln('open: '+step.open);
    log.writeln('(the url would be opened here)');
    return callback();
  }

  var url = handlebars.compile(step.open)(command.data);
  log.writeln('open: '+url);

  Command.confirmStep(command.options.interactive, function(err){
    if (err) { return callback(err); }

    openjs(url);
    callback();
  });
}
