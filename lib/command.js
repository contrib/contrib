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
 var Command = module.exports = {};

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

/**
 * Actions
 */
var Exec = require('./exec');
var open = require('./open');
var request = require('./request');
var Prompt = require('./prompt');

/**
 * Get the config for a command and build it
 *
 * @param {Object}        config  The main config object
 * @param {String|Object} args    The command line args or string name of commands
 * @param {Object}        options The set options from the command line flags
 *
 * @returns {Object}  The command object if one is found
 * @returns {Boolean} false if there is an error
 */
Command.build = function(config, commandNames, options){
  var command = {
    name: '',
    full: '',
    names: [],
    options: {},
    data: {
      project: config.project || config.meta,
      meta: config.meta
    },
    globalConfig: config
  };

  var currentName;
  var currentConfig = config;

  options = options || {};

  // allow for passing a string of 'command subcommand'
  // used with include steps
  if (typeof commandNames === 'string') {
    commandNames = commandNames.split(' ');
  }

  // translate any set options
  _.each(OPTIONS, function(details, name){
    command.options[name] = options[name] || options[details.short];
  });

  // step through the command names and find the command config to run
  while (currentName = commandNames.shift()) {

    // if this is a help command, trigger help for the currently built command
    // top level help has already been handled at this point
    if (currentName === 'help') {
      command.options.help = true;
      break;
    }

    // build the command names
    command.name = currentName;
    command.names.push(currentName);
    command.full = command.names.join(' ');

    // the current command config now becomes the config for this command name
    currentConfig = currentConfig[currentName];

    if (!currentConfig) {
      throw new Errors.User('The `'+command.full+'` command does not exist. Run `contrib help` to see the list of available commands.');
    }

    command.config = currentConfig;

    // config should be an object
    if (!_.isPlainObject(currentConfig)) {
      throw new Errors.Config('"'+command.full+'" is not defined as a command');
    }

    // add values from this config to data, and clone to prevent overwrites.
    // as the loop progresses, it overrides settings with the same key
    // in  higher configs
    _.merge(command.data, _.cloneDeep(currentConfig));

    // commands with steps shouldn't have subcommands because it kills the help message
    if (currentConfig.steps) {
      // if the next command name is help, set the help option
      if (commandNames[0] === 'help') {
        command.options.help = true;
      }
      break;
    }
  }

  // if displaying help, we have everything we need at this point
  if (command.options.help) {
    return command;
  }

  // merge the properties in the command config with the command
  // but prioritize the existing command values
  command = _.assign(_.cloneDeep(currentConfig), command);

  // expose additional args for use in commands
  // commandNames will always have what's leftover in the array
  // after we find a command with steps
  command.args = commandNames;

  if (command.isMultiCommand_) {
    command.options.help = true;
    return command;
  }

  if (!command.steps || command.steps.length === 0) {
    throw new Errors.Config('There are no steps defined for the `'+command.full+'` command');
  }

  command.steps = Command.buildSteps(command);

  return command;
};

/**
 * Get the full set of steps to run including from any embedded commands
 * @param  {Array} configSteps Steps from the config
 * @return {Array}             Steps to actually run
 */
Command.buildSteps = function(command){
  var steps = [];
  var stepNum = 0;

  // recursively add steps from included commands, e.g. "include": "update"
  var addSteps = function(configSteps){
    var i, step, include;

    for (i = 0; i < configSteps.length; i++) {
      step = configSteps[i];
      include = step.include;

      if (include) {
        // allow vars to be used in include statements
        include = handlebars.compile(include)(command.data);

        // build the included command
        include = Command.build(command.globalConfig, include);

        addSteps(include.steps);
      } else {
        step.num = ++stepNum;
        step.command = command;
        steps.push(step);
      }
    }
  };

  addSteps(command.steps);

  return steps;
};

/**
 * Get the subset of steps to run based on the begin/end/step options
 *
 * @param  {Array}  steps
 * @param  {Object} options
 * @return {Array} The subset of steps
 */
Command.getStepSubset = function(steps, options){
  var begin = 0;
  var end = steps.length;

  if (options.begin) {
    // all options need to be adjusted for a zero-based index
    begin = options.begin - 1;
  }

  if (options.end) {
    end = options.end - 1;
  }

  if (options.step) {
    begin = end = options.step - 1;
  }

  steps = steps.slice(begin, end);

  return steps;
};

Command.execute = function(command, callback){
  if (command.options['dry-run']) {
    log.writeln(('\nDRY RUN OF '+command.full).underline);
  } else {
    log.writeln(('\nEXECUTING '+command.full).underline);
  }

  command.stepSubset = Command.getStepSubset(command.steps, command.options);

  // write out description
  if (command.desc) {
    log.writeln(command.desc);
  }

  Command.doSteps(command, callback);
};

/**
 * Loop through each async step
 * @param  {Array}   steps
 * @param  {Function} callback
 */
Command.doSteps = function(command, callback){
  Command.doNextStep(command, stepComplete);

  function stepComplete(err, result){
    var step = command.currentStep;

    if (err) {
      log.error('FAILED ON STEP '+step.num+'. Fix any issues and then run "contrib '+command.full+' --begin '+step.num+'" to continue.');
      return callback(err);
    }

    if (step.id) {
      command.data[step.id] = result;
    }

    // increment i and do the next step
    if (command.currentStepIndex < command.stepSubset.length - 1) {
      Command.doNextStep(command, stepComplete);
    } else {
      callback(null, '\n\nIT\'S OVER!');
    }
  }
};

Command.doNextStep = function(command, callback){
  var desc, titleSource, title, step;

  var options = command.options;

  if (command.currentStep === undefined) {
    command.currentStepIndex = -1;
  }

  step = command.currentStep = command.stepSubset[++command.currentStepIndex];

  // TODO: find a better way to organize actions so we don't
  // have to keep adding checks here
  if (typeof step.prompt === 'string' && !step.desc) {
    step.desc = step.prompt;
  }

  if (typeof step.confirm === 'string' && !step.desc) {
    step.desc = step.confirm;
  }

  // generate the title
  title = handlebars.compile('\nSTEP {{num}}{{id}}. {{desc}}')({
    num: step.num,
    // on dry runs, display any id info so it's clear where id values are from
    id: (step.id && ' (ID: '+step.id+')') || '',
    // apply data values to description template vars
    desc: handlebars.compile(step.desc || '')(command.data, {noEscape: true})
  });

  log.writeln(title.underline);

  if (step.exec) {
    Exec.do(step, callback);
  } else if (step.prompt) {
    Prompt.doStep(step, callback);
  } else if (step.open) {
    open(step, callback);
  } else if (step.get) {
    request.doStep(step, callback);
  } else {
    callback('No action defined for this step');
  }
};

Command.confirmStep = function(bool, callback){
  if (bool) {
    Prompt.confirm('Proceed?', function(err){
      if (err) { return callback('Process aborted'); }
      callback();
    });
  } else {
    callback();
  }
};
