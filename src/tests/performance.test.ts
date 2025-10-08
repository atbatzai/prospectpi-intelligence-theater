/**
 * ProspectPI Intelligence Theater - Performance Tests
 * Story 1.2: REST API Endpoints & Request Handling
 */

import request from 'supertest';
import { ApiServer } from '../server';

describe('API Performance Tests', () => {
  let server: ApiServer;
  let app: any;

  beforeAll(async () => {
    server = new ApiServer();
    app = server.getExpressApp();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('Response Time Validation', () => {
    test('Health check should respond within 200ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(200);
      expect(response.body.status).toBe('healthy');
    });

    test('API documentation should load within 500ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api-docs/')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    test('Auth endpoints should respond within 200ms for validation errors', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
      
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(200);
      expect(response.body.error).toBe('Validation error');
    });

    test('Research endpoint validation should respond within 300ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/v1/research/generate-dossier')
        .send({})
        .expect(400);
      
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(300);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Concurrent Request Handling', () => {
    test('Should handle 5 concurrent health checks', async () => {
      const requests = Array(5).fill(0).map(() =>
        request(app)
          .get('/health')
          .expect(200)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(1000); // All requests within 1 second
      responses.forEach(response => {
        expect(response.body.status).toBe('healthy');
      });
    });

    test('Should handle rate limiting correctly under concurrent load', async () => {
      // Create 15 concurrent requests to trigger rate limiting (10 req/min limit)
      const requests = Array(15).fill(0).map(() =>
        request(app)
          .post('/api/v1/research/generate-dossier')
          .send({ companyName: 'Test Company' })
      );

      const responses = await Promise.allSettled(requests);
      
      // Some should succeed, some should be rate limited
      const successfulRequests = responses.filter(r => 
        r.status === 'fulfilled' && (r as any).value.status < 400
      );
      const rateLimitedRequests = responses.filter(r => 
        r.status === 'fulfilled' && (r as any).value.status === 429
      );

      expect(rateLimitedRequests.length).toBeGreaterThan(0);
      expect(successfulRequests.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Memory and Resource Usage', () => {
    test('Should maintain stable memory usage during multiple requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 50 health check requests
      const requests = Array(50).fill(0).map(() =>
        request(app)
          .get('/health')
          .expect(200)
      );

      await Promise.all(requests);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 20MB)
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
    });
  });
});