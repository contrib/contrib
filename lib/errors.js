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
var Errors = module.exports = exports = {};

var util = require('util');

Errors.Config = function(message) {
  Error.call(this);
  this.message = message;
};

util.inherits(Errors.Config, Error);


Errors.User = function(message) {
  Error.call(this);
  this.message = message;
};

util.inherits(Errors.User, Error);
