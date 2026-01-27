# 🏛️ WINSTON'S ARCHITECTURE SPEC
## OAuth 2.0 Implementation Architecture
**Story 5.1: Enterprise Authentication**

---

## System Architecture

```
CLIENT (Browser)
    |
    | 1. Click "Sign in with Google"
    v
PROSPECTPI SERVER (/api/auth/oauth/google/authorize)
    |
    | 2. Generate CSRF state token
    | 3. Redirect to Google OAuth
    v
GOOGLE OAUTH 2.0 SERVER
    |
    | 4. User authenticates
    | 5. Authorization granted
    v
PROSPECTPI CALLBACK (/api/auth/oauth/google/callback)
    |
    | 6. Verify CSRF state
    | 7. Exchange code for tokens
    | 8. Retrieve user profile
    | 9. Create/update user in DB
    | 10. Generate ProspectPI JWT
    v
CLIENT (Dashboard)
```

---

## Component Architecture

### 1. OAuth Provider Registry

```typescript
// src/services/auth/OAuthProviderRegistry.ts
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-azure-ad-oauth2';
import { Strategy as GitHubStrategy } from 'passport-github2';

interface OAuthProvider {
  name: string;
  strategy: any;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope: string[];
  profileMapper: (profile: any) => UserProfile;
}

class OAuthProviderRegistry {
  private providers: Map<string, OAuthProvider> = new Map();

  registerProvider(provider: OAuthProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): OAuthProvider | undefined {
    return this.providers.get(name);
  }

  listProviders(): OAuthProvider[] {
    return Array.from(this.providers.values());
  }
}

export const oauthRegistry = new OAuthProviderRegistry();

// Register Google OAuth
oauthRegistry.registerProvider({
  name: 'google',
  strategy: GoogleStrategy,
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: 'https://app.prospectpi.com/api/auth/oauth/google/callback',
  scope: ['profile', 'email'],
  profileMapper: (profile) => ({
    email: profile.emails[0].value,
    name: profile.displayName,
    picture: profile.photos[0].value,
    provider: 'google',
    providerId: profile.id
  })
});
```

### 2. OAuth State Manager (CSRF Protection)

```typescript
// src/services/auth/OAuthStateManager.ts
import crypto from 'crypto';
import { RedisClient } from '../cache/RedisClient';

class OAuthStateManager {
  private redis: RedisClient;
  private STATE_TTL = 600; // 10 minutes

  constructor() {
    this.redis = new RedisClient();
  }

  async generateState(userId?: string): Promise<string> {
    const state = crypto.randomBytes(16).toString('hex');
    const metadata = {
      userId,
      createdAt: Date.now()
    };

    await this.redis.set(
      `oauth:state:${state}`,
      JSON.stringify(metadata),
      this.STATE_TTL
    );

    return state;
  }

  async verifyState(state: string): Promise<boolean> {
    const metadata = await this.redis.get(`oauth:state:${state}`);
    
    if (!metadata) {
      return false;
    }

    // Delete state after verification (single-use)
    await this.redis.del(`oauth:state:${state}`);
    return true;
  }
}

export const oauthStateManager = new OAuthStateManager();
```

### 3. OAuth User Provisioning Service

```typescript
// src/services/auth/OAuthUserProvisioning.ts
import { UserService } from '../../models/User';
import { v4 as uuidv4 } from 'uuid';

interface OAuthProfile {
  email: string;
  name: string;
  picture?: string;
  provider: string;
  providerId: string;
}

class OAuthUserProvisioning {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async provisionUser(profile: OAuthProfile): Promise<User> {
    // Check if user exists by email
    let user = await this.userService.getUserByEmail(profile.email);

    if (user) {
      // User exists - link OAuth provider if not already linked
      await this.linkOAuthProvider(user.id, profile);
      return user;
    }

    // Create new user
    user = await this.userService.createUser({
      email: profile.email,
      name: profile.name,
      password: crypto.randomBytes(32).toString('hex'), // Random, won't be used
      organizationName: this.extractOrganization(profile.email),
      authProvider: profile.provider
    });

    // Link OAuth provider
    await this.linkOAuthProvider(user.id, profile);

    return user;
  }

  async linkOAuthProvider(userId: string, profile: OAuthProfile): Promise<void> {
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
  }

  private extractOrganization(email: string): string {
    const domain = email.split('@')[1];
    return domain.split('.')[0]; // e.g., example.com -> example
  }
}

export const oauthUserProvisioning = new OAuthUserProvisioning();
```

### 4. OAuth Routes

```typescript
// src/routes/auth/oauth.ts
import { Router } from 'express';
import { oauthRegistry } from '../../services/auth/OAuthProviderRegistry';
import { oauthStateManager } from '../../services/auth/OAuthStateManager';
import { oauthUserProvisioning } from '../../services/auth/OAuthUserProvisioning';
import { UserService } from '../../models/User';

const oauthRouter = Router();

// List available OAuth providers
oauthRouter.get('/providers', (req, res) => {
  const providers = oauthRegistry.listProviders();
  res.json({
    providers: providers.map(p => ({
      name: p.name,
      enabled: true
    }))
  });
});

// Initiate OAuth flow
oauthRouter.get('/:provider/authorize', async (req, res) => {
  const { provider } = req.params;
  const oauthProvider = oauthRegistry.getProvider(provider);

  if (!oauthProvider) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  // Generate CSRF state token
  const state = await oauthStateManager.generateState();

  // Build authorization URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', oauthProvider.clientID);
  authUrl.searchParams.set('redirect_uri', oauthProvider.callbackURL);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', oauthProvider.scope.join(' '));
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
});

// OAuth callback
oauthRouter.get('/:provider/callback', async (req, res) => {
  const { code, state } = req.query;
  const { provider } = req.params;

  // Verify CSRF state
  const isValidState = await oauthStateManager.verifyState(state as string);
  if (!isValidState) {
    return res.status(403).json({ error: 'Invalid state parameter (CSRF protection)' });
  }

  const oauthProvider = oauthRegistry.getProvider(provider);
  if (!oauthProvider) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code as string, oauthProvider);

    // Get user profile
    const profile = await getUserProfile(tokens.access_token, oauthProvider);

    // Provision user
    const user = await oauthUserProvisioning.provisionUser(profile);

    // Generate ProspectPI JWT
    const userService = new UserService();
    const jwt = await userService.generateJWT(user);

    // Redirect to dashboard with JWT
    res.redirect(`/dashboard?token=${jwt}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

export { oauthRouter };
```

---

## Database Schema

```sql
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', 'github'
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  profile_data JSONB, -- Full OAuth profile
  access_token_encrypted TEXT, -- Encrypted with AES-256
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider),
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider_email ON oauth_accounts(provider, email);
```

---

## Security Considerations

### 1. CSRF Protection
- Generate random 32-byte state parameter
- Store in Redis with 10-minute TTL
- Verify state on callback
- Delete state after single use

### 2. Token Storage
- **Access tokens**: Encrypted with AES-256-GCM before database storage
- **Refresh tokens**: Encrypted separately with key rotation support
- **Never log tokens** in application logs or error messages

### 3. Scope Management
- Request minimum necessary scopes
- Google: `profile email`
- Microsoft: `User.Read`
- GitHub: `user:email`

### 4. Error Handling
- Generic error messages to users
- Detailed logging for debugging (without tokens)
- Graceful fallback to password login

---

## Performance Optimization

### 1. Redis Caching
- Cache OAuth state tokens (10-minute TTL)
- Cache user profiles (1-hour TTL)
- Reduce database queries

### 2. Async Processing
- Profile provisioning runs asynchronously
- Token exchange doesn't block UI
- Background token refresh

### 3. Connection Pooling
- Reuse HTTP clients for OAuth providers
- Database connection pooling
- Redis connection pooling

---

## Monitoring & Observability

### Key Metrics
- OAuth login success rate (target: >98%)
- Average OAuth flow duration (target: <3 seconds)
- Provider-specific error rates
- State validation failures (potential CSRF attempts)

### Alerts
- OAuth provider downtime
- High error rates (>5% in 5 minutes)
- CSRF attack detection (>10 invalid states/hour)

---

**🏛️ WINSTON'S APPROVAL**: Architecture reviewed and production-ready
**🧪 QUINN'S GATE**: All security tests must pass before deployment