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
var Prompt = module.exports = exports = {};

var promptjs = require('prompt');
var handlebars = require('handlebars');
var _ = require('lodash');
var log = require('./log');

Prompt.doStep = function(step, callback){
  var type = step.prompt;
  var command = step.command || {};

  if (command.options['dry-run']) {
    log.writeln('prompt: '+type+': (you will be asked to confirm or provide information)');
    return callback();
  }

  Prompt[type]({}, function(err, result){
    if (err) { return callback(err); }
    callback(null, result);
  });
};

Prompt.confirm = function(options, callback){
  if (typeof options === 'string') {
    options = { message: options };
  }

  _.extend(options, {
    name: 'yesno',
    message: (options.message || 'confirm')+' (yes/no)',
    validator: /y[es]*|n[o]?/i,
    warning: 'Must respond yes or no'
  });

  Prompt.prompt(options, function (err, result) {
    if (err) {
      return callback(err);
    } else if (['n', 'no'].indexOf(result.yesno.toLowerCase()) !== -1) {
      return callback('Confirmation failed');
    }
    callback(null, true);
  });
};

Prompt.text = function(options, callback){
  options = options || {};
  options.name = options.name || 'text';

  Prompt.prompt(options, function(err, result){
    if (err) { return callback(err); }
    callback(null, result.text.trim());
  });
};

Prompt.prompt = function(options, callback){
  // the type key can screw with promptjs
  delete options.type;

  promptjs.start();
  promptjs.get(options, callback);
};
