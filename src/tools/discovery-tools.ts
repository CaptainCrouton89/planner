import { DiscoveryStage } from "../core/Requirement.js";
import { TechnicalRequirement } from "../core/TechnicalRequirement.js";
import {
  createErrorResponse,
  withErrorHandling,
} from "../utils/errorHandling.js";
import { validateDiscoveryStage } from "../utils/validation.js";
import { requirementGenerator } from "./index.js";

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
 * Guide the user through structured requirement discovery
 */
export const guidedRequirementDiscovery = withErrorHandling(
  async ({
    projectId,
    domain,
    stage,
    previousResponses,
  }: {
    projectId: string;
    domain: string;
    stage: string;
    previousResponses?: string;
  }) => {
    // Validate stage
    const stageResult = validateDiscoveryStageWithResponse(stage);
    if (isErrorResponse(stageResult)) {
      return stageResult;
    }

    const response = await requirementGenerator.guidedRequirementDiscovery({
      projectId,
      domain,
      stage: stageResult,
      previousResponses,
    });

    return { response };
  },
  "guidedRequirementDiscovery"
);

/**
 * Process the user's response to guided discovery
 */
export const processDiscoveryResponse = withErrorHandling(
  async (input: {
    projectId: string;
    stage: string;
    domain: string;
    response: string;
    previousResponses?: string;
  }) => {
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

    const result = await requirementGenerator.processDiscoveryResponse({
      projectId,
      stage: stageResult,
      domain,
      response: userResponse,
      previousResponses,
    });

    return { response: result };
  },
  "processDiscoveryResponse"
);

/**
 * Generate requirements from discovery responses
 */
export const generateRequirementsFromDiscovery = withErrorHandling(
  async (input: { projectId: string; discoveryResponses: string }) => {
    const { projectId, discoveryResponses } = input;

    const requirements =
      await requirementGenerator.generateRequirementsFromDiscovery(
        projectId,
        discoveryResponses
      );

    return { requirements };
  },
  "generateRequirementsFromDiscovery"
);

/**
 * Generate a requirement from natural language
 */
export const generateRequirement = withErrorHandling(
  async (input: { projectId: string; description: string }) => {
    const { projectId, description } = input;

    const requirement = await requirementGenerator.generateRequirement(
      projectId,
      description
    );

    return { requirement };
  },
  "generateRequirement"
);

/**
 * Generate requirements and technical requirements from discovery responses
 */
export const generateAllRequirementsFromDiscovery = withErrorHandling(
  async (input: { projectId: string; discoveryResponses: string }) => {
    const { projectId, discoveryResponses } = input;

    // First generate regular requirements
    const requirements =
      await requirementGenerator.generateRequirementsFromDiscovery(
        projectId,
        discoveryResponses
      );

    // If technical requirements are requested, generate them too
    let technicalRequirements: TechnicalRequirement[] = [];
    technicalRequirements =
      await requirementGenerator.generateTechnicalRequirementsFromDiscovery(
        projectId,
        discoveryResponses
      );

    return { requirements, technicalRequirements };
  },
  "generateAllRequirementsFromDiscovery"
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
