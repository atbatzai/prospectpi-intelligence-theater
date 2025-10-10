/**
 * Database Integration Tests
 * Story 1.4: Database Schema & User Management
 */

import { DatabaseManager } from '../database/DatabaseManager';
import { UserService, OrganizationService } from '../models/User';
import { ResearchRequestService } from '../models/ResearchRequest';
import { DossierService } from '../models/Dossier';
import { AuditService } from '../services/AuditService';

describe('Database Integration Tests', () => {
  let dbManager: DatabaseManager;
  let userService: UserService;
  let orgService: OrganizationService;
  let requestService: ResearchRequestService;
  let dossierService: DossierService;
  let auditService: AuditService;
  
  // Shared test data
  let testOrgSlug: string;
  let testUser: any;
  let testOrg: any;

  beforeAll(async () => {
    dbManager = DatabaseManager.getInstance();
    await DatabaseManager.initialize();
    
    userService = new UserService();
    orgService = new OrganizationService();
    requestService = new ResearchRequestService();
    dossierService = new DossierService();
    
    // Verify services are initialized
    expect(userService).toBeDefined();
    expect(dossierService).toBeDefined();
    auditService = new AuditService();
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('User Management', () => {
    test('should create organization and user', async () => {
      testOrgSlug = 'test-org-' + Date.now();
      
      testOrg = await orgService.createOrganization({
        name: 'Test Organization',
        slug: testOrgSlug,
        subscription_tier: 'starter',
        billing_email: 'billing@test.com'
      });

      expect(testOrg.id).toBeDefined();
      expect(testOrg.name).toBe('Test Organization');
      expect(testOrg.subscription_tier).toBe('starter');

      testUser = await userService.createUser({
        email: 'test-' + Date.now() + '@example.com',
        password: 'securepassword123',
        first_name: 'John',
        last_name: 'Doe',
        organization_id: testOrg.id
      });

      expect(testUser.id).toBeDefined();
      expect(testUser.email).toContain('@example.com');
      expect(testUser.first_name).toBe('John');
      expect(testUser.organization_id).toBe(testOrg.id);
    });

    test('should authenticate user and generate JWT', async () => {
      const authResult = await userService.authenticateUser(testUser.email, 'securepassword123');
      
      expect(authResult.success).toBe(true);
      expect(authResult.user).toBeDefined();
      expect(authResult.token).toBeDefined();
    });
  });

  describe('Research Request Management', () => {
    test('should create and track research request', async () => {
      if (!testUser || !testOrg) throw new Error('User or org not found');

      const request = await requestService.createRequest(
        {
          companyName: 'Acme Corp',
          companyUrl: 'https://acme.com',
          linkedinUrl: 'https://linkedin.com/company/acme',
          // NEW REQUIRED FIELDS
          vendorName: 'TechSolutions Inc',
          productName: 'Enterprise Platform',
          industry: 'Technology', 
          primaryPainPoint: 'Digital transformation challenges',
          // EXISTING OPTIONAL FIELDS
          organizationFocus: 'Technology',
          locationOfInterest: 'San Francisco',
          additionalContext: 'Looking for partnership opportunities'
        },
        testUser.id,
        testOrg.id,
        'req_test_' + Date.now()
      );

      expect(request.id).toBeDefined();
      expect(request.company_name).toBe('Acme Corp');
      expect(request.status).toBe('processing');
      expect(request.priority).toBe('standard');
    });
  });

  describe('Audit Logging', () => {
    test('should log API usage and audit events', async () => {
      if (!testUser || !testOrg) throw new Error('User or org not found');

      // Log audit event
      const auditEntry = await auditService.logAction(
        'CREATE_USER',
        'user',
        testUser.id,
        testUser.id,
        { action: 'user registration' },
        '127.0.0.1',
        'Jest Test Suite'
      );

      expect(auditEntry.id).toBeDefined();
      expect(auditEntry.action).toBe('CREATE_USER');
      expect(auditEntry.user_id).toBe(testUser.id);

      // Log API usage
      const apiUsage = await auditService.logAPIUsage(
        testUser.id,
        testOrg.id,
        '/api/research/generate',
        'POST',
        200,
        1250,
        'req_test_123',
        '127.0.0.1',
        'Jest Test Suite',
        1024,
        2048
      );

      expect(apiUsage.id).toBeDefined();
      expect(apiUsage.endpoint).toBe('/api/research/generate');
      expect(apiUsage.status_code).toBe(200);
    });
  });

  describe('Database Configuration', () => {
    test('should handle both SQLite and PostgreSQL configurations', () => {
      const config = dbManager.getConfig();
      expect(config.type).toMatch(/sqlite|postgresql/);
      
      if (config.type === 'sqlite') {
        expect(config.sqlite?.path).toBeDefined();
      } else if (config.type === 'postgresql') {
        expect(config.postgresql?.host).toBeDefined();
        expect(config.postgresql?.port).toBeDefined();
        expect(config.postgresql?.database).toBeDefined();
      }
    });

    test('should perform basic database operations', async () => {
      // Test unified query interface
      const result = await dbManager.query('SELECT 1 as test_value');
      expect(result).toHaveLength(1);
      expect(result[0].test_value).toBe(1);

      const singleResult = await dbManager.queryOne('SELECT 1 as test_value');
      expect(singleResult.test_value).toBe(1);
    });
  });
});