/*
 * contrib
 * https://github.com/contrib/contrib
 *
 * Copyright (c) 2014 Steve Heffernan
 * Licensed under the Apache license.
 */

'use strict';

var config = module.exports = {};

var _ = require('lodash');
var fs = require('fs');
var log = require('./log');
var util = require('util');
var prompt = require('./prompt');
var request = require('./request');

config.init = function(){
  var newConfig = config.example;
  if (fs.existsSync('./contrib.json')) {
    log.error('A contrib.json already exists in this directory');
  } else {
    fs.writeFileSync('./contrib.json', JSON.stringify(newConfig, null, '  '), 'utf8');
    log.writeln('A contrib.json has been created in the current directory');
  }
};

config.confirmCreate = function(){
  prompt.confirm('There is no contrib.json, would you like to create one?', function(err){
    if (err) {
      return log.error('contrib process aborted');
    }
    config.init();
  });
};

config.normalize = function(configObj, parent){
  var newConfig = {};
  var isTop = !parent;

  _.forEach(configObj, function(val, key){
    if (isTop) {
      // if it's project or meta at the top level, pass it through as is
      if (key === 'project' || key === 'meta') {
        newConfig[key] = val;
        return;
      }

      // if it's a string at the top level, it's a single step command
      if (typeof val === 'string') {
        newConfig[key] = {
          steps: normalizeSteps([val])
        };
        return;
      }

      // if it's top level and an array it's a list of steps
      if (Array.isArray(val)) {
        newConfig[key] = {
          steps: normalizeSteps(val)
        };
        return;
      }
    } else {
      // the main config should not have steps
      if (key === 'steps') {
        newConfig[key] = normalizeSteps(val);
        // inform the command object if it's a command
        newConfig.isCommand_ = true;
        return;
      }
    }

    if (_.isPlainObject(val)) {
      // normalize child objects
      newConfig[key] = config.normalize(val, newConfig);

      // inform the config object if it's a multi-command
      if (newConfig[key].isCommand_ || newConfig[key].isMultiCommand_) {
        newConfig.isMultiCommand_ = true;
      }
      return;
    }

    // pass through everything else
    newConfig[key] = val;
  });

  return newConfig;
};

function normalizeSteps(steps){
  var newSteps = [],
      tempStep;

  if (!Array.isArray(steps)) {
    throw new config.ConfigError('The steps key should always be an array');
  }

  steps.forEach(function(step){
    if (typeof step === 'string') {
      newSteps.push({ exec: step });
      return;
    }

    if (Array.isArray(step)) {
      tempStep = {
        exec: step[0]
      };

      if (step[1]) {
        tempStep.desc = step[1];
      }

      if (step[2]) {
        tempStep.id = step[2];
      }

      newSteps.push(tempStep);
      return;
    }

    newSteps.push(step);
  });

  return newSteps;
}

config.isCommandConfig = function(cmdConfig){
  return config.isSingleCommandConfig(cmdConfig) || config.isMultiCommandConfig(cmdConfig);
};

config.isMultiCommandConfig = function(cmdConfig){
  if (!_.isPlainObject(cmdConfig)) {
    return false;
  } else {
    return _.any(cmdConfig, config.isSingleCommandConfig);
  }
};

/**
 * check if a config is for a single command
 * @param  {*}  cmdConfig    The config to check
 * @return {Boolean}
 */
config.isSingleCommandConfig = function(cmdConfig){
  return _.isPlainObject(cmdConfig) && cmdConfig.steps;
};

config.get = function(url, callback){
  request.get(url, callback);
};

config.example = {
  "meta": {
    "project": {
      "name": "my-project",
      "requirements": [
        {
          "name": "example requirement",
          "home": "http://example.com"
        }
      ]
    }
  },
  "install": {
    "desc": "Download and set up the project",
    "steps": [
      { "exec": "echo First install step!", "desc": "Example first install step" },
      { "include": "setup" }
    ]
  },
  "setup": {
    "desc": "Set up version control and install dependencies",
    "steps": []
  },
  "update": {
    "desc": "Get the latest copy of the code",
    "steps": []
  },
  "test": {
    "desc": "Run programmatic tests",
    "steps": []
  }
};
