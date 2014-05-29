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
exports = module.exports = open;

var log = require('./log');
var handlebars = require('handlebars');
var openjs = require('open');

function open(contrib, step, callback){
  if (contrib.options['dry-run']) {
    log.writeln('open: '+step.open);
    log.writeln('(the url would be opened here)');
    return callback();
  }

  var url = handlebars.compile(step.open)(contrib.data);
  log.writeln('open: '+url);

  contrib.confirmStep(contrib.options.interactive, function(err){
    if (err) { return callback(err); }

    openjs(url);
    callback();
  });
}
