/**
 * OAuth 2.0 Provider Registry
 * Story 5.1: Enterprise Authentication
 */

import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';

export interface OAuthProfile {
  email: string;
  name: string;
  picture: string | undefined;
  provider: string;
  providerId: string;
}

export interface OAuthProvider {
  name: string;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope: string[];
  authorizationURL: string;
  tokenURL: string;
  profileMapper: (profile: any) => OAuthProfile;
}

class OAuthProviderRegistry {
  private providers: Map<string, OAuthProvider> = new Map();

  registerProvider(provider: OAuthProvider): void {
    this.providers.set(provider.name, provider);
    
    // Configure Passport strategy
    if (provider.name === 'google') {
      passport.use(new GoogleStrategy({
        clientID: provider.clientID,
        clientSecret: provider.clientSecret,
        callbackURL: provider.callbackURL
      }, (accessToken, refreshToken, profile, done) => {
        const oauthProfile = provider.profileMapper(profile);
        done(null, oauthProfile);
      }));
    }
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
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauthRegistry.registerProvider({
    name: 'google',
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/oauth/google/callback',
    scope: ['profile', 'email'],
    authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token',
    profileMapper: (profile: any) => ({
      email: profile.emails?.[0]?.value || '',
      name: profile.displayName || '',
      picture: profile.photos?.[0]?.value || undefined,
      provider: 'google',
      providerId: profile.id
    })
  });
}

// Register Microsoft OAuth (Azure AD)
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  oauthRegistry.registerProvider({
    name: 'microsoft',
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3001/api/auth/oauth/microsoft/callback',
    scope: ['user.read'],
    authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    profileMapper: (profile: any) => ({
      email: profile.mail || profile.userPrincipalName || '',
      name: profile.displayName || '',
      picture: profile.photo || undefined,
      provider: 'microsoft',
      providerId: profile.id
    })
  });
}

// Register GitHub OAuth (for development)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  oauthRegistry.registerProvider({
    name: 'github',
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/oauth/github/callback',
    scope: ['user:email'],
    authorizationURL: 'https://github.com/login/oauth/authorize',
    tokenURL: 'https://github.com/login/oauth/access_token',
    profileMapper: (profile: any) => ({
      email: profile.emails?.[0]?.value || '',
      name: profile.displayName || profile.username || '',
      picture: profile.photos?.[0]?.value || undefined,
      provider: 'github',
      providerId: profile.id.toString()
    })
  });
}
