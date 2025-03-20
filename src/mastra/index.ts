import { Mastra } from "@mastra/core";
import {
  acceptanceCriteriaGeneratorAgent,
  requirementGeneratorAgent,
  taskGeneratorAgent,
  technicalRequirementsGeneratorAgent,
} from "./agents/index.js";

export const mastra = new Mastra({
  agents: {
    requirementGeneratorAgent,
    taskGeneratorAgent,
    acceptanceCriteriaGeneratorAgent,
    technicalRequirementsGeneratorAgent,
  },
});
