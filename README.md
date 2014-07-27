# contrib

a command-line interface for standardizing the contribution tasks between projects

<!-- For a good overview, read [the blog post](). -->

## Features
- Works with any programming language
- Works on Windows/Mac/Linux
- Works with any version control software
- Works with any task runner

## Getting Started

Contrib currently requires Node.js (hoping to someday make it a stand-alone package)<br>
<a href="http://nodejs.org">Download and Install Node.js</a>

Once Node.js is installed on your system you can install contrib globally.
> NOTE: If you get permissions errors use `sudo` before the command

```
npm install contrib --global
```

## Usage
Run the `contrib` command at the root of a project directory where a contrib.json file exists. See [Configuring](#configuring) for information on creating a contrib.json.

    contrib

This will show you the available commands for the project and how to use them.

## Configuring

Run `contrib init` to generate a contrib.json file with some suggested commands.

> NOTE: The quickest way to get started is probably to copy an existing contrib.json from another project that has a similar workflow, and then modify it for your needs.

The basic structure of a contrib.json file looks like this:

```json
{
  "project": {
    "name": "my-project",
    "requirements": [
      { 
        "name": "example requirement",
        "home": "http://example.com"
      }
    ]
  },
  "install": {
    "desc": "Fork and clone the project",
    "steps": [
      { "exec": "echo First step!", "desc": "Example first install step" }
    ]
  },
  "setup": {
    "desc": "Setup branches and install dependencies",
    "steps": [
      { "exec": "echo First step!", "desc": "Example first setup step" }
    ]
  }
}
```

### Project
The project object in the config file holds meta data for the project.

- name (required) The name of the project
- requirements (optional) An array of objects that describe project requirements

### Commands
Any key of the main object besides "project" is considered a command. In its simplest form a command is just an array of command-line tasks to execute. The following example command would be run with `contrib example`.

```json
{
  "example": [
    "echo hello",
    "echo world"
  ]
}
```

You can also create a command as an object with a "steps" array to allow you to also provide a description ("desc") of the command.

```json
{
  "example": {
    "desc": "Description of the example command",
    "steps": [
      "echo hello",
      "echo world"
    ]
  }
}
```

Individual steps can also be created as objects to provide descriptions.

```json
{
  "example": {
    "desc": "Description of the example command",
    "steps": [
      { "exec": "echo hello", "desc": "Write 'hello'" },
      { "exec": "echo world", "desc": "Write 'world'" }
    ]
  }
}
```

### Subcommands
Commands can also be set up to have sub commands. The following subcommands would be run with `contrib feature start` and `contrib feature submit`.

```json
{
  "feature": {
    "desc": "Example command for creating a feature",
    "start": {
      "desc": "Start building a new feature",
      "steps": [
        { "exec": "echo Starting Feature", "desc": "Feature start step 1" }
      ]
    },
    "submit": {
      "desc": "Submit a finished feature",
      "steps": [
        { "exec": "echo Submitting Feature", "desc": "Feature submit step 1" }
      ]
    }
  }
}
```

### Steps
There are a few different types of steps.

#### exec
Run the given command

```json
{
  "steps": [
    { "exec": "COMMAND TO RUN" }
  ]
}
```

If a string is used to define the step, it's assumed to be an exec step.
```json
{
  "steps": [
    "COMMAND TO RUN"
  ]
}
```

#### prompt
Prompt steps ask the user for some type of information.


## Background

Contributing to open source projects today requires a lot of process that many potential contributors (maybe most) are not familiar with.

> "Sorry - I don't use git." ([video.js#781](https://github.com/videojs/video.js/issues/781))  

> "Perhaps another time; I'm not familiar with the testing framework and would have to get the whole environment set-up." ([video.js#603](https://github.com/videojs/video.js/issues/603))

> "Unfortunately I am not familiar with Github processes" ([video.js#734](https://github.com/videojs/video.js/issues/734#issuecomment-36718719))

> No, thanks. I'm too lazy to fork, download, build and run tests :) ([video.js#673](https://github.com/videojs/video.js/issues/673))

> Not really sure how... ([video.js#1297](https://github.com/videojs/video.js/issues/1297#issuecomment-46308725))

> Hi. What is PR? :) ([video.js#1247](https://github.com/videojs/video.js/issues/1247#issuecomment-44501064))

In all of these examples **the commenter helped solve the issue**, so it wasn't a lack of ability or willingness to help that was the blocker, it was the requirement of knowledge of the tools and setup time.

The solution is easy &mdash; everyone needs to agree to use the same programming language, version control, branching model, task runner, testing framework, style-guide, and bug-tracker.

Since that's unlikely to happen, our next option is to provide a common interface for interacting with projects.

This is what contrib is meant to be. With contrib a contributor can get set up and help out quickly, while also learning a project's specific tasks, version controls commands, and other processes as they go.


## Goals/Roadmap
- Generate user-friendly contribution guides (e.g. CONTRIBUTING.md) from the config
- Support internationalization for both the CLI and text guides
- Create compiled executables (remove node.js requirement)


## Philosophy

Contrib is not meant to replace existing task runners or do everything a task runner can. It is meant to be a mapping of common processes to existing project-specific tasks and commands.

Contrib is meant to teach the underlying commands (not hide them) while also allowing the contributor to be immediately productive.


## License
Copyright (c) 2014 heff. Licensed under the MIT license.
