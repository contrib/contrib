# contrib [![Build Status](https://secure.travis-ci.org/contrib/contrib.png?branch=master)](http://travis-ci.org/contrib/contrib)

A CLI for standarizing the contribution process across projects.

## Philosophy

Open source projects share a common core set of tasks that are part of the contributing process, including setting up the project, creating and submitting patches, and discussing bugs and features. However depending on the specific technology and style choices made, these tasks may happen very differently between projects.

The goal of contrib is to provide a common interface for these core tasks so that new contributors can get started quickly, and learn the specifics of a project over time while also being immediately productive.

Contrib is **NOT** meant to replace existing task runners, but to help new contributors interactivly learn the specific task and version control commands used in a project. It provides only enough configuration to define the command-line steps in a core task, and any more advanced functionality or automation will still require other tools.

## Examples

Install a project: Git + Github + Gitflow + Node.js + Grunt
```
$ contrib install
PERFORMING install

STEP 1.
$ echo single task

single task

{
  "desc": "Add the main project as an upstream remote",
  "exec": "git remote add upstream https://github.com/example/gitflow-example.git"
},
{
  "desc": "Fetch the most recent upstream changes",
  "exec": "git fetch upstream"
},
{
  "desc": "Create the local development branch",
  "exec": "git checkout -b develop origin/develop"
},
{
  "desc": "Create the local development branch",
  "exec": "git checkout -b develop origin/develop"
}

## Features
- Compatible with any command-line version control software
- Compatible with projects of any programming language

## Goals/Roadmap
- Generate user friendly contribution guides (e.g. CONTRIBUTING.md) from the config
- Provide a multi-lingual support for both the CLI and text guides

For contributors:
  - The same interface across projects
  - See each step and learn as you go

## Installation

Contrib requires Node.js. Download and install at [nodejs.org](http://nodejs.org).

Then install the contrib cli globally.

```bash
npm install -g contrib
```

## Features


## Philosophy


Open source projects all have unique combinations of technology choices, coding styles, and communication channels, but also share a set of common tasks that are required to 

Every open source project has a unique combination of technology choices, coding style, and communication channels, but 


## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Release History
_(Nothing yet)_

## License
Copyright (c) 2014 heff. Licensed under the Apache license.
