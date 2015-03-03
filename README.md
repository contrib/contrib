# contrib (cli)

a command-line utility for simplifying the contribution process of software projects

## Compatibility
- Any programming language
- Any version control software
- Any task runner
- Windows/Mac/Linux

## Background

Contributing to open source projects requires a lot of process that many potential contributors are not familiar with.

> Sorry - I don't use git. ([video.js#781](https://github.com/videojs/video.js/issues/781))  

> Perhaps another time; I'm not familiar with the testing framework and would have to get the whole environment set-up. ([video.js#603](https://github.com/videojs/video.js/issues/603))

> Unfortunately I am not familiar with Github processes ([video.js#734](https://github.com/videojs/video.js/issues/734#issuecomment-36718719))

> No, thanks. I'm too lazy to fork, download, build and run tests :) ([video.js#673](https://github.com/videojs/video.js/issues/673))

> Hi. What is PR? :) ([video.js#1247](https://github.com/videojs/video.js/issues/1247#issuecomment-44501064))

> Not really sure how... ([video.js#1297](https://github.com/videojs/video.js/issues/1297#issuecomment-46308725))

In all of these examples **the person helped solve the issue**, so it wasn't a lack of ability or willingness to help that blocked them, it was the requirement of knowing the tools and having the time to set up the project correctly.

The solution is easy -- everyone needs to agree to use the same programming language, version control, branching model, task runner, and testing framework. Since that's unlikely to happen, an alternative is to provide a common interface for contributors to interact with different projects.

This is what **contrib** is meant to be. With contrib a contributor can get set up and help out quickly, while also learning a project's specific tasks, version control commands, and other processes as they go.

## Example

```bash
$ contrib install twbs/bootstrap
$ contrib feature start

[write code]

$ contrib feature submit
```

With the previous commands, contrib will help you [fork](https://help.github.com/articles/fork-a-repo/), [clone](http://git-scm.com/docs/git-clone), start a new [branch](http://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging), and submit your changes as a [pull request](https://help.github.com/articles/using-pull-requests/). In many cases it will even run build scripts and automated tests. At the same time, contrib will show you the underlying git, github, and/or other tasks needed to perform the same steps manually. So you can either learn as you go or just speed through the process.

> Note: By default, contrib works with any project on Github, using the most common contributor workflows. However, projects can [create custom workflows](#configure), including projects not hosted on Github.

## Getting Started

Contrib currently requires node.js and npm ([a goal](https://github.com/contrib/contrib/issues/1) is to make it a stand-alone package)<br>
<a href="http://nodejs.org">Download and Install Node.js</a>

Once Node.js is installed on your system you can install contrib as a command-line tool.
> Note: If you get permissions errors on a unix/linux/mac system, add `sudo` before the command

    npm install contrib --global


## Usage
To download the source code of a project and set it up for contributions, use the `contrib install` command.

    contrib install [PROJECT OR contrib.json URL]
    
    # If on Github you can use the 'org/project' name
    contrib install twbs/bootstrap

    # If not on Github, use the URL of the project's contrib.json file
    contrib install http://example.com/source/contrib.json

After you have the source code you will need to move into the source code direcotory.

    cd [PROJECT DIR]

At the root of the project directory, run the `contrib` command. This will show you the available commands for the project and how to use them. While there's a suggested set of common commands, a project can completely customize which commands are available and what they do.

    contrib

Commands are used like so

    contrib [command] [options]

    # For example
    contrib foo --dry-run


## Options

Flags | Description
----- | -----------
-h, --help             | Output usage information
-i, --interactive      | Confirm each step before executing it
-d, --dry-run          | Output all steps but do not execute them
-s, --step [step]      | Specify a single step to execute
-b, --begin [step]     | Specify a step to begin at
-e, --end [step]       | Specify a step to stop after
-v, --version          | Output the contrib version number


## Configuring

Run `contrib init` to generate a contrib.json file with some suggested commands.

    contrib init

> Note: The quickest way to get started is probably to copy an existing contrib.json from another project that has a similar workflow, and then modify it for your needs.

The basic structure of a contrib.json file looks like this:

```json
{
  "meta": {
    "name": "my-project",
    "requirements": [
      {
        "name": "example requirement",
        "home": "http://example.com"
      }
    ]
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
}
```

### Meta
The meta object in the config file holds metadata for the project. The metadata can be used in commands.

```json
{
  "meta": {
    "name": "my-project"
  },
  "say-name": {
    "desc": "Echo the project name",
    "steps": [
      "echo The name of the project is {{ meta.name }}"
    ]
  }
}
```

    $ contrib say-name
    -> The name of the project is my-project

Common meta object keys include:
- name: The name of the project
- requirements: An array of objects that describe project requirements

### Commands

    contrib [command]

Any key of the main config object besides `meta` is considered a command. A command is defined with an object that has a description ("desc") and an array of steps. The description is displayed both when starting the command and in the help display. The steps array is a list of the command line scripts or built-in actions (e.g. prompt) that should be performed in order. The following example command would be run with `contrib example`, and would write out `hello` and then `world`.

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

The previous command configuration can also be simplifed to just an array of the steps.
> Note: this drops the description which can be very valuable for users even if the command seems obvious.

```json
{
  "example": [
    "echo hello",
    "echo world"
  ]
}
```

Finally for very simple command-to-task translations, a string can be used to define the command.

```json
{
  "test": "taskrunner test"
}
```


### Subcommands

    contrib [command] [subcommand]


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

> Note: A subcommand must be defined using and object with a `steps` key. A string or array cannot be used like for top level commands.


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

> Note: We define most steps in a single line to line-up the actions for easy reading, and to keep the length of the contrib.json from getting too long. This is different from typical json/javascript formatting, but can make a big difference with larger command sets.

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

An alternative (but less obvious) method is to define the step as an array. In this case it's assumed the first item is the "exec" action, the second item is the description, and the third item is the ID. This format can help simplify commands that are long lists of exec actions with descriptions.

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

> Note: It's best to provide a description for most steps so that project contributors can be learning the project's tools as they use contrib.

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
    { "exec": "task/command-line script" }
  ]
}
```

#### prompt
Prompt steps ask the user for some type of information. The step description is the question to ask or a description of the information the user should enter. If you include an ID for the step the user's response can be used in a later step.

```json
{
  "steps": [
    { "prompt": "text", "desc": "What is your name?", "id": "name" },
    { "exec": "echo Your name is {{name}}" }
  ]
}
```

##### prompt: text

An open ended text input.

```json
{
  "steps": [
    { "prompt": "text", "desc": "What is your name?", "id": "name" }
  ]
}
```

##### prompt: confirm

Ask a question with a yes or no answer. A "no" response will immediately end the command and no other steps will be performed.

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

## Standard Commands

The specific contrib commands that are ultimately available in a project is completely up to the project owner. There's nothing stopping someone from creating completely custom commands and even using contrib outside of the open source project context. However when using with open source, the following commands (if included) should work as described.

> When you run `contrib init` it will create a contrib.json that includes these functions as described.

### install [contrib.json URL]
Copy/fork, download/clone, and set up the project. When install is run, contrib will load the given contrib.json and perform the install steps defined in it.

### setup
Set up version control and install dependencies. Set up is its own command and also included in the `install` command using the [include step definition](#include).

### update
Get the latest changes to the code from the main project and update dependencies.

### test
Run automated tests

## Common Commands
In early projects using contrib you will see many of the following commands. They're based on common git + Github workflows so they may not work with projects that don't use those tools. And it's too early to say they're standard either way so feel free to experiment with and suggest different versions. The important thing is that you describe what your commands do so that when a contributor runs the `contrib` command they will be able to find what they're looking for.

### feature/patch
Commands around writing code for the project.
- A feature would be any kind of enhancement and would usually be merged into the development branch.
- A patch (or hotfix) is for fixing an urgent bug and would usually be merged into the release branch.

If you're using the [gitflow](http://nvie.com/posts/a-successful-git-branching-model/) model you might have feature and hotfix commands. If you're using [Github Flow](https://guides.github.com/introduction/flow/index.html) you might just have feature commands. And if you're using subversion, mercurial or another version controls software, you might have something very different.

##### feature/patch subcommands

```bash
contrib feature start
contrib feature submit
contrib feature delete
```

- Start: Update the project and create a new branch for the feature
- Submit: Submitting the code for review (create a pull request)
- Delete: Delete a feature if it's been accepted or no longer needed

### report
Submit a bug report. This command can be useful for having contributors answer specific questions before submitting a report (especially with Github issues).

### request
Submit a feature/enhancement request.

### question
Submit a question. This command can help contributors discover where a project prefers they ask questions. It may be Stack Overflow, a forum, a mailing list, or somewhere else.

### build

Build the program (if appropriate)

### server

Start a local server for testing

## Goals/Roadmap
- Generate user-friendly contribution guides (e.g. CONTRIBUTING.md) from the config
- Support internationalization for both the CLI and text guides
- Create compiled executables (remove node.js requirement)


## Philosophy

Contrib is not meant to replace existing task runners or do everything a task runner can. It is meant to be a mapping of common processes to existing project-specific tasks and commands.

Contrib is meant to teach the underlying tasks and processes (not hide them) while also allowing the contributor to be immediately productive.


## License
Copyright (c) 2014 heff. Licensed under the MIT license.
