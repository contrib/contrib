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
exports = module.exports = prompt;

var promptjs = require('prompt');
var handlebars = require('handlebars');
var _ = require('lodash');

var log = require('./log');

function prompt(step, callback){
  var details = step.prompt;
  var command = step.command;
  var options = command.options;

  // allow for just passing in a string for text prompt
  if (typeof details === 'string') {
    details = {
      type: 'text',
      message: details
    };
  }

  if (options['dry-run']) {
    log.writeln('prompt: '+(details.message || details.type)+': (you will be asked to confirm or provide information)');
    return callback();
  }

  // apply the data to any template vars in the message
  if (details.message) {
    details.message = handlebars.compile(details.message)(command.data);
  }

  var type = details.type;
  // the type key can screw with promptjs
  delete details.type;
  prompt[type](details, function(err, result){
    if (err) { return callback(err); }
    callback(null, result);
  });
}

prompt.confirm = function(options, callback){
  if (typeof options === 'string') {
    options = { message: options };
  }

  options.type = undefined;

  _.extend(options, {
    name: 'yesno',
    message: (options.message || 'confirm')+' (yes/no)',
    validator: /y[es]*|n[o]?/i,
    warning: 'Must respond yes or no'
  });

  prompt.prompt(options, function (err, result) {
    if (err) {
      return callback(err);
    } else if (['n', 'no'].indexOf(result.yesno.toLowerCase()) !== -1) {
      return callback('Confirmation failed');
    }
    callback(null, true);
  });
};

prompt.text = function(options, callback){
  options = options || {};
  options.name = options.name || 'text';
  // prompt doesn't like type: 'text' in this case
  options.type = undefined;

  prompt.prompt(options, function(err, result){
    if (err) { return callback(err); }
    callback(null, result.text.trim());
  });
};

prompt.prompt = function(options, callback){
  promptjs.start();
  promptjs.get(options, callback);
};
