# contrib [![Build Status](https://secure.travis-ci.org/contrib/contrib.png?branch=master)](http://travis-ci.org/contrib/contrib)

A simple command runner for standardizing the contribution process.

<!-- For a good overview, read [the blog post](). -->

Contributing to open source projects today is still too difficult for a lot of people. How do I know this? I've started encouraging bug submitters to help fix their own bugs, and these are common responses I get:

> "Sorry - I don't use git." ([link](https://github.com/videojs/video.js/issues/781))  

> "Perhaps another time; I'm not familiar with the testing framework and would have to get the whole environment set-up." ([link](https://github.com/videojs/video.js/issues/603))

> "Unfortunately I am not familiar with Github processes" ([link](https://github.com/videojs/video.js/issues/734#issuecomment-36718719))

> No, thanks. I'm too lazy to fork, download, build and run tests :)
https://github.com/videojs/video.js/issues/673

> Hi. What is PR? :)
https://github.com/videojs/video.js/issues/1247#issuecomment-44501064

In all of these cases **the commenter helped solve the issue**, so it wasn't a lack of ability or willingness to help that was the blocker, it was the process and time committment that's required to contribute.

The solution is easy, we just get everyone to agree to use the same programming language/version-control/branching-model/task-runner/testing-framework/style-guide/bug-tracker combination. No problem. But for the time before that happens we need another solution, and I think possibly maybe it could be **contrib**! \</confidence>

Here's a glimpse of the magical (command-line) world I want to live in:

```bash
# contributing to Rails (ruby, git, rake, github...)
contrib https://raw.github.com/rails/rails/master/contrib.json
contrib new patch
# make changes
contrib submit patch

# contributing to jQuery (javascript, git, grunt, github)
contrib copy https://raw.github.com/jquery/jquery/master/contrib.json
contrib new patch
# make changes
contrib submit patch

# contributing to Wordpress (php, svn, NOT GITHUB)
contrib http://develop.svn.wordpress.org/trunk/contrib.json
contrib new patch
# make changes
contrib submit patch
```

Contrib is built on a simple idea: Let's standarize and automate the contributing process. 

If you look at any open soure project, there's a standard set of tasks that need to happen in order to contribute.

Let's look at some areas where major projects differ.
  jQuery- never make a pull request against master

Because I want to help you fix your shit, but I don't want to learn your specific [VCS/branching model/task runner/style guide]

I think possibly maybe it could be **contrib**! \</confidence>

Contrib helps contributors contribute, by making the contribution process interactive and automated.

## Why use contrib in your project?

What if you could more easily turn bug submitters into patch contributors?

Open source projects share a common core set of tasks that are part of the contributing process, including setting up the project, submitting patches, and discussing bugs and features. However, these tasks may happen very differently between projects depending on the specific language, version control, and other technology and style choices that are made.

The goal of contrib is to provide a common interface for these core tasks so that new contributors can get started quickly and be immediately productive, while learning the specifics of a project over time.

Contrib is **NOT** meant to replace existing task runners, but to help new contributors interactivly learn the specific tasks and version control commands used in a project. It provides just enough configuration to define the command-line steps in a core task, and any more advanced functionality or automation will still require other tools.

More specifically, contrib is a command-line task runner, however it is **NOT** meant to replace existing task runners. Instead it wraps task and version controls commands in order to help new contributors interactivly learn the specific commands used in a project.

## Installation

Contrib requires [Node.js](http://nodejs.org/download/). After installing node, open a terminal and run:

    $ npm install -g contrib

## Usage
Run contrib commands on the command-line in a directory where a contrib.json file exists. See [Configuring](#configuring) for information on creating a contrib.json.

    $ contrib [command] [options]

### Standard commands
Contrib defines a set of standard commands that may be configured by the project owner. Standard commands are not required to exist for a project, but when they do they should perform the same task between projects. Run `contrib help` to see which commands are available for a project.

    install      Set up version control and install dependencies
    update       Get the latest changes to the project
    test         Run automated tests

##### Example usage

    $ contrib install

### Contribution commands
Contribution commands are completely customizable by the project owner, though may be similar between projects. Contribution commands should be nouns that refer to a contribution type. The following are some examples, however run `contrib help` to see the specific contribution types available for the current project.

    feature      Create a new feature, general enhancement, or non-urgent fix
    patch        Create a fix for an urgent issue/bug
    bug          Submit a bug report
    request      Submit a feature request
    question     Ask a question about the project

Run `contrib [type]` to start a contribution of that type, or to list any sub-commands.

##### Example usage

    $ contrib feature

#### Sub-commands

    $ contrib [type] [sub-command] [options]

Some contribution types will have multiple sub-commands that can be run. If so it will list them when you run `contrib [type]`. For instance, there is usually a few different stages in creating a feature.
    
    start        Create a new branch for the feature
    submit       Submit the feature for approval when finished

##### Example usage

    $ contrib feature start
    (build the feature)
    $ contrib feature submit

### Options
Include any of the following options with a command to provide more information or change how a command is executed.

    -h, --help              Output usage information
    -w, --walk              Confirm each step before executing it
    -d, --dry-run           Output all steps but do not execute them
    -s, --step [step]       Specify a single step to run
    -b, --begin [step]      Specify a step to begin at
    -e, --end [step]        Specify a step to stop after
    -v, --version           Output the contrib version number

##### Example usage

    $ contrib install --dry-run
    $ contrib install --begin 2 --end 4
    $ contrib install -b 2 -e 4


## Configuring

> NOTE: The easiest way to get started is probably to copy an existing contrib.json from [the examples]() or another project, and then modify it for your needs.

Contrib is configured with a contrib.json file. The basic structure of the file looks like this:

```json
{
  "project": {
    "name": "my-project",
    "requirements": [
      { 
        "name": "example requirement",
        "site": "http://example.com"
      }
    ]
  },
  "install": {
    "steps": [
      {
        "desc": "Example first install step",
        "exec": "echo Executing the first step!"
      }
    ]
  },
  "bug": {
    "steps": [
      { 
        "desc": "Open the bug tracker",
        "open": "http://example.com/submit-bug"
      }
    ]
  }
}
```

##### Project
The project object in the config file holds meta data for the project.

- name  (required) The name of the project
- owner (optional) The user or organization of the project
- requirements (optional) An array of objects that describe project requirements
  


## Examples

Example **contrib.json** (install command only) for a project that uses git + github + gitflow branching + node.js + grunt

The config:

```json
{
  "project": {
    "name": "my-project",
    "requirements": [
      {
        "name": "git",
        "info": "http://git-scm.com"
      },
      {
        "name": "node.js",
        "info": "http://nodejs.org"
      },
      {
        "name": "grunt",
        "info": "http://gruntjs.com"
      }
    ]
  },
  "install": {
    "steps": [
      {
        "desc": "Create the 'develop' branch locally for new features",
        "exec": "git checkout -b develop origin/develop"
      },
      {
        "desc": "Add the upstream project as a remote so new changes can be pulled in",
        "exec": "git remote add upstream https://github.com/example/my-project.git"
      },
      {
        "desc": "Get all upstream branches and changes",
        "exec": "git fetch upstream"
      },
      {
        "desc": "Install dependencies",
        "exec": "npm install"
      },
      {
        "desc": "Build the distribution and run tests",
        "exec": "grunt"
      }
    ]
  }
}
```

Example output from then running the `contrib install` command

```
~/Code/some-project $ contrib install

PERFORMING install: Set up version control and install dependencies
---
STEP 1. Create the 'develop' branch locally for new features
$ git checkout -b develop origin/develop

Switched to a new branch 'develop'
Branch develop set up to track remote branch develop from origin.

STEP 2. Add the upstream project as a remote so new changes can be pulled in
$ git remote add upstream https://github.com/example/some-project.git

STEP 3. Get all upstream branches and changes
$ git fetch upstream

From https://github.com/example/some-project
 * [new branch]      feature/something-new -> upstream/feature/something-new

STEP 4. Install dependencies
$ npm install

npm http GET https://registry.npmjs.org/grunt
npm http GET https://registry.npmjs.org/grunt-contrib-jshint

STEP 5. Build the distribution and run tests
$ grunt

Running "jshint" (jshint) task
>> 10 files lint free.

Running "dist" task

Running "test" task
Testing test/index.html ..................................................OK
>> 50 assertions passed (100ms)

Done, without errors.
---
FINSIHED install

```

## Features
- Compatible with
  - Any programming language
  - Windows/Mac/Linux
  - Any version control software
  - Any task runner

(assuming they're all command-line based)

## Goals/Roadmap
- Generate user friendly contribution guides (e.g. CONTRIBUTING.md) from the config
- Support internationalization for both the CLI and text guides
- Create compiled executables (remove node.js requirement)


## Philosophy

Open source projects all have unique combinations of technology choices, coding styles, and communication channels, but also share a set of common tasks that are required to 

Every open source project has a unique combination of technology choices, coding style, and communication channels, but 


## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## License
Copyright (c) 2014 heff. Licensed under the Apache license.
