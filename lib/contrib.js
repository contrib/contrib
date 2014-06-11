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

  // store step response data for use in templates
  this.data = {};

  // make project data available to steps
  this.data.project = config.project;

  // if just 'contrib' show the main help
  if (args._.length === 0) {
    return help(config);
  }

  var contrib = this;
  this.getCommand(args, function(err, command){
    if (err) {
      log.error(err);
    }

    command.data = contrib.data;

    if (command.name === 'help' || !command.config.steps) {
      return help(command);
    }

    contrib.doCommand(command, function(err, result){
      if (err) {
        return log.error();
      }
      log.write(result);
    });
  });
}

/**
 * Get the appropriate config for a string or array of command names
 *
 * The callback will always have a command returned, so we can show the
 * right help using the command.config
 *
 * @param  {String|Object} args The command line args or string name of commands
 * @param  {Function}      callback
 */
Contrib.prototype.getCommand = function(args, callback){
  var name;
  var commandNames = args._;
  var command = {
    name: '',
    full: '',
    config: this.config,
    options: {}
  };

  // allow for passing a string of 'command subcommand'
  if (typeof args === 'string') {
    commandNames = args.split(' ');
  }

  // translate any set options
  _.each(OPTIONS, function(details, name){
    command.options[name] = args[name] || args[details.short];
  });

  // currently need access to options on command. Should be remove shortly.
  this.options = command.options;

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

Contrib.prototype.doCommand = function(command, callback){
  if (command.options['dry-run']) {
    log.writeln(('DRY RUN OF '+command.full).underline);
  } else {
    log.writeln(('PERFORMING '+command.full).underline);
  }

  // command description
  if (command.config.desc) {
    log.writeln(command.config.desc);
  }

  var contrib = this;
  this.getSteps(command, function(err, steps){
    if (err) {
      return callback(err);
    } else if (steps.length === 0) {
      return callback('There are no steps in the selected range');
    }

    command.steps = steps;
    contrib.doSteps(command, callback);
  });
};

/**
 * Get the full set of steps to run including from any embedded commands
 * @param  {Array} configSteps Steps from the config
 * @return {Array}             Steps to actually run
 */
Contrib.prototype.getSteps = function(command, callback){
  var steps = [];
  var stepNum = 0;
  var contrib = this;
  var error;

  // recursively add steps from included commands, e.g. "include": "update"
  (function addSteps(configSteps){
    configSteps.forEach(function(step){
      if (step.contrib || step.include) {
        contrib.getCommand(step.contrib || step.include, function(err, command){
          if (err) {
            error = err;
          } else  {
            addSteps(command.config.steps);
          }
        });
      } else {
        step = contrib.normalizeStep(step);
        step.num = ++stepNum;
        step.command = command;
        steps.push(step);
      }
    });
  })(command.config.steps);

  if (error) {
    return callback(error);
  }

  // get the subset of steps based on the begin/end/step options
  steps = this.getStepSubset(steps, command.options);

  callback(null, steps);
};

Contrib.prototype.normalizeStep = function(step){
  if (typeof step === 'string') {
    step = {
      exec: step
    };
  }

  return step;
};

/**
 * Get the subset of steps to run based on the begin/end/step options
 *
 * @param  {Array}  steps
 * @param  {Object} options
 * @return {Array} The subset of steps
 */
Contrib.prototype.getStepSubset = function(steps, options){
  var begin = 0;
  var end = steps.length;

  if (options.begin) {
    begin = options.begin-1;
  }

  if (options.end) {
    end = options.end-1;
  }

  if (options.step) {
    begin = end = options.step-1;
  }

  steps = steps.slice(begin, end);

  return steps;
};

/**
 * Loop through each async step
 * @param  {Array}   steps
 * @param  {Function} callback
 */
Contrib.prototype.doSteps = function(command, callback){
  var i = 0;
  var step = command.steps[i];
  var contrib = this;

  this.doStep(step, command.options, stepComplete);

  function stepComplete(err, result){
    if (err) {
      log.error('FAILED ON STEP '+step.num+'. Fix any issues and then run "contrib '+command.full+' --begin '+step.num+'" to continue.');
      return callback(err);
    }

    if (step.id) {
      contrib.data[step.id] = result;
    }

    // increment i and do the next step
    if (++i < command.steps.length) {
      step = command.steps[i];
      contrib.doStep(step, command.options, stepComplete);
    } else {
      callback(null, '\n\nIT\'S OVER!');
    }
  }
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
    callback('No action defined for this step');
  }

  // var action = new actionClass(step);

  // if (options['dry-run']) {
  //   action.dryRun();
  // } else {
  //   action.describe();

  //   if (options.interactive) {
  //     prompt.confirm('Proceed?', function(err){
  //       if (err) { return callback('Process aborted'); }
  //       action.do(callback);
  //     });
  //   } else {
  //     action.do(callback);
  //   }
  // }
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
