/*
 * contrib
 * https://github.com/contrib/contrib
 *
 * Copyright (c) 2014 Steve Heffernan
 * Licensed under the Apache license.
 */

'use strict';

/**
 * Module dependencies
 */
var parseArgs = require('minimist');
var commander = require('commander');
var Option = commander.Option;
var shell = require('shelljs');
var colors = require('colors');
var open = require('open');
var fs = require('fs');
var _ = require('lodash');

var pkg = require('../package.json');
var prompts = require('./prompts');
var cfg = require('./config');
var log = require('./log');
var helpTemplate = fs.readFileSync(__dirname+'/help.template', 'utf8');

/**
 * Global references
 */
var program;
var globalConfig;

/**
 * Core commands list for every project
 */
var standardCommands = ['install', 'update', 'test'];

/**
 * Store step return values and project data
 */
var data = {};

/**
 * Default descriptions for core commands
 */
var DESCRIPTIONS = {
  install: 'Set up version control and install dependencies',
  update: 'Get the latest changes to the project',
  test: 'Perform automated tests'
};

/**
 * Options for every command
 */
var OPTIONS = {
  help:        { short:'h',             desc:'Output usage information' },
  interactive: { short:'i',             desc:'Confirm each step before executing it' },
  'dry-run':   { short:'d',             desc:'Output all steps but do not execute them' },
  step:        { short:'s', arg:'step', desc:'Specify a single step to execute' },
  begin:       { short:'b', arg:'step', desc:'Specify a step to begin at' },
  end:         { short:'e', arg:'step', desc:'Specify a step to stop after' },
  version:     { short:'v',             desc:'Output the contrib version number' }
};

/**
 * Export the main function
 */
exports = module.exports = contrib;

/**
 * Process config and command-line input to generate and run the command
 *
 * @param  {Object} config  A parsed json config
 * @param  {Array}  argv    The argv list from the command line input
 */
function contrib(config, argv){
  var args, cmdName, cmdConfig, subCmdName;

  // first two args are always [node, contrib]
  args = parseArgs(argv.slice(2));
  cmdName = args._[0];
  subCmdName = args._[1];

  // return console.log(args);

  // no config
  if (!config) {
    if (cmdName === 'init') {
      // initialize a config (contrib.json)
      return cfg.init();
    } else {
      // ask if a config should be created
      return cfg.check();
    }
  }

  // make the main config available everywhere
  globalConfig = config;

  // make project data available to steps
  data.project = config.project;

  // update standard commands with default descriptions
  _.each(standardCommands, function(name){
    if (config[name]) {
      config[name].desc = config[name].desc || DESCRIPTIONS[name] || '';
    }
  });

  var options = {};
  _.each(OPTIONS, function(details, name){
    options[name] = args[name] || args[details.short];
  });

  // show help
  if (!cmdName || cmdName === 'help') {
    return help(config);
  // show command help
  } else if (cmdName && (options.help || subCmdName === 'help')) {
    return help(config, cmdName);
  }

  // standard commmands
  if (standardCommands.indexOf(cmdName) !== -1) {
    if (cmdName === 'install') {
      cautionNotice(function(){
        checkReqs(config, function(){
          doCommand(cmdName, config[cmdName], args);
        });
      });
    } else {
      doCommand(cmdName, config[cmdName], args);
    }
  // contribution commands
  } else if (config['contributions'] && config['contributions'][cmdName]) {
    cmdConfig = config['contributions'][cmdName];

    if (cmdConfig.steps) {
      // expose additional args for use in commands
      data.args = args._.slice(1);
      doCommand(cmdName, cmdConfig, options);
    // subcommands
    } else if (subCmdName && cmdConfig[subCmdName]) {
      data.arg1 = args._[2];
      data.args = args._.slice(2);
      doCommand(cmdName+' '+subCmdName, cmdConfig[subCmdName], options);
    } else {
      help(config, cmdName);
    }
  } else {
    log.error('No "'+cmdName+'" command found');
    help(config);
  }
}

function doCommand(displayName, config, options){
  if (!config) {
    log.error('The '+displayName+' command is not defined');
  } else if (!config.steps) {
    log.error('The '+displayName+' command has no steps');
  } else {
    doSteps(displayName, config, options);
  }
}

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

  prompts.confirm('Has all the required software been isntalled?', function(err){
    if (err) {
      return log.error('Install all required software and then run `contrib install` again');
    }
    callback();
  });
}

function cautionNotice(callback){
  log.notice();
  prompts.confirm('Do you want to execute this command?', function(err){
    if (err) { return log.error(err); }
    callback();
  });
}

function doSteps(displayName, config, options){
  var steps = [];

  if (options['dry-run']) {
    log.writeln(('DRY RUN OF '+displayName).underline);
  } else {
    log.writeln(('PERFORMING '+displayName).underline);
  }

  if (config.desc) {
    log.writeln(config.desc);
  }

  // get the subset of steps to run if specified
  var stepNum = 0;
  getSteps(config.steps);

  function getSteps(steps){
    steps.forEach(function(step){
      var contribArgs, cmdConfig, subCmdName, cmdName;

      // check for an embedded contrib command
      if (step.contrib) {
        // get the contrib commmand names
        contribArgs = step.contrib.split(' ');
        cmdName = contribArgs[0];
        subCmdName = contribArgs[1];

        // check if it's a core command
        if (globalConfig[cmdName]) {
          cmdConfig = globalConfig[cmdName];

        // check if it's a contribution command
        } else if (globalConfig['contributions'] && globalConfig['contributions'][cmdName]) {
          cmdConfig = globalConfig['contributions'][cmdName];
        } else {
          log.warn('Could not find "'+cmdName+'"" contrib command defined in step '+(stepNum+1));
        }

        // check if there's a subcommand
        if (subCmdName) {
          cmdConfig = cmdConfig[subCmdName];
        }

        // get the embedded command steps
        getSteps(cmdConfig.steps);
      } else {
        addStep(step);
      }
    });
  }

  function addStep(step, n){
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

  if (steps.length === 0) {
    return log.error('There are no steps in the selected range');
  }

  var i = 0;
  function nextStep(){
    var step = steps[i];

    doStep(step, options, function(err){
      if (err) {
        log.error(err);
        log.error('FAILED ON STEP '+steps[i].num+'. Fix any issues and then run "contrib '+displayName+' --begin '+steps[i].num+'" to continue.');
        return;
      }

      if (++i < steps.length) {
        nextStep();
      } else {
        log.writeln();
        log.writeln('IT\'S OVER!');
      }
    });
  }
  nextStep();
}

function doStep(step, options, callback){
  var text, action;
  options = options || {};

  if (typeof step.prompt == 'string' && !step.desc) {
    step.desc = step.prompt;
  }

  log.writeln(_.template('\nSTEP <%= num %><%= id %>. <%= desc %>', {
    num: step.num,
    // on dry runs, display any id info so it's clear where id values are from
    id: (options['dry-run'] && step.id && ' (ID: '+step.id+')') || '',
    // apply data values to description template vars
    desc: _.template(step.desc || '', data),
  }).underline);

  if (step.exec) {
    doExec(step, options, callback);
  } else if (step.confirm) {
    step.prompt = { type: 'confirm', message: step.confirm };
    doPrompt(step, options, callback);
  } else if (step.prompt) {
    doPrompt(step, options, callback);
  } else if (step.open) {
    doOpen(step, options, callback);
  } else {
    log.writeln('No action defined for this step');
    callback();
  }
}

// when in interactive mode we want to confirm every step (except prompts)
function confirmStep(bool, callback){
  if (bool) {
    prompts.confirm('Proceed?', function(err){
      if (err) { return callback('Process aborted'); }
      callback();
    });
  } else {
    callback();
  }
}

function doExec(step, options, callback){
  var cmd = _.template(step.exec, data); // add stored values

  // display the command
  log.writeln('$ '+cmd);

  confirmStep(options.interactive, function(err){
    if (err) { return callback(err); }

    // if this is a dry run, don't execute, but store a placeholder value
    if (options['dry-run']) {
      if (step.id) {
        data[step.id] = '['+step.id+']';
      }
    } else {
      var result = shell.exec(cmd);
      if (result) {
        if (result.code > 0) {
          return callback(step.fail || 'exec failed');
        } else if (step.id) {
          data[step.id] = result.output.trim();
        }
      }
    }
    callback();
  });
}

function doPrompt(step, options, callback){
  var details = step.prompt;

  // allow for just passing in a string for confirm
  if (typeof details === 'string') {
    details = {
      type: 'text',
      message: details
    };
  }

  // apply the data to any template vars in the message
  if (details.message) {
    details.message = _.template(details.message, data);
  }

  function getResult(err, result){
    if (err) { return callback(err); }

    // store result for use in other steps
    if (step.id) {
      data[step.id] = result;
    }
    callback();
  }

  if (options['dry-run']) {
    log.writeln('prompt: '+(details.message || details.type)+': (you will be asked to provide info)');
    getResult(null, '['+step.id+']');
  } else {
    var type = details.type;
    delete details.type;
    prompts[type](details, getResult);
  }
}

function doOpen(step, options, callback){
  var url = _.template(step.open, data);
  log.writeln('open: '+url);

  confirmStep(options.interactive, function(err){
    if (err) { return callback(err); }

    if (!options['dry-run']) {
      open(url);
    }
  });
}

function help(config, command){
  var longestCmd = 0;
  var longestOpt = 0;
  var cmds = [];
  var cmdLines = [];
  var opts = [];
  var optLines = [];
  var addCmd = function(name, desc){
    longestCmd = Math.max(longestCmd, name.length);
    cmds.push({
      name: name,
      desc: desc || ''
    });
  };

  // get commands for help
  if (command) {
    // subcommands
    _.each(config['contributions'][command], function(val, name){
      if (typeof val === 'object' && val.steps) {
        addCmd(name, val.desc);
      }
    });
  } else {
    // standard commands
    _.each(standardCommands, function(name){
      if (config[name]) {
        addCmd(name, config[name].desc);
      }
    });

    // add a blank line separator between standard and contributons
    addCmd('');

    // contribution commands
    _.each(config['contributions'], function(val, name){
      addCmd(name, val.desc);
    });
  }

  cmds.forEach(function(cmd){
    var spaces = new Array(6+longestCmd-cmd.name.length).join(' ');
    cmdLines.push(cmd.name+spaces+cmd.desc);
  });

  _.each(OPTIONS, function(val, name){
    var flags = getFlags(name, val);
    longestOpt = Math.max(longestOpt, flags.length);
    opts.push({
      flags: flags,
      desc: val.desc || ''
    });
  });

  function getFlags(name, details){
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

  opts.forEach(function(opt){
    var spaces = new Array(6+longestOpt-opt.flags.length).join(' ');
    optLines.push(opt.flags+spaces+opt.desc);
  });

  var templateData = {
    cmdLines: cmdLines,
    command: (command) ? command+' ' : '',
    optLines: optLines
  };

  log.write(_.template(helpTemplate, templateData));
}
