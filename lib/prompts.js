/*
 * contrib
 * https://github.com/contrib/contrib
 *
 * Copyright (c) 2014 Steve Heffernan
 * Licensed under the Apache license.
 */

'use strict';

var prompt = require('prompt');
var _ = require('lodash');

var prompts = module.exports = {};

prompts.confirm = function(options, callback){
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

  prompts.prompt(options, function (err, result) {
    if (err) {
      return callback(err);
    } else if (['n', 'no'].indexOf(result.yesno.toLowerCase()) !== -1) {
      return callback('Confirmation failed');
    }
    callback(null, true);
  });
};

prompts.text = function(options, callback){
  options = options || {};
  options.name = 'text';
  // prompt doesn't like type: 'text' in this case
  options.type = undefined;

  prompts.prompt(options, function(err, result){
    if (err) { return callback(err); }
    callback(null, result.text.trim());
  });
};

prompts.prompt = function(options, callback){
  prompt.start();
  prompt.get(options, callback);
};
