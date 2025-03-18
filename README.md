# Task Planner MCP Server

An MCP (Model Context Protocol) server that helps AI assistants (like Claude) break down complex tasks into manageable steps, track progress, and manage a hierarchical task list.

## Features

- Create, update, and delete tasks
- Break down complex tasks into multiple subtasks
- Mark tasks as complete
- View detailed task information
- List all tasks or subtasks of a specific task
- Set task priorities (low, medium, high)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/task-planner-mcp.git
cd task-planner-mcp

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

## Usage

### Running the server

```bash
pnpm start
```

### Claude Desktop Configuration

To use this MCP server with Claude Desktop, add the following to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "task-planner": {
      "command": "node",
      "args": ["/absolute/path/to/task-planner-mcp/build/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/task-planner-mcp` with the absolute path to your task planner directory.

## Available Tools

The Task Planner MCP Server provides the following tools:

### `create-task`

Create a new task or subtask.

Parameters:

- `title`: Title of the task
- `description` (optional): Detailed description of the task
- `parentId` (optional): ID of the parent task if this is a subtask
- `priority` (optional): Priority level of the task (low, medium, high)

### `list-tasks`

List all tasks or subtasks.

Parameters:

- `parentId` (optional): ID of the parent task to list subtasks for

### `get-task`

Get detailed information about a task.

Parameters:

- `id`: ID of the task to retrieve

### `complete-task`

Mark a task as completed.

Parameters:

- `id`: ID of the task to complete

### `update-task`

Update a task's details.

Parameters:

- `id`: ID of the task to update
- `title` (optional): New title for the task
- `description` (optional): New description for the task
- `priority` (optional): New priority level for the task (low, medium, high)

### `delete-task`

Delete a task and its subtasks.

Parameters:

- `id`: ID of the task to delete

### `break-down-task`

Break down a complex task into multiple subtasks.

Parameters:

- `parentId`: ID of the parent task to break down
- `subtasks`: Array of subtask objects, each with:
  - `title`: Title of the subtask
  - `description` (optional): Description of the subtask
  - `priority` (optional): Priority of the subtask (low, medium, high)

## Examples

Here are some examples of how to use the Task Planner with Claude:

1. "Create a new task called 'Plan my vacation'"
2. "Break down my vacation planning task into smaller steps"
3. "What tasks do I have pending?"
4. "Show me the details of my vacation planning task"
5. "Mark the flight booking subtask as complete"
6. "Delete the task about grocery shopping"

## Data Storage

Task data is stored in a local JSON file (`tasks.json`) in the root directory of the project.

## License

ISC
