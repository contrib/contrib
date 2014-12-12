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
exports = module.exports = contrib;

/**
 * Module dependencies
 */
var _ = require('lodash');
var fs = require('fs');
var colors = require('colors');
var handlebars = require('handlebars');
var util = require('util');
var http = require('http');

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
var defaultConfig = require('./default-config.json');
var gitConfig = require('git-config');

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
function contrib(config, commands, options){
  var command;

  commands = commands || [];
  options = options || {};

  // if the init command is used initialize a config (contrib.json)
  if (commands[0] === 'init') {
    return cfg.init();
  }

  // if the install command is used fetch the contrib.json
  if (commands[0] === 'install' && commands[1]) {
    var orgProj;

    // Check for 'org/project'
    if (/^[^\/\s]+\/[^\/\s]+$/.test(commands[1])) {
      orgProj = commands[1];
      commands[1] = 'https://raw.githubusercontent.com/'+orgProj+'/master/contrib.json';
    }

    return cfg.get(commands[1], function(err, result){
      if (err) {
        return log.error(err);
      }

      if (!result) {
        if (orgProj) {
          log.warn('No contrib.json was found. Run the `contrib init` command to create a new contrib.json in the project.');
          log.warn('Using the default contrib.json instead.');
          result = defaultConfig;
          result.meta.org = orgProj.split('/')[0];
          result.meta.name = orgProj.split('/')[1];
          result.meta.repo = 'https://github.com/'+orgProj;
        } else {
          return log.error('No contrib.json was found. Run the `contrib init` command to create a new contrib.json in the project.');
        }
      }

      contrib(result, ['install'], options);
    });
  }

  // if there's no config, ask if a config should be created
  if (!config) {
    // Beginnings of the default config usage for non-install commands
    // var gitcfg = gitConfig.sync('./.git/config'); // can pass explit file if you want as well
    //
    // if (gitcfg && gitcfg['remote "origin"'] && gitcfg['remote "origin"'].url) {
    //
    // }
    //
    // console.log(gitcfg['remote "origin"'].url);
    //
    // config = defaultConfig;

    return cfg.confirmCreate();
  }

  config = cfg.normalize(config);

  // if just 'contrib' (no commands) show the main help
  if (commands.length === 0 || commands[0] === 'help') {
    return help.show(config);
  }

  try {
    command = Command.build(config, commands, options);
  } catch (err) {
    if (err instanceof Errors.Config || err instanceof Errors.User) {
      return log.error(err.message);
    } else {
      throw err;
    }
  }

  if (command.options.help) {
    return help.showCommand(command);
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
