/**
 * OAuth User Provisioning Service
 * Story 5.1: Enterprise Authentication
 */

import { UserService } from '../../models/User';
import { DatabaseManager } from '../../database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { OAuthProfile } from './OAuthProviderRegistry';

class OAuthUserProvisioning {
  private userService: UserService;
  private dbManager: DatabaseManager;

  constructor() {
    this.userService = new UserService();
    this.dbManager = DatabaseManager.getInstance();
  }

  async provisionUser(profile: OAuthProfile): Promise<any> {
    // Check if user exists by email
    let user = await this.userService.getUserByEmail(profile.email);

    if (user) {
      // User exists - link OAuth provider if not already linked
      await this.linkOAuthProvider(user.id, profile);
      return user;
    }

    // Create new user
    const [firstName, ...lastNameParts] = profile.name.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    user = await this.userService.createUser({
      email: profile.email,
      first_name: firstName,
      last_name: lastName,
      password: crypto.randomBytes(32).toString('hex') // Random password (won't be used)
    });

    // Link OAuth provider
    await this.linkOAuthProvider(user.id, profile);

    return user;
  }

  async linkOAuthProvider(userId: string, profile: OAuthProfile): Promise<void> {
    try {
      // Check if oauth_accounts table exists
      await this.dbManager.execute(`
        CREATE TABLE IF NOT EXISTS oauth_accounts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          provider_user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          profile_data TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, provider),
          UNIQUE(provider, provider_user_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Insert or update OAuth account
      await this.dbManager.execute(`
        INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, email, profile_data)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (user_id, provider) DO UPDATE SET
          provider_user_id = excluded.provider_user_id,
          profile_data = excluded.profile_data,
          updated_at = CURRENT_TIMESTAMP
      `, [
        uuidv4(),
        userId,
        profile.provider,
        profile.providerId,
        profile.email,
        JSON.stringify(profile)
      ]);
    } catch (error) {
      console.error('Failed to link OAuth provider:', error);
      throw error;
    }
  }

  private extractOrganization(email: string): string {
    const domain = email.split('@')[1];
    if (!domain) return 'Personal';
    const orgName = domain.split('.')[0];
    return orgName.charAt(0).toUpperCase() + orgName.slice(1);
  }
}

export const oauthUserProvisioning = new OAuthUserProvisioning();
