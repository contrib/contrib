/*
 * contrib
 * https://github.com/contrib/contrib
 *
 * Copyright (c) 2014 Steve Heffernan
 * Licensed under the Apache license.
 */

// Use grunt's log
var log = module.exports = require('grunt/lib/grunt/log.js');

log.notice = function(){
  log.write(''+
'============================================================================\n'+
'= NOTICE                                                                   =\n'+
'============================================================================\n'+
'Each contrib command runs a set of shell scripts as defined by the          \n'+
'contrib.json author, some of which may ask for your password in order to    \n'+
'install other software.                                                     \n'+
'                                                                            \n'+
'*DO NOT CONTINUE until you have inspected the steps that a command          \n'+
'will perform. You can execute any command with one of the following flags*  \n'+
'\n'+
'  --interactive      Confirm each step before executing it\n'+
'  --dry-run          Go through all steps without executing them\n'+
'\n'+
'============================================================================\n'
  );
};
