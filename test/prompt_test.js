'use strict';

var Prompt = require('../lib/prompt');

var contrib = require('../lib/contrib.js');
var sinon = require('sinon');

// require libs for stubbing
var promptjs = require('prompt');


exports['prompt_test'] = {
  setUp: function(done) {
    // create stubs for commands
    done();
  },
  tearDown: function(done){
    // restore stubs
    done();
  },
  'prompt step': function(test) {
    sinon.stub(Prompt, 'doStep');

    contrib({
      example: [
        { "prompt": "text", "desc": "Question" }
      ]
    }, ['example']);

    test.ok(Prompt.doStep.getCall(0), 'step was handled by prompt');
    test.equal(Prompt.doStep.getCall(0).args[0].prompt, 'text', 'prompt was the text type');
    test.equal(Prompt.doStep.getCall(0).args[0].desc, 'Question', 'prompt had the description');

    Prompt.doStep.restore();
    test.done();
  },
  'text prompt': function(test) {
    test.expect(2);

    sinon.stub(promptjs, 'start');
    sinon.stub(promptjs, 'get').callsArgWith(1, null, { text: 'fake result' });

    var step = {
      prompt: 'text',
      command: {
        options: {},
        data: {}
      }
    };

    Prompt.doStep(step, function(){
      test.ok('callback fired');
    });

    test.deepEqual(promptjs.get.getCall(0).args[0], { name: 'text' }, 'spawn called with correct args');

    promptjs.start.restore();
    promptjs.get.restore();
    test.done();
  }
};

