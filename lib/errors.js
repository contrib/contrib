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

function createError(name, defaultMsg) {
  var newErr = function CustomError(message, custom) {
    Error.captureStackTrace(this, this.constructor);
    this.message = message || defaultMsg;

    custom = custom || {};
    for (var key in custom) {
      if (custom.hasOwnProperty(key)) {
        this[key] = custom[key];
      }
    }
  };

  util.inherits(newErr, Error);

  newErr.prototype.name = name;
  newErr.prototype.constructor = newErr;

  return newErr;
}

Errors.Config = createError('ConfigError');
Errors.User = createError('UserError');
Errors.Exec = createError('ExecError', 'Exec failed');
