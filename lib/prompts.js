/*
 * contrib
 * https://github.com/contrib/contrib
 *
 * Copyright (c) 2014 Steve Heffernan
 * Licensed under the Apache license.
 */

'use strict';

var prompt = require('prompt');

var prompts = module.exports = {};

prompts.confirm = function(message, options, callback){
  prompt.start();
  prompt.get({
    name: 'yesno',
    message: message+' [y]es, [n]o',
    validator: /y[es]*|n[o]?/,
    warning: 'Must respond yes or no'
  }, function (err, result) {
    if (result.yesno === 'n') {
      return callback('Aborted');
    }
    callback();
  });
};

prompts.text = function(message, options, callback){
  prompt.start();
  prompt.get({
    name: 'text',
    message: message
  }, callback);
};
