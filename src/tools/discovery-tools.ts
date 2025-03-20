import * as requirementsApi from "../api/requirements.js";
import { DiscoveryStage } from "../core/Requirement.js";
import {
  createErrorResponse,
  withErrorHandling,
} from "../utils/errorHandling.js";
import { validateDiscoveryStage } from "../utils/validation.js";

// Type representing an error response from createErrorResponse
type ErrorResponseType = ReturnType<typeof createErrorResponse>;

/**
 * Type guard to check if a value is an error response
 */
function isErrorResponse(value: any): value is ErrorResponseType {
  return (
    value &&
    typeof value === "object" &&
    "success" in value &&
    value.success === false
  );
}

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
  const stageResult = validateDiscoveryStageWithResponse(stage);
  if (isErrorResponse(stageResult)) {
    return stageResult;
  }

  const response = await requirementsApi.guidedRequirementDiscovery({
    projectId,
    domain,
    stage: stageResult,
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
  const stageResult = validateDiscoveryStageWithResponse(stage);
  if (isErrorResponse(stageResult)) {
    return stageResult;
  }

  const result = await requirementsApi.processDiscoveryResponse({
    projectId,
    stage: stageResult,
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
function validateDiscoveryStageWithResponse(
  stage: string
): DiscoveryStage | ErrorResponseType {
  const validatedStage = validateDiscoveryStage(stage);
  if (!validatedStage) {
    return createErrorResponse(
      `Invalid discovery stage: ${stage}. Valid stages are: initial, stakeholders, features, constraints, quality, finalize`
    );
  }
  return validatedStage;
}
