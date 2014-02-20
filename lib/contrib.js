/*
 * contrib
 * https://github.com/contrib/contrib
 *
 * Copyright (c) 2014 Steve Heffernan
 * Licensed under the Apache license.
 */

'use strict';

var prompts = require('./prompts');
var cfg = require('./config');
var log = require('./log');
var pkg = require('../package.json');

var commander = require('commander');
var shell = require('shelljs');
var colors = require('colors');
// var open = require('open');
var _ = require('lodash');

var program;
var standardCommands = ['install', 'update', 'test'];
var stepResults = {};

module.exports = function(config, argv){
  if (!config) {
    if (argv[2] === 'init') {
      return cfg.init();
    } else {
      return cfg.check();
    }
  }

  // create a new root program otherwise tests pile up commands
  program = new commander.Command();
  program
    .version(pkg.version)
    .option('-s, --step [step]', 'Specify a single step to run')
    .option('-b, --begin [begin]', 'Specify a step to begin at')
    .option('-e, --end [end]', 'Specify a step to end at')
    .option('-w, --walk', 'Confirm each step before running')
    .option('-d, --dry-run', 'Print all steps but don not execute them');

  // add the init command for help info
  program.command('init')
    .description('Create a contrib.json in the current directory')
    .action(cfg.init);

  standardCommands.forEach(function(name){
    if (config[name]) {
      createCommand(program, name, config[name]);
    }
  });

  // build commands for each contribution type
  if (config.contributions) {
    Object.keys(config.contributions).forEach(function(name){
      createCommand(program, name, config.contributions[name]);
    });
  }

  program.parse(argv);

  // default to help if no commands
  if (program.args.length === 0) {
    program.help();
  }
};

function createCommand(program, name, config){
  var command;

  // single command
  if (config.steps) {
    command = program.command(name);
    command.description(config.desc);
    command.action(function(arg1){
      doSteps(name, config, arg1.parent);
    });

  // multi-command
  } else {
    command = program.command(name+'');
    command.description(config.desc);
    command.action(function(arg1, arg2){
      if (typeof arg1 !== 'string' || !config[arg1]) {
        command.help();
      } else {
        doSteps(name+':'+arg1, config[arg1], arg2.parent);
      }
    });

    // add subcommands for help info
    Object.keys(config).forEach(function(subName){
      if (config[subName].steps) {
        command.command(subName)
          .description(config[subName].desc);
      }
    });
  }
}

function confirmNotice(name, callback){
  if (name === 'install') {
    log.notice();
    prompts.confirm('Do you want to execute this command?', {}, function(err){
      if (err) { return log.error(err); }
      callback();
    });
  } else {
    callback();
  }
}

function doSteps(displayName, config, options){
  confirmNotice(displayName, function(){
    var steps = [];

    if (options.dryRun) {
      log.writeln(('DRY RUN OF '+displayName).underline);
    } else {
      log.writeln(('PERFORMING '+displayName).underline);
    }

    if (config.desc) {
      log.writeln(config.desc);
    }

    // get the subset of steps to run if specified
    config.steps.forEach(function(step, n){
      var stepNum = n+1+'';

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
    });

    if (steps.length === 0) {
      return log.error('There are no steps in the selected range');
    }

    var i = 0;
    function nextStep(){
      var step = steps[i];

      doStep(step, options, function(err){
        if (err) {
          log.error(err);
          log.error('FAILED ON STEP #'+steps[i].num);
          // console.log('Fix the issue and then run config --step='+(i+1));
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

  });
}

function doStep(step, options, callback){
  var text, action;

  options = options || {};

  var line = '\nSTEP '+step.num+'.';
  if (step.desc) {
    line += ' '+step.desc;
  }
  log.writeln(line.underline);

  function confirmStep(callback){
    if (options.walk) {
      prompts.confirm('Proceed?', {}, function(err){
        if (err) { return log.error('Step aborted'); }
        callback();
      });
    } else {
      callback();
    }
  }

  if (step.exec) {
    // plug in prompt values
    var cmd = _.template(step.exec, stepResults);
    log.writeln('$ '+cmd);
    log.writeln();
    confirmStep(function(){
      if (!options.dryRun) {
        var result = shell.exec(cmd);
        if (result && result.code > 0) {
          return callback('exec step failed');
        } else if (step.id) {
          stepResults[step.id] = result.output.trim();
        }
      }
      callback();
    });
  } else if (step.prompt) {
    doPrompt(step.prompt, callback);
  }
}

function doPrompt(info, callback){
  if (typeof info === 'string') {
    prompts.confirm(_.template(info, stepResults), {}, callback);
  } else if (info.type === 'text') {
    prompts.text(info.message, info, function(err, result){
      if (err) { return log.error(err); }
      // store result for use in other steps
      stepResults[info.id] = result.text;
      callback();
    });
  }
}

// var contrib = require('contrib')(config);
// or
// var contrib = require('contrib'); var myContrib = new contrib(config);
// var Contrib = function(config){
//   if (!(this instanceof arguments.callee)) {
//     return new contrib(config);
//   }
// };

// $ contrib start
// Type in the branch type you would like to start

//   • 'feature': used for features, non-urgent fixes and other enhancements
//   • 'hotfix': used for patches, urgent fixes
//   • 'release': used to create a new production/stable release

// Type of branch (feature): feature
// -----> Switching to 'master', the base branch of this branch type
// $ git checkout master
// Already on 'master'
// -----> Updating the master branch with upstream changes
// $ git pull upstream master
// From git://github.com/videojs/video.js
//  * branch            master     -> FETCH_HEAD
// Already up-to-date.
// -----> Creating the feature/test-blah branch starting at master
// $ git checkout -b feature/test-blah master
// Switched to a new branch 'feature/test-blah'
// -----> Pushing the feature/test-blah branch to origin
// $ git push origin feature/test-blah
// To git@github.com:heff/video-js.git
//  * [new branch]      feature/test-blah -> feature/test-blah
// -----> Tracking the feature/test-blah branch against origin/feature/test-blah
// $ git branch --set-upstream feature/test-blah origin/feature/test-blah
// Branch feature/test-blah set up to track remote branch feature/test-blah from origin.
// -----> Ready to start building your feature in branch feature/test-blah.


// contrib fork
// Submitting change in **feature/name** as a pull request (ctrl C to cancel)


// contrib init videojs/video.js
// contrib start
// contrib submit
// contrib feature accepted

// contrib init videojs/video.js
// ***
// The following process will:
//   1. Create a new directory named 'video.js'
//   1. Fork github.com/videojs/video.js into your github account
//   1. Clone github.com/videojs/video.js into the video.js directory
//   1. Run the following command(s): "grunt init"

// Are you sure you'd like to continue?
