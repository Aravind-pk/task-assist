# task-assist

This is aa simple task assist extension for VS Code. It creates tasks overview based on the user input.
Prototype from traycer.ai

## Features

- Creates a task overview based on the user input.
- Finds the requiered files to achive the plan.
- Analyse the required files and prepare an execution plan.
- Use open-router (easy to switch between models)

## TODO

- add a ui library (had some dependancy issue with svelte 5 and rollup)
- add a diff ui to show the code changes
- ability to apply the code changes directly.
- dropdown to select the model


## Usage

  1. Clone the repo and ``pnpm install`` 
  2. Open the command palette (Ctrl+Shift+P) and type "Set API Key", enter your open-router key.
  3. start using task-assist from sidepanel.

