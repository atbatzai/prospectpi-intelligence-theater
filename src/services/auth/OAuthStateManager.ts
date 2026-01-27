/**
 * OAuth State Manager (CSRF Protection)
 * Story 5.1: Enterprise Authentication
 */

import crypto from 'crypto';

interface StateMetadata {
  userId: string | undefined;
  createdAt: number;
}

class OAuthStateManager {
  private states: Map<string, StateMetadata> = new Map();
  private STATE_TTL = 600000; // 10 minutes in milliseconds

  constructor() {
    // Cleanup expired states every 5 minutes
    setInterval(() => this.cleanupExpiredStates(), 300000);
  }

  async generateState(userId?: string): Promise<string> {
    const state = crypto.randomBytes(16).toString('hex');
    const metadata: StateMetadata = {
      userId,
      createdAt: Date.now()
    };

    this.states.set(state, metadata);
    return state;
  }

  async verifyState(state: string): Promise<boolean> {
    const metadata = this.states.get(state);
    
    if (!metadata) {
      return false;
    }

    // Check if expired
    if (Date.now() - metadata.createdAt > this.STATE_TTL) {
      this.states.delete(state);
      return false;
    }

    // Delete state after verification (single-use)
    this.states.delete(state);
    return true;
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, metadata] of this.states.entries()) {
      if (now - metadata.createdAt > this.STATE_TTL) {
        this.states.delete(state);
      }
    }
  }
}

export const oauthStateManager = new OAuthStateManager();
