/*
 * contrib
 * https://github.com/contrib/contrib
 *
 * Copyright (c) 2014 Steve Heffernan
 * Licensed under the Apache license.
 */

'use strict';

var fs = require('fs');
var log = require('./log');
var prompts = require('./prompts');

var config = module.exports = {};

config.check = function(){
  prompts.confirm('There is no contrib.json, would you like to create one?', {}, function(err){
    if (err) {
      return log.error('contrib process aborted');
    }
    config.init();
  });
};

config.init = function(){
  var newConfig = config.example;
  if (fs.existsSync('./contrib.json')) {
    log.error('A contrib.json already exists in this directory');
  } else {
    fs.writeFileSync('./contrib.json', JSON.stringify(newConfig, null, '  '), 'utf8');
    log.writeln('A contrib.json has been created in the current directory');
  }
};

config.example = {
  project: {
    name: '',
    owner: '',
    requirements: [
      {
        name: '',
        site: ''
      }
    ]
  },
  install: {
    steps: [
      {
        desc: 'Description of the first step',
        exec: 'FIRST INSTALL COMMAND HERE'
      }
    ]
  },
  update:{
    steps: []
  },
  test:{
    steps: []
  },
  feature: {
    desc: '',
    new: {
      steps: [
        {
          desc: 'First step for creating a '
        }
      ]
    },
    submit: {

    }
  },
  bug: {
    desc: 'Submit a bug report',
    steps: [
      {
        desc: 'Open the bug tracker',
        open: 'http://MY_BUG_TRACKER.com'
      }
    ]
  },
  request: {
    desc: 'Submit a feature request',
    steps: [
      {
        desc: 'Open wherever feature requests are made',
        open: 'http://MY_FEATURE_REQUESTS.com'
      }
    ]
  }
};
