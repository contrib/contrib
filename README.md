# contrib

a command-line interface for standardizing the contribution tasks between projects

<!-- For a good overview, read [the blog post](). -->

## Features
- Works with any programming language
- Works on Windows/Mac/Linux
- Works with any version control software
- Works with any task runner

## Background

Contributing to open source projects today requires a lot of process that many potential contributors (maybe most) are not familiar with.

> "Sorry - I don't use git." ([video.js#781](https://github.com/videojs/video.js/issues/781))  

> "Perhaps another time; I'm not familiar with the testing framework and would have to get the whole environment set-up." ([video.js#603](https://github.com/videojs/video.js/issues/603))

> "Unfortunately I am not familiar with Github processes" ([video.js#734](https://github.com/videojs/video.js/issues/734#issuecomment-36718719))

> No, thanks. I'm too lazy to fork, download, build and run tests :) ([video.js#673](https://github.com/videojs/video.js/issues/673))

> Not really sure how... ([video.js#1297](https://github.com/videojs/video.js/issues/1297#issuecomment-46308725))

> Hi. What is PR? :) ([video.js#1247](https://github.com/videojs/video.js/issues/1247#issuecomment-44501064))

In all of these examples **the commenter helped solve the issue**, so it wasn't a lack of ability or willingness to help that was the blocker, it was the requirement of knowing the tools and having the time to set up the project correctly.

The solution is easy &mdash; everyone needs to agree to use the same programming language, version control, branching model, task runner, testing framework, style-guide, and bug-tracker. Since that won't ever happen, the other option is to provide a common interface for contributors to interact with projects.

This is what contrib is meant to be. With contrib a contributor can get set up and help out quickly, while also learning a project's specific tasks, version control commands, and other processes as they go.

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
  "setup": {
    "desc": "Setup version control and install dependencies",
    "steps": [
      { "exec": "echo First setup step!", "desc": "Example first setup step" }
    ]
  },
  "feature": {
    "desc": "Example command for creating a feature",
    
    "start": {
      "desc": "Start building a new feature",
      "steps": [
        { "exec": "echo Starting Feature" }
      ]
    },
    
    "submit": {
      "desc": "Submit a finished feature",
      "steps": [
        { "exec": "echo Submitting Feature" }
      ]
    }
  }
}
```

### Project
The project object in the config file holds meta data for the project.

- name (required) The name of the project
- requirements (optional) An array of objects that describe project requirements

### Commands
Any key of the main object besides "project" is considered a command. In its simplest form a command is just an array of command-line tasks to execute. The following example command would be run with `contrib example`, and would print out `hello` and then `world`.

```json
{
  "example": [
    "echo hello",
    "echo world"
  ]
}
```

You can also create a command as an object with a "steps" array to allow you to also provide a description ("desc") of the command. The description is displayed both when running the command and in `contrib help`.

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

### Subcommands
Commands can also be set up to have subcommands. The following subcommands would be run with `contrib feature start` and `contrib feature submit`.

```json
{
  "feature": {
    "desc": "Example command for creating a feature",
    
    "start": {
      "desc": "Start building a new feature",
      "steps": [
        "echo Starting Feature"
      ]
    },
    
    "submit": {
      "desc": "Submit a finished feature",
      "steps": [
        "echo Submitting Feature"
      ]
    }
  }
}
```

### Steps

Steps are the sequential actions that make up a command. A step can have an action, a description, and an ID.

- Action (e.g. "exec" or "prompt"): Run a script or ask for user input
- Description ("desc"): A description of what happens in the step
- ID ("id"): A reference to the output of the step, for use in later steps


```json
{
  "example": {
    "desc": "Description of the example command",
    "steps": [
      { "exec": "echo hello", "desc": "Write 'hello'", "id": "helloStep" },
      { "exec": "echo world", "desc": "Write 'world'", "id": "worldStep" }
    ]
  }
}
```

> NOTE: We define most steps in a single line to line-up the actions for easy reading, and to keep the length of the contrib.json from getting too long. This is different from typical json formatting.

If a step is defined as a string, it's assumed it's an "exec" action and the string is the command-line script/task to run.

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
An alternative (but less familiar) method is to define the step as an array. In this case it's assumed the first item is the "exec" action, the second item is the description, and the third item is the ID. This format can help simplify commands that are long lists of exec actions with descriptions. 

```json
{
  "example": {
    "desc": "Description of the example command",
    "steps": [
      [ "echo hello", "Write 'hello'", "helloStep" ],
      [ "echo world", "Write 'world'", "worldStep" ]
    ]
  }
}
```

#### Step Description
The description is shown for each step after the step number. 

> NOTE: It's best to provide a description for most steps so that project contributors can be learning the project's tools as they use contrib.

Here is how the description from the first step in the hello world example would look.

```bash
STEP 1. Write 'hello'
```

#### Step IDs
IDs can be used if you want to store the output or user-input of a step to be used in a later step. In this example we will get the current date in the first step and then use that in the second step.

```json
{
  "date": {
    "desc": "Get and use the date",
    "steps": [
      { "exec": "date +%Y:%m:%d", "id": "date" },
      { "exec": "echo The date in the first step was {{date}}" }
    ]
  }
}
```

The second step should output something like `The date in the first step was 2014:07:31`.

#### Step Actions

Each step has a single action, defined as one of the following.

#### exec
Run the given command-line script or task. If an ID is provided the trimmed output of the command will be saved as the ID.

```json
{
  "steps": [
    { "exec": "COMMAND TO RUN" }
  ]
}
```

#### prompt
Prompt steps ask the user for some type of information. The step description is the question to ask the user.

##### prompt: text

An open ended text input.

```json
{
  "steps": [
    { "prompt": "text", "desc": "What is your name?" }
  ]
}
```

##### prompt: confirm

Ask a question with a yes or no answer. A "no" response will immediately end the command, so no other steps will be performed.

```json
{
  "steps": [
    { "prompt": "confirm", "desc": "Is this correct?" }
  ]
}
```

#### include
Include all steps from another command within the current command. In the following example, the `contrib foo` command will write out "hello" in Step 1 and then "world" in Step 2.

```json
{
  "foo": {
    "steps": [
      { "exec": "echo hello" },
      { "include": "bar" }
    ]
  },
  "bar": {
    "steps": [
      { "exec": "echo world" }
    ]
  }
}
```

## Goals/Roadmap
- Generate user-friendly contribution guides (e.g. CONTRIBUTING.md) from the config
- Support internationalization for both the CLI and text guides
- Create compiled executables (remove node.js requirement)


## Philosophy

Contrib is not meant to replace existing task runners or do everything a task runner can. It is meant to be a mapping of common processes to existing project-specific tasks and commands.

Contrib is meant to teach the underlying commands (not hide them) while also allowing the contributor to be immediately productive.


## License
Copyright (c) 2014 heff. Licensed under the MIT license.
