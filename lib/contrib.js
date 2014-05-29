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
var parseArgs = require('minimist');
var handlebars = require('handlebars');

/**
 * Project modules
 */
var pkg = require('../package.json');
var cfg = require('./config');
var log = require('./log');
var help = require('./help');

var OPTIONS = require('./options');

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
function Contrib(config, argv){
  var args, options;

  // return a 'class' instance
  if (!(this instanceof Contrib)) {
    return new Contrib(config, argv);
  }

  // first two args are always [node, contrib]
  args = parseArgs(argv.slice(2));

  // no config
  if (!config) {
    if (args._[0] === 'init') {
      // initialize a config (contrib.json)
      return cfg.init();
    } else {
      // ask if a config should be created
      return cfg.check();
    }
  }

  // make the config accessible globally
  this.config = config;

  // translate any set options
  options = this.options = {};
  _.each(OPTIONS, function(details, name){
    options[name] = args[name] || args[details.short];
  });

  // store step response data for use in templates
  this.data = {};

  // make project data available to steps
  this.data.project = config.project;

  // store command specific info
  this.command = {};

  // if just 'contrib' show the main help
  if (args._.length === 0) {
    return help(config);
  }

  var contrib = this;
  this.getCommand(args._, function(err, command){
    if (err) {
      log.error(err);
    }

    if (command.name === 'help' || !command.config.steps) {
      return help(command);
    }

    contrib.command = command;
    contrib.doCommand(contrib.command.config);
  });
}

/**
 * Get the appropriate config for a string or array of command names
 *
 * The callback will always have a command returned, so we can show the
 * right help using the command.config
 *
 * @param  {String|Array} commandNames
 * @param  {Function}     callback
 */
Contrib.prototype.getCommand = function(commandNames, callback){
  var name;
  var command = {
    name: '',
    full: '',
    config: this.config
  };

  if (typeof commandNames === 'string') {
    commandNames = commandNames.split(' ');
  }

  // expose additional args for use in commands
  // commandNames will always have what's leftover in the array
  // after we find a command with steps
  command.args = commandNames;

  // step through the command names and find the command config to run
  while (name = commandNames.shift()) {
    command.name = name;

    // Until we know this name represent a real command, command.config
    // will continue to point at the parent config.
    // This allows us to show the help for the parent config if this command
    // doesn't exist.
    if (name === 'help') {
      return callback(null, command);
    }

    if (!command.config[name]) {
      return callback('The `'+name+'` command is not defined', command);
    }

    // config should be an object or an array
    if (typeof command.config[name] !== 'object') {
      return callback('"'+name+'" is defined but not as a command', command);
    }

    // we now know this is a command so add it to the full name
    if (command.full) {
      // add a space except for before the first name
      command.full += ' ';
    }
    command.full += name;
    // the current config now becomes the config for this command name
    command.config = command.config[name];

    // if this command has steps, it's the one to use
    if (command.config.steps) {
      break;
    }
  }

  // if we get through the loop without finding a command with steps
  // it will show the help for the last command that had a config
  callback(null, command);
};

Contrib.prototype.doCommand = function(cmdConfig){
  var steps;
  var options = this.options;

  if (options['dry-run']) {
    log.writeln(('DRY RUN OF '+this.command.full).underline);
  } else {
    log.writeln(('PERFORMING '+this.command.full).underline);
  }

  steps = this.getSteps(cmdConfig.steps);

  // command description
  if (cmdConfig.desc) {
    log.writeln(cmdConfig.desc);
  }

  if (steps.length === 0) {
    return log.error('There are no steps in the selected range');
  }

  // loop through each asynchronous step
  var i = 0;
  var step = steps[i];
  var contrib = this;
  this.doStep(step, options, stepComplete);

  function stepComplete(err, result){
    if (err) {
      log.error(err);
      log.error('FAILED ON STEP '+step.num+'. Fix any issues and then run "contrib '+contrib.command.full+' --begin '+step.num+'" to continue.');
      return;
    }

    if (step.id) {
      contrib.data[step.id] = result;
    }

    // increment i and do the next step
    if (++i < steps.length) {
      step = steps[i];
      contrib.doStep(step, options, stepComplete);
    } else {
      log.writeln();
      log.writeln('IT\'S OVER!');
    }
  }
};

/**
 * Get the subset of steps to run if specified
 * @param  {Array} configSteps Steps from the config
 * @return {Array}             Steps to actually run
 */
Contrib.prototype.getSteps = function(configSteps){
  var steps = [];
  var stepNum = 0;
  var options = this.options;
  var contrib = this;

  // create a recursive function to add steps from included commands
  (function addSteps(configSteps){
    configSteps.forEach(function(step){
      // check for an included contrib command
      if (step.contrib || step.include) {
        // get the included command steps
        contrib.getCommand(step.contrib || step.include, function(err, command){
          addSteps(command.config.steps);
        });
      } else {
        stepNum++;
        // run a specific step
        if (options.step && options.step !== stepNum) { return; }
        // begin at a specific step
        if (options.begin && stepNum < options.begin) { return; }
        // end at a specific step
        if (options.end && stepNum > options.end) { return; }

        // steps that are just strings are exec
        if (typeof step === 'string') {
          step = {
            exec: step
          };
        }

        step.num = stepNum;
        steps.push(step);
      }
    });
  })(configSteps);

  return steps;
};

Contrib.prototype.doStep = function(step, options, callback){
  var desc, titleSource, title;
  options = options || {};

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
    desc: handlebars.compile(step.desc || '')(this.data, {noEscape: true})
  });

  log.writeln(title.underline);

  if (step.exec) {
    exec(this, step, callback);
  } else if (step.confirm) {
    step.prompt = { type: 'confirm', message: step.confirm };
    prompt(this, step, callback);
  } else if (step.prompt) {
    prompt(this, step, callback);
  } else if (step.open) {
    open(this, step, callback);
  } else if (step.get) {
    request.get(this, step, callback);
  } else {
    log.writeln('No action defined for this step');
    callback();
  }
};

Contrib.prototype.confirmStep = function(bool, callback){
  if (bool) {
    prompt.confirm('Proceed?', function(err){
      if (err) { return callback('Process aborted'); }
      callback();
    });
  } else {
    callback();
  }
};


function checkReqs(config, callback){
  if (!config.project || !config.project.requirements) {
    return callback();
  }

  log.write('\nPROJECT REQUIREMENTS\n\n'.underline);

  var reqs = config.project.requirements;
  reqs.forEach(function(req){
    if (typeof req === 'string') {
      log.writeln('  • '+req);
    } else {
      log.write('  • '+req.name);
      if (req.desc) { log.write(' - '+req.desc); }
      log.writeln();

      if (req.info)    { log.writeln('     info: '+req.info); }
      if (req.check)   { log.writeln('     check: '+req.check); }
      if (req.install) { log.writeln('     install: '+req.install); }
    }
  });

  log.writeln();

  prompt.confirm('Has all the required software been isntalled?', function(err){
    if (err) {
      return log.error('Install all required software and then run `contrib install` again');
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
