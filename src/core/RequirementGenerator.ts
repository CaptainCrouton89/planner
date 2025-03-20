import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, discoverySessions, NewDiscoverySession } from "../db/index.js";
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
  RequirementType,
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

      return {
        questions,
        suggestions: this.generateSuggestionsForStage(
          input.stage,
          input.domain
        ),
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
      const shouldAdvance = this.shouldAdvanceToNextStage(
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

      return {
        questions,
        suggestions: this.generateSuggestionsForStage(
          input.stage,
          input.domain
        ),
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
      const requirements: RequirementInput[] = this.parseRequirementsFromText(
        projectId,
        combinedResponses
      );

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
      const requirementInput = this.parseRequirementFromText(
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

  private generateQuestionsForStage(
    stage: DiscoveryStage,
    domain: string,
    previousResponses?: string
  ): string[] {
    // In a real implementation, this would use an LLM to generate questions
    // based on the stage, domain, and previous responses

    const questionsByStage: Record<DiscoveryStage, string[]> = {
      initial: [
        "What is the main problem your project aims to solve?",
        "Who are the primary users or stakeholders?",
        "What are the high-level goals of this project?",
      ],
      stakeholders: [
        "Who will be using the system?",
        "What are their key needs and pain points?",
        "Are there any specific stakeholder constraints to consider?",
      ],
      features: [
        "What are the core features needed for an MVP?",
        "Are there any unique or differentiating features?",
        "Which features would provide the most value to users?",
      ],
      constraints: [
        "What are the budget constraints for this project?",
        "Are there any specific timeline requirements?",
        "Are there any technical limitations or restrictions?",
      ],
      quality: [
        "What performance requirements are important?",
        "How should the system handle errors and exceptions?",
        "What security and privacy considerations are necessary?",
      ],
      finalize: [
        "Are there any requirements we've missed?",
        "Are there any requirements that need to be prioritized differently?",
        "Do any requirements need further clarification?",
      ],
    };

    return questionsByStage[stage] || [];
  }

  private generateSuggestionsForStage(
    stage: DiscoveryStage,
    domain: string
  ): string[] {
    // In a real implementation, this would use an LLM to generate suggestions
    // based on the stage and domain

    const suggestionsByStage: Record<DiscoveryStage, string[]> = {
      initial: [
        "Consider business objectives as well as user needs",
        "Think about both short-term and long-term goals",
      ],
      stakeholders: [
        "Consider both primary and secondary user groups",
        "Think about administrative users as well as end users",
      ],
      features: [
        "Prioritize must-have vs nice-to-have features",
        "Consider how features align with business goals",
      ],
      constraints: [
        "Consider regulatory and compliance requirements",
        "Think about scalability and future growth",
      ],
      quality: [
        "Consider accessibility requirements",
        "Think about how to measure and test quality attributes",
      ],
      finalize: [
        "Review for consistency and completeness",
        "Consider if requirements are testable and measurable",
      ],
    };

    return suggestionsByStage[stage] || [];
  }

  private generateFollowUpQuestions(
    stage: DiscoveryStage,
    domain: string,
    response: string,
    previousResponses?: string
  ): string[] {
    // In a real implementation, this would analyze the response using an LLM
    // and generate tailored follow-up questions
    return [
      "Can you elaborate more on that?",
      "Are there any specific examples you can provide?",
      "How would you prioritize this compared to other needs?",
    ];
  }

  private shouldAdvanceToNextStage(
    currentStage: DiscoveryStage,
    domain: string,
    response: string,
    previousResponses?: string
  ): boolean {
    // In a real implementation, this would use an LLM to analyze the completeness
    // of responses for the current stage

    // For now, just a simple implementation that randomly decides
    return Math.random() > 0.7;
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

  private parseRequirementsFromText(
    projectId: string,
    text: string
  ): RequirementInput[] {
    // In a real implementation, this would use an LLM to parse requirements
    // from the text of discovery responses

    // Placeholder implementation
    return [
      {
        projectId,
        title: "Example Requirement 1",
        description:
          "This is an example requirement parsed from discovery responses",
        type: "functional",
        priority: "high",
        tags: ["example", "discovery"],
      },
      {
        projectId,
        title: "Example Requirement 2",
        description:
          "This is another example requirement parsed from discovery responses",
        type: "technical",
        priority: "medium",
        tags: ["example", "discovery"],
      },
    ];
  }

  private parseRequirementFromText(
    projectId: string,
    description: string
  ): RequirementInput {
    // In a real implementation, this would use an LLM to parse a requirement
    // from natural language

    // Extract a title from the first sentence or phrase
    const title = description.split(/[.!?]/)[0].trim();

    // Determine the type based on keywords
    let type: RequirementType = "functional";
    if (
      description.toLowerCase().includes("technical") ||
      description.toLowerCase().includes("implementation") ||
      description.toLowerCase().includes("architecture")
    ) {
      type = "technical";
    } else if (
      description.toLowerCase().includes("user story") ||
      description.toLowerCase().includes("as a user")
    ) {
      type = "user_story";
    } else if (
      description.toLowerCase().includes("performance") ||
      description.toLowerCase().includes("security") ||
      description.toLowerCase().includes("usability")
    ) {
      type = "non-functional";
    }

    // Extract priority based on keywords
    let priority: RequirementPriority = "medium"; // Type annotation to fix error
    if (
      description.toLowerCase().includes("critical") ||
      description.toLowerCase().includes("highest priority") ||
      description.toLowerCase().includes("must have")
    ) {
      priority = "critical";
    } else if (
      description.toLowerCase().includes("high priority") ||
      description.toLowerCase().includes("important")
    ) {
      priority = "high";
    } else if (
      description.toLowerCase().includes("low priority") ||
      description.toLowerCase().includes("nice to have")
    ) {
      priority = "low";
    }

    // Extract tags from keywords
    const tagKeywords = [
      "performance",
      "security",
      "usability",
      "scalability",
      "reliability",
      "maintainability",
      "accessibility",
      "ui",
      "database",
      "api",
      "authentication",
      "frontend",
      "backend",
    ];

    const tags = tagKeywords.filter((keyword) =>
      description.toLowerCase().includes(keyword)
    );

    return {
      projectId,
      title,
      description,
      type,
      priority,
      tags,
    };
  }
}
