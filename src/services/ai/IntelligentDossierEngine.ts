/**
 * ProspectPI - Intelligent Dossier Enhancement Engine
 * Story 8.3 - Adaptive personalization and learning
 */

import { DatabaseManager } from '../database/DatabaseManager';

interface Interaction {
  userId: string;
  dossierId: string;
  sectionId: string;
  action: 'view' | 'export' | 'share' | 'thumbs_up' | 'thumbs_down';
  timeSpent: number;
  timestamp: Date;
}

interface UserPreferences {
  userId: string;
  preferredSections: string[];
  contentDepth: 'summary' | 'balanced' | 'detailed';
  industryFocus?: string[];
  personalityType?: 'analytical' | 'relationship' | 'results';
  confidenceScore: number;
}

interface DossierTemplate {
  id: string;
  name: string;
  description: string;
  userId: string;
  sectionOrder: string[];
  isPublic: boolean;
  usageCount: number;
}

export class IntelligentDossierEngine {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  /**
   * Track user interaction with dossier content
   * Stores interaction for ML preference learning
   */
  async trackInteraction(interaction: Interaction): Promise<void> {
    await this.db.query(\
      INSERT INTO user_interactions 
        (user_id, dossier_id, section_id, action, time_spent, timestamp)
      VALUES (, , , , , )
    \, [
      interaction.userId,
      interaction.dossierId,
      interaction.sectionId,
      interaction.action,
      interaction.timeSpent,
      interaction.timestamp
    ]);

    // Async preference update (non-blocking)
    setImmediate(() => this.updateUserPreferences(interaction.userId));
  }

  /**
   * Generate personalized dossier based on user preferences
   * Reorders sections, adjusts depth, highlights relevant insights
   */
  async generatePersonalizedDossier(userId: string, company: string): Promise<any> {
    const startTime = Date.now();

    // Get user preferences (cached, <100ms)
    const preferences = await this.getUserPreferences(userId);

    // Generate standard dossier
    const baseDossier = await this.generateStandardDossier(company);

    // Apply personalization
    const personalizedDossier = this.applyPersonalization(baseDossier, preferences);

    const duration = Date.now() - startTime;
    
    // Log if exceeds 500ms target
    if (duration > 500) {
      console.warn(\Personalization took \ms for user \\);
    }

    return personalizedDossier;
  }

  /**
   * Get user preferences from cache or calculate from interactions
   * Target: <100ms retrieval time
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Check cache first
    const cached = await this.db.query(\
      SELECT * FROM user_preferences
      WHERE user_id =  AND updated_at > NOW() - INTERVAL '5 minutes'
    \, [userId]);

    if (cached.rows.length > 0) {
      return cached.rows[0];
    }

    // Calculate from interactions
    return await this.calculatePreferences(userId);
  }

  /**
   * Calculate user preferences from interaction history
   * Uses weighted scoring: recent interactions weighted higher
   */
  private async calculatePreferences(userId: string): Promise<UserPreferences> {
    const interactions = await this.db.query(\
      SELECT 
        section_id,
        action,
        time_spent,
        timestamp,
        EXTRACT(EPOCH FROM (NOW() - timestamp)) / 86400 as days_ago
      FROM user_interactions
      WHERE user_id =  AND timestamp > NOW() - INTERVAL '90 days'
      ORDER BY timestamp DESC
      LIMIT 1000
    \, [userId]);

    const sectionScores: Record<string, number> = {};
    let totalTimeSpent = 0;

    // Score each section
    for (const row of interactions.rows) {
      const recencyWeight = 1 / (1 + row.days_ago / 7); // Decay over weeks
      const actionScore = this.getActionScore(row.action);
      const timeScore = Math.min(row.time_spent / 60, 10); // Cap at 10 mins

      const score = (actionScore + timeScore) * recencyWeight;
      sectionScores[row.section_id] = (sectionScores[row.section_id] || 0) + score;
      totalTimeSpent += row.time_spent;
    }

    // Determine content depth preference
    const avgTimePerSection = totalTimeSpent / Object.keys(sectionScores).length;
    const contentDepth = avgTimePerSection > 300 ? 'detailed' : avgTimePerSection > 120 ? 'balanced' : 'summary';

    // Top preferred sections
    const preferredSections = Object.entries(sectionScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([section]) => section);

    const preferences: UserPreferences = {
      userId,
      preferredSections,
      contentDepth,
      confidenceScore: Math.min(interactions.rows.length / 50, 1.0)
    };

    // Cache preferences
    await this.db.query(\
      INSERT INTO user_preferences (user_id, preferences, updated_at)
      VALUES (, , NOW())
      ON CONFLICT (user_id) DO UPDATE SET preferences = , updated_at = NOW()
    \, [userId, JSON.stringify(preferences)]);

    return preferences;
  }

  /**
   * Apply personalization to base dossier
   * Reorders sections, adjusts content depth, highlights insights
   */
  private applyPersonalization(baseDossier: any, preferences: UserPreferences): any {
    const personalized = { ...baseDossier };

    // Reorder sections based on preference
    if (preferences.preferredSections.length > 0) {
      personalized.sections = this.reorderSections(
        baseDossier.sections,
        preferences.preferredSections
      );
    }

    // Adjust content depth
    personalized.sections = personalized.sections.map((section: any) => ({
      ...section,
      expanded: preferences.contentDepth === 'detailed' || 
                preferences.preferredSections.includes(section.id)
    }));

    // Add personalization metadata
    personalized.personalization = {
      applied: true,
      confidence: preferences.confidenceScore,
      preferredSections: preferences.preferredSections,
      contentDepth: preferences.contentDepth
    };

    return personalized;
  }

  /**
   * Save custom dossier template
   */
  async saveTemplate(userId: string, template: Omit<DossierTemplate, 'id' | 'usageCount'>): Promise<DossierTemplate> {
    const result = await this.db.query(\
      INSERT INTO dossier_templates 
        (user_id, name, description, section_order, is_public)
      VALUES (, , , , )
      RETURNING *
    \, [
      userId,
      template.name,
      template.description,
      JSON.stringify(template.sectionOrder),
      template.isPublic
    ]);

    return result.rows[0];
  }

  /**
   * Suggest template based on user context (industry, role)
   * Uses collaborative filtering
   */
  async suggestTemplate(userId: string, context: any): Promise<DossierTemplate | null> {
    // Find users with similar context
    const similar Users = await this.db.query(\
      SELECT user_id FROM user_context
      WHERE industry =  OR role = 
      AND user_id != 
      LIMIT 100
    \, [context.industry, context.role, userId]);

    // Find most popular template among similar users
    const result = await this.db.query(\
      SELECT t.*, COUNT(ut.id) as usage_count
      FROM dossier_templates t
      JOIN user_template_usage ut ON t.id = ut.template_id
      WHERE ut.user_id = ANY() AND t.is_public = true
      GROUP BY t.id
      ORDER BY usage_count DESC
      LIMIT 1
    \, [similarUsers.rows.map(r => r.user_id)]);

    return result.rows[0] || null;
  }

  /**
   * Update user preferences (async, non-blocking)
   */
  private async updateUserPreferences(userId: string): Promise<void> {
    try {
      await this.calculatePreferences(userId);
    } catch (error) {
      console.error(\Failed to update preferences for user \:\, error);
    }
  }

  /**
   * Helper: Get score for interaction action
   */
  private getActionScore(action: string): number {
    const scores: Record<string, number> = {
      'thumbs_up': 10,
      'export': 8,
      'share': 7,
      'view': 1,
      'thumbs_down': -5
    };
    return scores[action] || 0;
  }

  /**
   * Helper: Reorder sections by preference
   */
  private reorderSections(sections: any[], preferredOrder: string[]): any[] {
    const ordered = [];
    const remaining = [...sections];

    // Add preferred sections first
    for (const prefId of preferredOrder) {
      const idx = remaining.findIndex(s => s.id === prefId);
      if (idx >= 0) {
        ordered.push(remaining.splice(idx, 1)[0]);
      }
    }

    // Add remaining sections
    ordered.push(...remaining);

    return ordered;
  }

  /**
   * Placeholder: Generate standard dossier (delegates to existing system)
   */
  private async generateStandardDossier(company: string): Promise<any> {
    // This would call the main dossier generation pipeline
    return {
      company,
      sections: [
        { id: 'executives', title: 'Key Executives', expanded: false },
        { id: 'technographics', title: 'Technology Stack', expanded: false },
        { id: 'financial', title: 'Financial Health', expanded: false },
        { id: 'news', title: 'Recent News', expanded: false },
        { id: 'competitive', title: 'Competitive Landscape', expanded: false }
      ]
    };
  }
}
