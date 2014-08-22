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
exports = module.exports = Contrib;

/**
 * Module dependencies
 */
var _ = require('lodash');
var fs = require('fs');
var colors = require('colors');
var handlebars = require('handlebars');
var util = require('util');

/**
 * Project modules
 */
var pkg = require('../package.json');
var cfg = require('./config');
var log = require('./log');
var help = require('./help');
var OPTIONS = require('./options');
var Errors = require('./errors');
var Command = require('./command');


/**
 * Actions
 */
var exec = require('./exec');
var open = require('./open');
var request = require('./request');
var prompt = require('./prompt');

/**
 * Process config and command-line input to generate and run the command
 *
 * @param  {Object} config  A parsed json config
 * @param  {Array}  argv    The argv list from the command line input
 */
function Contrib(config, args, options){
  var command;

  options = options || {};

  // return a 'class' instance
  if (!(this instanceof Contrib)) {
    return new Contrib(config, args, options);
  }

  // if the init command is used initialize a config (contrib.json)
  if (args && args[0] === 'init') {
    return cfg.init();
  }

  // if there's no config, ask if a config should be created
  if (!config) {
    return cfg.confirmCreate();
  }

  // make the config accessible globally
  this.config = config;

  // store step response data for use in templates
  this.data = {};

  // make project data available to steps
  this.data.project = config.project;

  // expose the config to the data object
  this.data.config = config;

  // if just 'contrib' (no commands) show the main help
  if (args.length === 0) {
    return help.show(config);
  }

  try {
    command = Command.build(config, args, options);
  } catch (err) {
    if (err instanceof Errors.Config || err instanceof Errors.User) {
      log.error(err.message);
      return false;
    } else {
      throw err;
    }
  }

  if (command.options.help) {
    return help.show(command);
  }

  Command.execute(command, function(err, result){
    if (err) {
      return log.error(err);
    }

    log.writeln(result);
  });
}

// This used to be called whenever the install command was used,
// but trying to move away from that happening so magically.
// https://github.com/contrib/contrib/issues/9
// Leaving code here as a note of how they were written out until
// we find a better way to do requiremnts
function checkReqs(config, callback){
  if (!config.project || !config.project.requirements) {
    return callback();
  }

  log.writeln('\nPROJECT REQUIREMENTS\n'.underline);

  var output = '';
  config.project.requirements.forEach(function(req){
    if (typeof req === 'string') {
      output += '  • '+req+'\n';
    } else {
      output += '  • '+req.name;

      if (req.url) { output += ' - '+req.url; }
      if (req.desc) { output += ' - '+req.desc; }

      output += '\n';

      if (req.info)    { output += '     info: '+req.info+'\n'; }
      if (req.check)   { output += '     check: '+req.check+'\n'; }
      if (req.install) { output += '     install: '+req.install+'\n'; }
    }
  });

  log.writeln(output);

  prompt.confirm('Has all the required software been installed?', function(err){
    if (err) {
      return callback('Install all required software and then run the command again');
    }
    callback();
  });
}

function cautionNotice(callback){
  log.notice();
  prompt.confirm('Do you want to execute this command?', function(err){
    if (err) { return log.error(err); }
    callback();
  });
}
