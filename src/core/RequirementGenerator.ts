import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db, discoverySessions, NewDiscoverySession } from "../db/index.js";
import { requirementGeneratorAgent } from "../mastra/agents/index.js";
import { DrizzleRequirementStore } from "../storage/drizzle/DrizzleRequirementStore.js";
import {
  DiscoveryInput,
  DiscoveryProcessInput,
  DiscoveryResponse,
  DiscoverySession,
  DiscoveryStage,
  Requirement,
  RequirementInput,
  RequirementPriority,
} from "./Requirement.js";

export class RequirementGenerator {
  private requirementStore: DrizzleRequirementStore;

  constructor() {
    this.requirementStore = new DrizzleRequirementStore();
  }

  async initialize(): Promise<void> {
    await this.requirementStore.initialize();
  }

  /**
   * Guides the user through a structured requirement discovery process
   */
  async guidedRequirementDiscovery(
    input: DiscoveryInput
  ): Promise<DiscoveryResponse> {
    try {
      // Check if a session already exists for this project and stage
      const existingSession = await this.getExistingSession(
        input.projectId,
        input.stage
      );

      let sessionId: string;

      if (existingSession) {
        sessionId = existingSession.id;
      } else {
        // Create a new discovery session
        sessionId = await this.createDiscoverySession(
          input.projectId,
          input.domain,
          input.stage
        );
      }

      // Generate questions based on the stage
      const questions = this.generateQuestionsForStage(
        input.stage,
        input.domain,
        input.previousResponses
      );

      const suggestions = this.generateSuggestionsForStage(
        input.stage,
        input.domain
      );

      return {
        questions: await questions,
        suggestions: await suggestions,
      };
    } catch (error) {
      console.error("Error in guidedRequirementDiscovery:", error);
      throw error;
    }
  }

  /**
   * Processes user responses from the guided discovery process
   */
  async processDiscoveryResponse(
    input: DiscoveryProcessInput
  ): Promise<DiscoveryResponse> {
    try {
      // Get the existing session
      const session = await this.getExistingSession(
        input.projectId,
        input.stage
      );

      if (!session) {
        throw new Error(
          `No discovery session found for project ${input.projectId} and stage ${input.stage}`
        );
      }

      // Update the session with the new response
      const responses = session.responses || {};
      responses[Date.now().toString()] = input.response;

      await db
        .update(discoverySessions)
        .set({
          responses,
          updatedAt: new Date(),
        })
        .where(eq(discoverySessions.id, session.id));

      // Determine if we should move to the next stage
      const shouldAdvance = await this.shouldAdvanceToNextStage(
        input.stage,
        input.domain,
        input.response,
        input.previousResponses
      );

      const nextStage = shouldAdvance
        ? this.getNextStage(input.stage)
        : undefined;

      // Generate follow-up questions based on the current response
      const questions = this.generateFollowUpQuestions(
        input.stage,
        input.domain,
        input.response,
        input.previousResponses
      );

      const suggestions = this.generateSuggestionsForStage(
        input.stage,
        input.domain
      );

      return {
        questions: await questions,
        suggestions: await suggestions,
        nextStage,
      };
    } catch (error) {
      console.error("Error in processDiscoveryResponse:", error);
      throw error;
    }
  }

  /**
   * Generates requirements based on discovery responses
   */
  async generateRequirementsFromDiscovery(
    projectId: string,
    discoveryResponses: string
  ): Promise<Requirement[]> {
    try {
      // Get all sessions for this project
      const sessions = await db
        .select()
        .from(discoverySessions)
        .where(eq(discoverySessions.projectId, projectId));

      if (sessions.length === 0) {
        throw new Error(`No discovery sessions found for project ${projectId}`);
      }

      // Combine responses from all sessions
      const allResponses = sessions.reduce((acc, session) => {
        return { ...acc, ...session.responses };
      }, {});

      // Convert to string if it's not already
      const combinedResponses =
        typeof discoveryResponses === "string"
          ? discoveryResponses
          : JSON.stringify(allResponses);

      // Parse the combined responses and generate requirements
      const requirements: RequirementInput[] =
        await this.parseRequirementsFromText(projectId, combinedResponses);

      // Create the requirements in the database
      const createdRequirements: Requirement[] = [];

      for (const req of requirements) {
        const requirement = await this.requirementStore.createRequirement(req);
        createdRequirements.push(requirement);
      }

      return createdRequirements;
    } catch (error) {
      console.error("Error in generateRequirementsFromDiscovery:", error);
      throw error;
    }
  }

  /**
   * Generates a requirement from natural language description
   */
  async generateRequirement(
    projectId: string,
    description: string
  ): Promise<Requirement> {
    try {
      // Parse the natural language description into a structured requirement
      const requirementInput = await this.parseRequirementFromText(
        projectId,
        description
      );

      // Create the requirement in the database
      return this.requirementStore.createRequirement(requirementInput);
    } catch (error) {
      console.error("Error in generateRequirement:", error);
      throw error;
    }
  }

  // Helper methods

  private async getExistingSession(
    projectId: string,
    stage: DiscoveryStage
  ): Promise<DiscoverySession | undefined> {
    const sessions = await db
      .select()
      .from(discoverySessions)
      .where(
        eq(discoverySessions.projectId, projectId) &&
          eq(discoverySessions.stage, stage)
      );

    if (sessions.length === 0) {
      return undefined;
    }

    // Convert the db session to the DiscoverySession type
    const session = sessions[0];
    return {
      id: session.id,
      projectId: session.projectId,
      domain: session.domain,
      stage: session.stage as DiscoveryStage, // Type assertion to fix error
      responses: session.responses || {},
      createdAt: session.createdAt || new Date(),
      updatedAt: session.updatedAt || new Date(),
    };
  }

  private async createDiscoverySession(
    projectId: string,
    domain: string,
    stage: DiscoveryStage
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date();

    const newSession: NewDiscoverySession = {
      id,
      projectId,
      domain,
      stage,
      responses: {},
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(discoverySessions).values(newSession);
    return id;
  }

  private async generateQuestionsForStage(
    stage: DiscoveryStage,
    domain: string,
    previousResponses?: string
  ): Promise<string> {
    const questions = await requirementGeneratorAgent.generate([
      {
        role: "user",
        content: `
        Generate questions for the ${stage} stage of the discovery process.
        The domain is ${domain}.
        The previous responses are ${previousResponses}.
        `,
      },
    ]);

    return questions.text;
  }

  private async generateSuggestionsForStage(
    stage: DiscoveryStage,
    domain: string
  ): Promise<string> {
    const suggestions = await requirementGeneratorAgent.generate([
      {
        role: "user",
        content: `
        Generate suggestions for the ${stage} stage of the discovery process.
        The domain is ${domain}.
      `,
      },
    ]);

    return suggestions.text;
  }

  private async generateFollowUpQuestions(
    stage: DiscoveryStage,
    domain: string,
    response: string,
    previousResponses?: string
  ): Promise<string> {
    const questions = await requirementGeneratorAgent.generate([
      {
        role: "user",
        content: `
        Generate follow-up questions for the ${stage} stage of the discovery process.
        The domain is ${domain}.
        The previous responses are ${previousResponses}.
        The response is ${response}.
        `,
      },
    ]);

    return questions.text;
  }

  private async shouldAdvanceToNextStage(
    currentStage: DiscoveryStage,
    domain: string,
    response: string,
    previousResponses?: string
  ): Promise<boolean> {
    const schema = z.object({
      shouldAdvance: z
        .boolean()
        .default(false)
        .describe("Whether to advance to the next stage"),
    });

    const shouldAdvance = await requirementGeneratorAgent.generate(
      [
        {
          role: "user",
          content: `
        Should we advance to the next stage of the discovery process?
        The current stage is ${currentStage}.
        The domain is ${domain}.
        The previous responses are ${previousResponses}.
        The response is ${response}.

        Output only valid JSON, nothing else.
        `,
        },
      ],
      {
        output: schema,
      }
    );

    return shouldAdvance.object.shouldAdvance;
  }

  private getNextStage(
    currentStage: DiscoveryStage
  ): DiscoveryStage | undefined {
    const stages: DiscoveryStage[] = [
      "initial",
      "stakeholders",
      "features",
      "constraints",
      "quality",
      "finalize",
    ];

    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) {
      return undefined;
    }

    return stages[currentIndex + 1];
  }

  private async parseRequirementsFromText(
    projectId: string,
    text: string
  ): Promise<RequirementInput[]> {
    const schema = z.array(
      z.object({
        projectId: z.string(),
        title: z.string(),
        description: z.string(),
        type: z.string(),
        priority: z.string().transform((val) => val as RequirementPriority),
      })
    );

    const requirements = await requirementGeneratorAgent.generate(
      [
        {
          role: "user",
          content: `
        Parse the following text into requirements, using this as example:
[
      {
        projectId,
        title: "Example Requirement 1",
        description:
          "This is an example requirement parsed from discovery responses",
        type: "functional",
        priority: "high",
      },
      {
        projectId,
        title: "Example Requirement 2",
        description:
          "This is another example requirement parsed from discovery responses",
        type: "technical",
        priority: "medium",
      },
    ];

    ${text}

        Only return the array of requirements, nothing else.
        `,
        },
      ],
      {
        output: schema,
      }
    );

    return {
      ...JSON.parse(JSON.stringify(requirements.object)),
      projectId,
    };
  }

  private async parseRequirementFromText(
    projectId: string,
    description: string
  ): Promise<RequirementInput> {
    const schema = z.object({
      projectId: z.string(),
      title: z.string(),
      description: z.string(),
      type: z.string(),
      priority: z.string().transform((val) => val as RequirementPriority),
    });

    const requirement = await requirementGeneratorAgent.generate(
      [
        {
          role: "user",
          content: `Parse the following text into a requirement, using this as example: 
[
      {
        projectId,
        title: "Example Requirement 1",
        description:
          "This is an example requirement parsed from discovery responses",
        type: "functional",
        priority: "high",
      },
    ];

    ${description}

        Only return the requirement, nothing else.
        `,
        },
      ],
      {
        output: schema,
      }
    );

    return {
      ...JSON.parse(JSON.stringify(requirement.object)),
      projectId,
    };
  }
}
