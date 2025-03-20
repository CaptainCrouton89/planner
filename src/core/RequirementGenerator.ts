import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db, discoverySessions, NewDiscoverySession } from "../db/index.js";
import {
  acceptanceCriteriaGeneratorAgent,
  requirementGeneratorAgent,
  technicalRequirementsGeneratorAgent,
} from "../mastra/agents/index.js";
import { DrizzleRequirementStore } from "../storage/drizzle/DrizzleRequirementStore.js";
import { DrizzleTechnicalRequirementStore } from "../storage/drizzle/DrizzleTechnicalRequirementStore.js";
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
import {
  AcceptanceCriteriaInput,
  TechnicalRequirement,
  TechnicalRequirementInput,
} from "./TechnicalRequirement.js";

export class RequirementGenerator {
  private requirementStore: DrizzleRequirementStore;
  private technicalRequirementStore: DrizzleTechnicalRequirementStore;

  constructor() {
    this.requirementStore = new DrizzleRequirementStore();
    this.technicalRequirementStore = new DrizzleTechnicalRequirementStore();
  }

  async initialize(): Promise<void> {
    await this.requirementStore.initialize();
    await this.technicalRequirementStore.initialize();
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
      const functionalRequirements = this.parseFunctionalRequirementsFromText(
        projectId,
        combinedResponses
      );

      const technicalRequirements = this.parseTechnicalRequirementsFromText(
        projectId,
        combinedResponses
      );

      const requirements: RequirementInput[] = [
        ...(await functionalRequirements),
        ...(await technicalRequirements),
      ];

      // Create the requirements in the database
      const createdRequirements: Requirement[] = [];

      for (const req of requirements) {
        const requirement = await this.requirementStore.createRequirement(req);
        createdRequirements.push(requirement);

        // If requested and this is a technical requirement, generate a technical requirement too
        if (req.type === "technical") {
          await this.generateTechnicalRequirement(requirement.id);
        }
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

  /**
   * Generates a technical requirement from a regular requirement
   */
  async generateTechnicalRequirement(
    requirementId: string
  ): Promise<TechnicalRequirement | undefined> {
    try {
      // Get the original requirement
      const requirement = await this.requirementStore.getRequirementById(
        requirementId
      );

      if (!requirement) {
        throw new Error(`Requirement with ID ${requirementId} not found`);
      }

      // Ensure the requirement type is 'technical'
      if (requirement.type !== "technical") {
        throw new Error(
          `Requirement with ID ${requirementId} is not of type 'technical'`
        );
      }

      // Generate technical stack
      const technicalStack = this.generateTechnicalStack(
        requirement.description
      );

      // Generate acceptance criteria
      const acceptanceCriteria = this.generateAcceptanceCriteria(
        requirement.description
      );

      // Create the technical requirement
      const technicalRequirementInput: TechnicalRequirementInput = {
        projectId: requirement.projectId,
        title: requirement.title,
        description: requirement.description,
        type: requirement.type,
        technicalStack: await technicalStack,
        acceptanceCriteria: await acceptanceCriteria,
      };

      return this.technicalRequirementStore.createTechnicalRequirement(
        technicalRequirementInput
      );
    } catch (error) {
      console.error("Error in generateTechnicalRequirement:", error);
      throw error;
    }
  }

  /**
   * Generate technical requirements from discovery responses
   */
  async generateTechnicalRequirementsFromDiscovery(
    projectId: string,
    discoveryResponses: string
  ): Promise<TechnicalRequirement[]> {
    try {
      // Generate regular requirements first
      const regularRequirements = await this.generateRequirementsFromDiscovery(
        projectId,
        discoveryResponses
      );

      // Filter for technical requirements
      const technicalRequirementIds = regularRequirements
        .filter((req) => req.type === "technical")
        .map((req) => req.id);

      // Generate technical requirements for each technical requirement
      const technicalRequirements: TechnicalRequirement[] = [];

      for (const reqId of technicalRequirementIds) {
        const technicalReq = await this.generateTechnicalRequirement(reqId);
        if (technicalReq) {
          technicalRequirements.push(technicalReq);
        }
      }

      return technicalRequirements;
    } catch (error) {
      console.error(
        "Error in generateTechnicalRequirementsFromDiscovery:",
        error
      );
      throw error;
    }
  }

  /**
   * Generate a technical requirement directly from description
   */
  async generateDirectTechnicalRequirement(
    projectId: string,
    description: string
  ): Promise<TechnicalRequirement> {
    try {
      // Parse the natural language description into a structured technical requirement
      const schema = z.object({
        title: z.string(),
        description: z.string(),
        type: z.string().transform((val) => val as "technical"),
        technicalStack: z.string(),
      });

      const technicalReqBase =
        await technicalRequirementsGeneratorAgent.generate(
          [
            {
              role: "user",
              content: `
            Generate a technical requirement from the following description. Include a title, detailed description, and technical stack.
            
            Description: ${description}
            
            Return valid JSON with the following structure:
            {
              "title": "Requirement title",
              "description": "Detailed description",
              "type": "technical",
              "technicalStack": "List of technologies (e.g., Node.js, PostgreSQL, React)"
            }
            `,
            },
          ],
          {
            output: schema,
          }
        );

      // Generate acceptance criteria
      const acceptanceCriteria = await this.generateAcceptanceCriteria(
        description
      );

      // Create the technical requirement
      const technicalRequirementInput: TechnicalRequirementInput = {
        projectId,
        title: technicalReqBase.object.title,
        description: technicalReqBase.object.description,
        type: "technical",
        technicalStack: technicalReqBase.object.technicalStack,
        acceptanceCriteria,
      };

      return this.technicalRequirementStore.createTechnicalRequirement(
        technicalRequirementInput
      );
    } catch (error) {
      console.error("Error in generateDirectTechnicalRequirement:", error);
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
        Keep it short and concise.
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

        Keep it short and concise.
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

  private async parseFunctionalRequirementsFromText(
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
        Turn the following text into functional requirements, using this as example:
[
      {
        projectId,
        title: "Example Requirement 1",
        description:
          "A detailed description of the requirement",
        type: "functional",
        priority: "high",
      },
      {
        projectId,
        title: "Example Requirement 2",
        description:
          "A detailed description of the requirement",
        type: "functional",
        priority: "medium",
      },
    ];

    ${text}

    # Instructions
    - Turn the text into functional requirements
    - Keep them short, precise, and detailed.

        Only return the JSON array of requirements, nothing else.
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

  private async parseTechnicalRequirementsFromText(
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
        Turn the following text into technical requirements, using this as example:
[
      {
        projectId,
        title: "Frontend Application",
        description:
          "A frontend application to serve the website",
        type: "technical",
        priority: "high",
      },
      {
        projectId,
        title: "Image Storage",
        description:
          "A bucket to store images uploaded by the users",
        type: "technical",
        priority: "medium",
      },
      {
        projectId,
        title: "Crypto Payment Processing",
        description:
          "A service to handle crypto payments",
        type: "technical",
        priority: "high",
    ];

    ${text}

    # Instructions
    - Turn the text into technical requirements
    - Precise, detailed, and concise.

        Only return the JSON array of requirements, nothing else.
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

  private async generateTechnicalStack(description: string): Promise<string> {
    const schema = z.object({
      technicalStack: z.string(),
    });

    const stack = await technicalRequirementsGeneratorAgent.generate(
      [
        {
          role: "user",
          content: `
          Based on the following requirement description, suggest an appropriate technical stack.
          List the technologies, frameworks, libraries, and tools that would be needed.
          
          Requirement: ${description}
          
          Return valid JSON with only the following structure:
          {
            "technicalStack": "List of technologies (e.g., Node.js, PostgreSQL, React)"
          }
          `,
        },
      ],
      {
        output: schema,
      }
    );

    return stack.object.technicalStack;
  }

  private async generateAcceptanceCriteria(
    description: string
  ): Promise<AcceptanceCriteriaInput[]> {
    const schema = z.array(
      z.object({
        description: z.string(),
      })
    );

    const criteria = await acceptanceCriteriaGeneratorAgent.generate(
      [
        {
          role: "user",
          content: `
          Generate acceptance criteria for the following requirement:
          
          ${description}
          
          Return valid JSON as an array of criteria with the following structure:
          [
            {
              "description": "Criteria 1 description"
            },
            {
              "description": "Criteria 2 description"
            }
          ]
          `,
        },
      ],
      {
        output: schema,
      }
    );

    return criteria.object;
  }
}
