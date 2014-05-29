/**
 * Options for every command
 */
var OPTIONS = module.exports = {
  help:        { short:'h',             desc:'Output usage information' },
  interactive: { short:'i',             desc:'Confirm each step before executing it' },
  'dry-run':   { short:'d',             desc:'Output all steps but do not execute them' },
  step:        { short:'s', arg:'step', desc:'Specify a single step to execute' },
  begin:       { short:'b', arg:'step', desc:'Specify a step to begin at' },
  end:         { short:'e', arg:'step', desc:'Specify a step to stop after' },
  version:     { short:'v',             desc:'Output the contrib version number' }
};
