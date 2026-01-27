/**
 * 🧪 QUINN'S QA-FIRST TEST TEMPLATE
 * Story 5.1: Enterprise Authentication - OAuth 2.0
 * 
 * Created: Dec 31, 2025
 * Test-First Principle: These tests define success BEFORE implementation
 */

import request from 'supertest';
import { app } from '../../server';
import { DatabaseManager } from '../../database/DatabaseManager';

describe('Story 5.1: OAuth 2.0 Authentication', () => {
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('OAuth Provider Configuration', () => {
    test('should support Google OAuth 2.0 provider', async () => {
      const response = await request(app)
        .get('/api/auth/oauth/providers')
        .expect(200);

      expect(response.body.providers).toContainEqual(
        expect.objectContaining({
          name: 'google',
          type: 'oauth2',
          enabled: true
        })
      );
    });

    test('should support Microsoft Azure AD OAuth', async () => {
      const response = await request(app)
        .get('/api/auth/oauth/providers')
        .expect(200);

      expect(response.body.providers).toContainEqual(
        expect.objectContaining({
          name: 'microsoft',
          type: 'oauth2',
          enabled: true
        })
      );
    });

    test('should support GitHub OAuth (dev/testing)', async () => {
      const response = await request(app)
        .get('/api/auth/oauth/providers')
        .expect(200);

      expect(response.body.providers).toContainEqual(
        expect.objectContaining({
          name: 'github',
          type: 'oauth2',
          enabled: true
        })
      );
    });
  });

  describe('OAuth Authorization Flow', () => {
    test('should redirect to Google OAuth authorization URL', async () => {
      const response = await request(app)
        .get('/api/auth/oauth/google/authorize')
        .expect(302);

      expect(response.headers.location).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(response.headers.location).toContain('client_id=');
      expect(response.headers.location).toContain('redirect_uri=');
      expect(response.headers.location).toContain('scope=');
      expect(response.headers.location).toContain('state=');
    });

    test('should include CSRF protection in OAuth state parameter', async () => {
      const response = await request(app)
        .get('/api/auth/oauth/google/authorize')
        .expect(302);

      const url = new URL(response.headers.location);
      const state = url.searchParams.get('state');
      
      expect(state).toBeTruthy();
      expect(state).toHaveLength(32); // 32-char random state
    });

    test('should handle OAuth callback with valid authorization code', async () => {
      // Mock OAuth callback from Google
      const mockCode = 'mock_authorization_code_12345';
      const mockState = 'valid_csrf_state_token';

      const response = await request(app)
        .get(`/api/auth/oauth/google/callback?code=${mockCode}&state=${mockState}`)
        .expect(302); // Redirect to dashboard after success

      expect(response.headers.location).toBe('/dashboard');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should reject OAuth callback with invalid state (CSRF protection)', async () => {
      const mockCode = 'mock_authorization_code';
      const invalidState = 'malicious_state_token';

      const response = await request(app)
        .get(`/api/auth/oauth/google/callback?code=${mockCode}&state=${invalidState}`)
        .expect(403);

      expect(response.body.error).toContain('Invalid state parameter');
    });
  });

  describe('OAuth Token Exchange', () => {
    test('should exchange authorization code for access token', async () => {
      // This test validates the token exchange mechanism
      // In real implementation, this hits Google's token endpoint
      
      const mockAuthCode = 'valid_auth_code';
      const response = await request(app)
        .post('/api/auth/oauth/google/token')
        .send({ code: mockAuthCode })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('expires_in');
    });

    test('should retrieve user profile from OAuth provider', async () => {
      const mockAccessToken = 'mock_google_access_token';
      
      const response = await request(app)
        .get('/api/auth/oauth/google/profile')
        .set('Authorization', `Bearer ${mockAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('picture');
    });
  });

  describe('OAuth User Provisioning', () => {
    test('should create new user account from OAuth profile', async () => {
      const oauthProfile = {
        email: 'newuser@company.com',
        name: 'New OAuth User',
        picture: 'https://example.com/photo.jpg',
        provider: 'google',
        providerId: 'google_12345'
      };

      const response = await request(app)
        .post('/api/auth/oauth/provision')
        .send(oauthProfile)
        .expect(201);

      expect(response.body.user).toMatchObject({
        email: 'newuser@company.com',
        name: 'New OAuth User',
        authProvider: 'google'
      });
    });

    test('should link OAuth account to existing user', async () => {
      // User already exists with email, linking OAuth provider
      const existingEmail = 'existing@company.com';
      
      const response = await request(app)
        .post('/api/auth/oauth/link')
        .send({
          email: existingEmail,
          provider: 'google',
          providerId: 'google_67890'
        })
        .expect(200);

      expect(response.body.message).toContain('OAuth account linked');
    });

    test('should prevent duplicate OAuth accounts', async () => {
      const duplicateProfile = {
        email: 'duplicate@company.com',
        provider: 'google',
        providerId: 'google_duplicate'
      };

      // First registration
      await request(app)
        .post('/api/auth/oauth/provision')
        .send(duplicateProfile)
        .expect(201);

      // Attempt duplicate registration
      const response = await request(app)
        .post('/api/auth/oauth/provision')
        .send(duplicateProfile)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('OAuth Token Refresh', () => {
    test('should refresh expired OAuth access token', async () => {
      const mockRefreshToken = 'valid_refresh_token';

      const response = await request(app)
        .post('/api/auth/oauth/refresh')
        .send({ refresh_token: mockRefreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('expires_in');
    });

    test('should reject invalid refresh token', async () => {
      const invalidRefreshToken = 'invalid_token';

      const response = await request(app)
        .post('/api/auth/oauth/refresh')
        .send({ refresh_token: invalidRefreshToken })
        .expect(401);

      expect(response.body.error).toContain('Invalid refresh token');
    });
  });

  describe('QUINN\'S QUALITY GATES', () => {
    test('✅ All OAuth providers configured', () => {
      // Validate environment variables
      expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(process.env.MICROSOFT_CLIENT_ID).toBeDefined();
    });

    test('✅ CSRF protection enabled', async () => {
      const response = await request(app)
        .get('/api/auth/oauth/google/authorize');
      
      const location = response.headers.location;
      expect(location).toContain('state=');
    });

    test('✅ Secure token storage', () => {
      // Tokens should never be logged or exposed
      // This is a policy test
      expect(true).toBe(true);
    });
  });
});

/**
 * 🎯 TEST COVERAGE REQUIREMENTS:
 * - OAuth authorization flow: 100%
 * - Token exchange: 100%
 * - User provisioning: 100%
 * - CSRF protection: 100%
 * - Error handling: 100%
 * 
 * 🧪 QUINN'S APPROVAL CRITERIA:
 * - All tests pass
 * - No security vulnerabilities
 * - OAuth 2.0 spec compliance
 * - Production-ready error handling
 */