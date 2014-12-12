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
var request = module.exports = exports = {};

var url = require('url');
var http = require('http');
var https = require('https');
var handlebars = require('handlebars');
var log = require('./log');
var Command = require('./command');

request.doStep = function(step, callback){
  var urlStr, protocol;

  if (typeof step.get === 'string') {
    urlStr = step.get;
  } else {
    urlStr = step.get.url;
  }

  if (step.command.options['dry-run']) {
    log.writeln('GET: '+urlStr);
    return callback();
  }

  urlStr = handlebars.compile(urlStr)(step.command.data);
  log.writeln('GET: '+urlStr);

  var requestOptions = url.parse(urlStr);
  if (requestOptions.protocol && requestOptions.protocol === 'https:') {
    protocol = https;
  } else {
    protocol = http;
  }

  // User agent required for Github
  requestOptions.headers = {
    'user-agent': 'contrib-cli'
  };

  Command.confirmStep(step.command.options.interactive, function(err){
    if (err) { return callback(err); }

    protocol.get(requestOptions, function(res) {
      var dataStr = '';
      res.setEncoding('utf8');

      res.on('data', function(d) {
        dataStr += d;
      });

      res.on('end', function(){
        callback(null, JSON.parse(dataStr));
      });

    }).on('error', function(e) {
      callback(e);
    });
  });
};

request.get = function(urlStr, callback){
  var protocol;
  var requestOptions = url.parse(urlStr);

  if (requestOptions.protocol && requestOptions.protocol === 'https:') {
    protocol = https;
  } else {
    protocol = http;
  }

  // User agent required for Github
  requestOptions.headers = {
    'user-agent': 'contrib-cli'
  };

  protocol.get(requestOptions, function(res) {
    var dataStr = '';
    res.setEncoding('utf8');

    if (res.statusCode >= 400) {
      return callback(null, null, res);
    }

    res.on('data', function(d) {
      dataStr += d;
    });

    res.on('end', function(){
      callback(null, JSON.parse(dataStr));
    });

  }).on('error', function(e) {
    callback(e);
  });
};
