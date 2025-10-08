/**
 * ProspectPI Intelligence Theater - API Integration Tests
 * Story 1.2: REST API Endpoints & Request Handling
 */

import request from 'supertest';
import { ApiServer } from '../server';
import express from 'express';

describe('ProspectPI API Integration Tests', () => {
  let app: express.Application;
  let server: ApiServer;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    
    // Create test server instance
    server = new ApiServer();
    app = server.getExpressApp();
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('POST /api/v1/research/generate-dossier', () => {
    test('should validate required companyName field', async () => {
      const invalidPayload = {
        companyUrl: 'https://example.com'
        // Missing companyName
      };

      const response = await request(app)
        .post('/api/v1/research/generate-dossier')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('validation failed');
    });

    test('should accept valid research request', async () => {
      const validPayload = {
        companyName: 'OpenAI',
        companyUrl: 'https://openai.com',
        linkedinUrl: 'https://linkedin.com/company/openai',
        crmNotes: 'Interested in AI integration',
        organizationFocus: 'AI Research Division',
        locationOfInterest: 'San Francisco',
        contextLinks: ['https://news.com/openai-news'],
        additionalContext: 'Focus on GPT capabilities'
      };

      const response = await request(app)
        .post('/api/v1/research/generate-dossier')
        .send(validPayload)
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.requestId).toMatch(/^req_[a-f0-9]{12}$/);
      expect(response.body.status).toBe('processing');
      expect(response.body.websocketUrl).toContain('/ws');
    });

    test('should reject invalid LinkedIn URL format', async () => {
      const invalidPayload = {
        companyName: 'TestCorp',
        linkedinUrl: 'https://facebook.com/testcorp' // Wrong domain
      };

      const response = await request(app)
        .post('/api/v1/research/generate-dossier')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should enforce character limits', async () => {
      const longText = 'a'.repeat(2001);
      const invalidPayload = {
        companyName: 'TestCorp',
        additionalContext: longText
      };

      const response = await request(app)
        .post('/api/v1/research/generate-dossier')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle rate limiting', async () => {
      const validPayload = { companyName: 'TestCorp' };
      
      // Make multiple requests to trigger rate limit
      const requests = Array(12).fill(null).map(() =>
        request(app)
          .post('/api/v1/research/generate-dossier')
          .send(validPayload)
      );

      const responses = await Promise.all(requests);
      
      // Should have some 429 responses due to rate limiting
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'ProspectPI Intelligence Theater API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/unknown-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('CORS Configuration', () => {
    test('should include CORS headers for Lovable frontend', async () => {
      const response = await request(app)
        .options('/api/v1/research/generate-dossier')
        .set('Origin', 'https://lovable.dev')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeTruthy();
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });
});