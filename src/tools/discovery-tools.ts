import * as requirementsApi from "../api/requirements.js";
import {
  createErrorResponse,
  withErrorHandling,
} from "../utils/errorHandling.js";
import { validateDiscoveryStage } from "../utils/validation.js";

/**
 * Guide the user through structured requirement discovery (implementation)
 */
async function guidedRequirementDiscoveryImpl(input: {
  projectId: string;
  domain: string;
  stage: string;
  previousResponses?: string;
}) {
  const { projectId, domain, stage, previousResponses } = input;

  // Validate stage
  const validatedStage = validateDiscoveryStageWithResponse(stage);
  if (typeof validatedStage === "object") {
    return validatedStage; // Return error response
  }

  const response = await requirementsApi.guidedRequirementDiscovery({
    projectId,
    domain,
    stage: validatedStage,
    previousResponses,
  });

  return { response };
}

/**
 * Guide the user through structured requirement discovery
 */
export const guidedRequirementDiscovery = withErrorHandling(
  guidedRequirementDiscoveryImpl,
  "guidedRequirementDiscovery"
);

/**
 * Process the user's response to guided discovery (implementation)
 */
async function processDiscoveryResponseImpl(input: {
  projectId: string;
  stage: string;
  domain: string;
  response: string;
  previousResponses?: string;
}) {
  const {
    projectId,
    stage,
    domain,
    response: userResponse,
    previousResponses,
  } = input;

  // Validate stage
  const validatedStage = validateDiscoveryStageWithResponse(stage);
  if (typeof validatedStage === "object") {
    return validatedStage; // Return error response
  }

  const result = await requirementsApi.processDiscoveryResponse({
    projectId,
    stage: validatedStage,
    domain,
    response: userResponse,
    previousResponses,
  });

  return { response: result };
}

/**
 * Process the user's response to guided discovery
 */
export const processDiscoveryResponse = withErrorHandling(
  processDiscoveryResponseImpl,
  "processDiscoveryResponse"
);

/**
 * Generate requirements from discovery responses (implementation)
 */
async function generateRequirementsFromDiscoveryImpl(input: {
  projectId: string;
  discoveryResponses: string;
}) {
  const { projectId, discoveryResponses } = input;

  const requirements = await requirementsApi.generateRequirementsFromDiscovery(
    projectId,
    discoveryResponses
  );

  return { requirements };
}

/**
 * Generate requirements from discovery responses
 */
export const generateRequirementsFromDiscovery = withErrorHandling(
  generateRequirementsFromDiscoveryImpl,
  "generateRequirementsFromDiscovery"
);

/**
 * Generate a requirement from natural language (implementation)
 */
async function generateRequirementImpl(input: {
  projectId: string;
  description: string;
}) {
  const { projectId, description } = input;

  const requirement = await requirementsApi.generateRequirement(
    projectId,
    description
  );

  return { requirement };
}

/**
 * Generate a requirement from natural language
 */
export const generateRequirement = withErrorHandling(
  generateRequirementImpl,
  "generateRequirement"
);

// Helper function for validating discovery stage
function validateDiscoveryStageWithResponse(stage: string) {
  const validatedStage = validateDiscoveryStage(stage);
  if (!validatedStage) {
    return createErrorResponse(
      `Invalid discovery stage: ${stage}. Valid stages are: initial, stakeholders, features, constraints, quality, finalize`
    );
  }
  return validatedStage;
}
