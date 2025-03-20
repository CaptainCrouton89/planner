import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

export const requirementGeneratorAgent = new Agent({
  name: "Requirement Generator",
  instructions:
    "You are a helpful assistant that specializes in generating requirements for a project.",
  model: openai("gpt-4o-mini"),
});

export const taskGeneratorAgent = new Agent({
  name: "Task Generator",
  instructions:
    "You are a helpful assistant that specializes in generating tasks for a project.",
  model: openai("gpt-4o-mini"),
});

export const acceptanceCriteriaGeneratorAgent = new Agent({
  name: "Acceptance Criteria Generator",
  instructions:
    "You are a helpful assistant that specializes in generating acceptance criteria for a project.",
  model: openai("gpt-4o-mini"),
});

export const technicalRequirementsGeneratorAgent = new Agent({
  name: "Technical Requirements Generator",
  instructions:
    "You are a helpful assistant that specializes in generating technical requirements for a project.",
  model: openai("gpt-4o-mini"),
});
