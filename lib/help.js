/*
 * contrib
 * https://github.com/contrib/contrib
 *
 * Copyright (c) 2014 Steve Heffernan
 * Licensed under the Apache license.
 */

'use strict';

var handlebars = require('handlebars');
var _ = require('lodash');
var fs = require('fs');

var log = require('./log');
var Config = require('./config');
var OPTIONS = require('./options');

/**
 * Export the main function
 */
var help = module.exports = exports = {};

/**
 * Templates
 */
var helpTemplate = fs.readFileSync(__dirname+'/../templates/help.hbs', 'utf8');

/**
 * Write out the help information
 * @param  {Object} config The contrib or command config
 */
help.show = function(config, command){
  // add a space after the command name if there is one
  command = (command && command+' ') || '';

  var templateData = {
    cmdLines: getCommandLines(config),
    command: command,
    optLines: getOptionLines()
  };

  log.write(handlebars.compile(helpTemplate)(templateData));
};

help.showCommand = function(command){
  help.show(command.config, command.full);
};

function getCommandLines(config){
  var longestCmd = 0;
  var cmds = [];
  var cmdLines = [];
  var addCmd = function(name, desc){
    longestCmd = Math.max(longestCmd, name.length);
    cmds.push({
      name: name,
      desc: desc || ''
    });
  };

  _.each(config, function(val, name){
    if (name === 'project') { return; }

    if (Config.isCommandConfig(val)) {
      if (val.private) { return; }

      if (Config.isMultiCommandConfig(val)) {
        name += ' [command]';
      }
      addCmd(name, val.desc);
    }
  });

  cmds.forEach(function(cmd){
    var spaces = new Array(6+longestCmd-cmd.name.length).join(' ');
    cmdLines.push(cmd.name+spaces+cmd.desc);
  });

  return cmdLines;
}

function getOptionLines(){
  var opts = [];
  var optLines = [];
  var longestOpt = 0;

  _.each(OPTIONS, function(val, name){
    var flags = getOptionFlags(name, val);
    longestOpt = Math.max(longestOpt, flags.length);
    opts.push({
      flags: flags,
      desc: val.desc || ''
    });
  });

  opts.forEach(function(opt){
    var spaces = new Array(6+longestOpt-opt.flags.length).join(' ');
    optLines.push(opt.flags+spaces+opt.desc);
  });

  return optLines;
}

function getOptionFlags(name, details){
  var flags = '';

  if (details.short) {
    flags += ('-'+details.short+', ');
  }

  flags += ('--'+name);

  if (details.arg) {
    flags += (' ['+details.arg+']');
  }

  return flags;
}
