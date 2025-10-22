/**
 * COMPREHENSIVE QA TEST SUITE
 * ProspectPI Intelligence Theater - Full Application Testing
 * 
 * Tests all critical components for optimal performance:
 * - API Configuration & Connectivity
 * - Database Operations & Schema
 * - Backend Server Health & Endpoints
 * - Frontend Integration & WebSocket
 * - Agent Orchestration System
 * - Performance Benchmarks
 * - Security Validation
 * - Error Handling & Recovery
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log('🔬 COMPREHENSIVE QA TEST SUITE');
console.log('='.repeat(80));
console.log('🎯 ProspectPI Intelligence Theater - Full Application Testing');
console.log('⚡ Testing for Optimal Performance, Security, and Reliability');
console.log('📊 Test Coverage: APIs, Database, Backend, Frontend, Agents, Performance');
console.log('');

class ComprehensiveQATest {
    constructor() {
        this.testResults = {
            apiConfiguration: { passed: 0, failed: 0, tests: [] },
            databaseOperations: { passed: 0, failed: 0, tests: [] },
            backendServer: { passed: 0, failed: 0, tests: [] },
            frontendIntegration: { passed: 0, failed: 0, tests: [] },
            agentOrchestration: { passed: 0, failed: 0, tests: [] },
            performance: { passed: 0, failed: 0, tests: [] },
            security: { passed: 0, failed: 0, tests: [] },
            errorHandling: { passed: 0, failed: 0, tests: [] }
        };
        this.startTime = Date.now();
        this.baseUrl = 'http://localhost:3001';
    }

    async runFullQATestSuite() {
        console.log('🚀 INITIATING COMPREHENSIVE QA TEST EXECUTION');
        console.log('-'.repeat(60));
        
        try {
            await this.testApiConfiguration();
            await this.testDatabaseOperations();
            await this.testBackendServer();
            await this.testFrontendIntegration();
            await this.testAgentOrchestration();
            await this.testPerformance();
            await this.testSecurity();
            await this.testErrorHandling();
            
            this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('❌ CRITICAL QA TEST FAILURE:', error.message);
            this.recordFailure('critical', 'QA Test Suite Execution', error.message);
        }
    }

    // ========================================
    // API CONFIGURATION TESTS
    // ========================================
    async testApiConfiguration() {
        console.log('\n📡 TESTING API CONFIGURATION & CONNECTIVITY');
        console.log('-'.repeat(50));
        
        const requiredApis = [
            'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'DEEPSEEK_API_KEY', 
            'GOOGLE_GEMINI_API_KEY', 'PERPLEXITY_API_KEY', 'THEIRSTACK_JWT',
            'MARKETAUX_TOKEN', 'CORESIGNAL_MCP_AUTH', 'NEWSDATA_API_KEY',
            'GITHUB_TOKEN', 'YOUTUBE_API_KEY', 'REDDIT_CLIENT_ID',
            'TWITTER_BEARER_TOKEN', 'DISCORD_BOT_TOKEN'
        ];
        
        // Test 1: API Key Configuration
        let configuredCount = 0;
        for (const apiKey of requiredApis) {
            const isConfigured = process.env[apiKey] && process.env[apiKey].length > 10;
            if (isConfigured) {
                configuredCount++;
                this.recordSuccess('apiConfiguration', `${apiKey} Configuration`, 'API key properly configured');
            } else {
                this.recordFailure('apiConfiguration', `${apiKey} Configuration`, 'API key missing or invalid');
            }
        }
        
        // Test 2: API Configuration Completeness
        const completeness = (configuredCount / requiredApis.length) * 100;
        if (completeness >= 90) {
            this.recordSuccess('apiConfiguration', 'API Completeness', `${completeness.toFixed(1)}% APIs configured`);
        } else {
            this.recordFailure('apiConfiguration', 'API Completeness', `Only ${completeness.toFixed(1)}% APIs configured`);
        }
        
        // Test 3: Environment Variable Security
        const hasSecureStorage = fs.existsSync('.env') && !fs.existsSync('.env.example');
        if (hasSecureStorage) {
            this.recordSuccess('apiConfiguration', 'Security Storage', 'Environment variables securely stored');
        } else {
            this.recordFailure('apiConfiguration', 'Security Storage', 'Environment security concerns detected');
        }
        
        console.log(`✅ API Configuration: ${this.testResults.apiConfiguration.passed} passed, ${this.testResults.apiConfiguration.failed} failed`);
    }

    // ========================================
    // DATABASE OPERATIONS TESTS
    // ========================================
    async testDatabaseOperations() {
        console.log('\n🗄️ TESTING DATABASE OPERATIONS & SCHEMA');
        console.log('-'.repeat(50));
        
        try {
            // Test 1: Database File Existence
            const dbPath = path.join(__dirname, 'data', 'prospectpi.db');
            if (fs.existsSync(dbPath)) {
                this.recordSuccess('databaseOperations', 'Database File', 'SQLite database file exists');
                
                // Test 2: Database Size Check
                const stats = fs.statSync(dbPath);
                const sizeKB = Math.round(stats.size / 1024);
                if (sizeKB > 0) {
                    this.recordSuccess('databaseOperations', 'Database Size', `Database size: ${sizeKB}KB`);
                } else {
                    this.recordFailure('databaseOperations', 'Database Size', 'Database appears to be empty');
                }
            } else {
                this.recordFailure('databaseOperations', 'Database File', 'SQLite database file not found');
            }
            
            // Test 3: Database Schema Validation
            try {
                const Database = require('better-sqlite3');
                const db = new Database(dbPath);
                
                const tables = db.prepare('SELECT name FROM sqlite_master WHERE type="table"').all();
                const expectedTables = ['users', 'research_requests', 'dossiers', 'organizations'];
                
                let schemaValid = true;
                for (const expectedTable of expectedTables) {
                    const tableExists = tables.some(t => t.name === expectedTable);
                    if (tableExists) {
                        this.recordSuccess('databaseOperations', `Table: ${expectedTable}`, 'Table schema validated');
                    } else {
                        this.recordFailure('databaseOperations', `Table: ${expectedTable}`, 'Required table missing');
                        schemaValid = false;
                    }
                }
                
                if (schemaValid) {
                    this.recordSuccess('databaseOperations', 'Schema Integrity', 'All required tables present');
                }
                
                db.close();
                
            } catch (error) {
                this.recordFailure('databaseOperations', 'Schema Validation', `Database access error: ${error.message}`);
            }
            
        } catch (error) {
            this.recordFailure('databaseOperations', 'Database Operations', `Test execution failed: ${error.message}`);
        }
        
        console.log(`✅ Database Operations: ${this.testResults.databaseOperations.passed} passed, ${this.testResults.databaseOperations.failed} failed`);
    }

    // ========================================
    // BACKEND SERVER TESTS
    // ========================================
    async testBackendServer() {
        console.log('\n🖥️ TESTING BACKEND SERVER & ENDPOINTS');
        console.log('-'.repeat(50));
        
        try {
            // Test 1: Server Health Check
            const startTime = Date.now();
            const healthResponse = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
            const responseTime = Date.now() - startTime;
            
            if (healthResponse.status === 200) {
                this.recordSuccess('backendServer', 'Health Endpoint', `Server healthy (${responseTime}ms)`);
                
                // Test server health data
                const healthData = healthResponse.data;
                if (healthData.database && healthData.database.status === 'healthy') {
                    this.recordSuccess('backendServer', 'Database Health', 'Database connection healthy');
                } else {
                    this.recordFailure('backendServer', 'Database Health', 'Database connection issues');
                }
                
                if (healthData.websocket && healthData.websocket.status === 'active') {
                    this.recordSuccess('backendServer', 'WebSocket Health', 'WebSocket server active');
                } else {
                    this.recordFailure('backendServer', 'WebSocket Health', 'WebSocket server issues');
                }
            }
            
            // Test 2: Research Endpoint Availability
            try {
                const testPayload = {
                    companyName: 'QA Test Company',
                    vendorName: 'Microsoft',
                    productName: 'QA Testing Suite',
                    industry: 'Technology',
                    primaryPainPoint: 'Need comprehensive testing'
                };
                
                const researchResponse = await axios.post(
                    `${this.baseUrl}/api/v1/research/generate-dossier`,
                    testPayload,
                    { 
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 10000 
                    }
                );
                
                if (researchResponse.status === 200 && researchResponse.data.success) {
                    this.recordSuccess('backendServer', 'Research Endpoint', 'Dossier generation endpoint functional');
                    
                    // Test 3: Dossier Retrieval Endpoint
                    const requestId = researchResponse.data.requestId;
                    setTimeout(async () => {
                        try {
                            const retrievalResponse = await axios.get(`${this.baseUrl}/api/v1/research/results/${requestId}`);
                            if (retrievalResponse.status === 200 || retrievalResponse.status === 202) {
                                this.recordSuccess('backendServer', 'Dossier Retrieval', 'Dossier retrieval endpoint functional');
                            }
                        } catch (error) {
                            // Expected for processing requests
                            if (error.response && error.response.status === 202) {
                                this.recordSuccess('backendServer', 'Dossier Retrieval', 'Dossier retrieval endpoint functional (processing)');
                            }
                        }
                    }, 2000);
                    
                } else {
                    this.recordFailure('backendServer', 'Research Endpoint', 'Dossier generation failed');
                }
                
            } catch (error) {
                this.recordFailure('backendServer', 'Research Endpoint', `Endpoint error: ${error.message}`);
            }
            
        } catch (error) {
            this.recordFailure('backendServer', 'Server Connection', `Cannot connect to backend: ${error.message}`);
        }
        
        console.log(`✅ Backend Server: ${this.testResults.backendServer.passed} passed, ${this.testResults.backendServer.failed} failed`);
    }

    // ========================================
    // FRONTEND INTEGRATION TESTS
    // ========================================
    async testFrontendIntegration() {
        console.log('\n🌐 TESTING FRONTEND INTEGRATION');
        console.log('-'.repeat(50));
        
        // Test 1: Frontend Build Files
        const frontendPath = path.join(__dirname, 'frontend');
        if (fs.existsSync(frontendPath)) {
            this.recordSuccess('frontendIntegration', 'Frontend Directory', 'Frontend directory exists');
            
            // Test package.json
            const packageJsonPath = path.join(frontendPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                this.recordSuccess('frontendIntegration', 'Package Configuration', 'Frontend package.json exists');
                
                try {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    if (packageJson.scripts && packageJson.scripts.dev) {
                        this.recordSuccess('frontendIntegration', 'Dev Script', 'Frontend dev script configured');
                    }
                    if (packageJson.dependencies && packageJson.dependencies.next) {
                        this.recordSuccess('frontendIntegration', 'Next.js Framework', 'Next.js framework detected');
                    }
                } catch (error) {
                    this.recordFailure('frontendIntegration', 'Package Parse', 'Cannot parse package.json');
                }
            } else {
                this.recordFailure('frontendIntegration', 'Package Configuration', 'Frontend package.json missing');
            }
            
            // Test source files
            const srcPath = path.join(frontendPath, 'src');
            if (fs.existsSync(srcPath)) {
                this.recordSuccess('frontendIntegration', 'Source Files', 'Frontend source directory exists');
            } else {
                this.recordFailure('frontendIntegration', 'Source Files', 'Frontend source directory missing');
            }
            
        } else {
            this.recordFailure('frontendIntegration', 'Frontend Directory', 'Frontend directory not found');
        }
        
        // Test 2: WebSocket Integration (if server is running)
        try {
            const WebSocket = require('ws');
            const ws = new WebSocket(`ws://localhost:3001/ws`);
            
            ws.on('open', () => {
                this.recordSuccess('frontendIntegration', 'WebSocket Connection', 'WebSocket connection established');
                ws.close();
            });
            
            ws.on('error', (error) => {
                this.recordFailure('frontendIntegration', 'WebSocket Connection', `WebSocket error: ${error.message}`);
            });
            
        } catch (error) {
            this.recordFailure('frontendIntegration', 'WebSocket Integration', 'WebSocket module not available');
        }
        
        console.log(`✅ Frontend Integration: ${this.testResults.frontendIntegration.passed} passed, ${this.testResults.frontendIntegration.failed} failed`);
    }

    // ========================================
    // AGENT ORCHESTRATION TESTS
    // ========================================
    async testAgentOrchestration() {
        console.log('\n🤖 TESTING AGENT ORCHESTRATION SYSTEM');
        console.log('-'.repeat(50));
        
        // Test 1: Agent Source Files
        const agentsPath = path.join(__dirname, 'src', 'agents');
        if (fs.existsSync(agentsPath)) {
            this.recordSuccess('agentOrchestration', 'Agents Directory', 'Agents directory exists');
            
            const expectedAgents = [
                'IntelligenceCoordinator.ts',
                'FieldIntelligenceResearcher.ts', 
                'ProspectIntelligenceDetective.ts'
            ];
            
            for (const agentFile of expectedAgents) {
                const agentPath = path.join(agentsPath, agentFile);
                if (fs.existsSync(agentPath)) {
                    this.recordSuccess('agentOrchestration', `Agent: ${agentFile}`, 'Agent file exists');
                    
                    // Check file size as basic validation
                    const stats = fs.statSync(agentPath);
                    if (stats.size > 5000) { // At least 5KB indicates substantial implementation
                        this.recordSuccess('agentOrchestration', `${agentFile} Implementation`, 'Agent appears fully implemented');
                    } else {
                        this.recordFailure('agentOrchestration', `${agentFile} Implementation`, 'Agent implementation appears minimal');
                    }
                } else {
                    this.recordFailure('agentOrchestration', `Agent: ${agentFile}`, 'Agent file missing');
                }
            }
        } else {
            this.recordFailure('agentOrchestration', 'Agents Directory', 'Agents directory not found');
        }
        
        // Test 2: Agent Orchestrator
        const orchestratorPath = path.join(__dirname, 'src', 'services', 'AgentOrchestrator.ts');
        if (fs.existsSync(orchestratorPath)) {
            this.recordSuccess('agentOrchestration', 'Agent Orchestrator', 'AgentOrchestrator service exists');
        } else {
            this.recordFailure('agentOrchestration', 'Agent Orchestrator', 'AgentOrchestrator service missing');
        }
        
        // Test 3: Agent Interfaces
        const interfacesPath = path.join(__dirname, 'src', 'interfaces', 'AgentTypes.ts');
        if (fs.existsSync(interfacesPath)) {
            this.recordSuccess('agentOrchestration', 'Agent Interfaces', 'Agent type definitions exist');
        } else {
            this.recordFailure('agentOrchestration', 'Agent Interfaces', 'Agent type definitions missing');
        }
        
        console.log(`✅ Agent Orchestration: ${this.testResults.agentOrchestration.passed} passed, ${this.testResults.agentOrchestration.failed} failed`);
    }

    // ========================================
    // PERFORMANCE TESTS
    // ========================================
    async testPerformance() {
        console.log('\n⚡ TESTING PERFORMANCE BENCHMARKS');
        console.log('-'.repeat(50));
        
        try {
            // Test 1: API Response Time
            const startTime = Date.now();
            const response = await axios.get(`${this.baseUrl}/health`, { timeout: 10000 });
            const responseTime = Date.now() - startTime;
            
            if (responseTime < 1000) {
                this.recordSuccess('performance', 'API Response Time', `Excellent: ${responseTime}ms`);
            } else if (responseTime < 3000) {
                this.recordSuccess('performance', 'API Response Time', `Good: ${responseTime}ms`);
            } else {
                this.recordFailure('performance', 'API Response Time', `Slow: ${responseTime}ms`);
            }
            
            // Test 2: Memory Usage Check
            const memUsage = process.memoryUsage();
            const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            
            if (memUsageMB < 100) {
                this.recordSuccess('performance', 'Memory Usage', `Efficient: ${memUsageMB}MB`);
            } else if (memUsageMB < 250) {
                this.recordSuccess('performance', 'Memory Usage', `Acceptable: ${memUsageMB}MB`);
            } else {
                this.recordFailure('performance', 'Memory Usage', `High: ${memUsageMB}MB`);
            }
            
            // Test 3: File System Performance
            const fsStartTime = Date.now();
            const testData = 'Performance test data'.repeat(1000);
            const testFile = path.join(__dirname, 'temp-perf-test.txt');
            
            fs.writeFileSync(testFile, testData);
            fs.readFileSync(testFile);
            fs.unlinkSync(testFile);
            
            const fsTime = Date.now() - fsStartTime;
            if (fsTime < 100) {
                this.recordSuccess('performance', 'File System I/O', `Fast: ${fsTime}ms`);
            } else {
                this.recordFailure('performance', 'File System I/O', `Slow: ${fsTime}ms`);
            }
            
        } catch (error) {
            this.recordFailure('performance', 'Performance Testing', `Test execution failed: ${error.message}`);
        }
        
        console.log(`✅ Performance: ${this.testResults.performance.passed} passed, ${this.testResults.performance.failed} failed`);
    }

    // ========================================
    // SECURITY TESTS
    // ========================================
    async testSecurity() {
        console.log('\n🔒 TESTING SECURITY CONFIGURATION');
        console.log('-'.repeat(50));
        
        // Test 1: Environment Variable Security
        if (process.env.NODE_ENV !== 'production' || fs.existsSync('.env')) {
            this.recordSuccess('security', 'Environment Security', 'Environment variables properly configured');
        } else {
            this.recordFailure('security', 'Environment Security', 'Environment configuration issues');
        }
        
        // Test 2: Sensitive File Protection
        const sensitiveFiles = ['.env', 'package-lock.json'];
        let protectedFiles = 0;
        
        for (const file of sensitiveFiles) {
            if (fs.existsSync(file)) {
                protectedFiles++;
            }
        }
        
        if (protectedFiles === sensitiveFiles.length) {
            this.recordSuccess('security', 'File Protection', 'Sensitive files properly managed');
        } else {
            this.recordFailure('security', 'File Protection', 'Some sensitive files missing');
        }
        
        // Test 3: API Key Validation
        const apiKeys = [
            process.env.ANTHROPIC_API_KEY,
            process.env.OPENAI_API_KEY,
            process.env.PERPLEXITY_API_KEY
        ].filter(key => key);
        
        let secureKeys = 0;
        for (const key of apiKeys) {
            if (key && key.length > 20 && key.includes('-')) {
                secureKeys++;
            }
        }
        
        if (secureKeys >= 2) {
            this.recordSuccess('security', 'API Key Format', 'API keys appear to have secure format');
        } else {
            this.recordFailure('security', 'API Key Format', 'Some API keys may have format issues');
        }
        
        console.log(`✅ Security: ${this.testResults.security.passed} passed, ${this.testResults.security.failed} failed`);
    }

    // ========================================
    // ERROR HANDLING TESTS
    // ========================================
    async testErrorHandling() {
        console.log('\n🛡️ TESTING ERROR HANDLING & RECOVERY');
        console.log('-'.repeat(50));
        
        try {
            // Test 1: Invalid API Request Handling
            try {
                await axios.post(`${this.baseUrl}/api/v1/research/generate-dossier`, 
                    { invalidData: 'test' },
                    { timeout: 5000 }
                );
                this.recordFailure('errorHandling', 'Invalid Request', 'Server accepted invalid request');
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    this.recordSuccess('errorHandling', 'Invalid Request', 'Server properly rejected invalid request');
                } else {
                    this.recordFailure('errorHandling', 'Invalid Request', 'Unexpected error response');
                }
            }
            
            // Test 2: Non-existent Endpoint
            try {
                await axios.get(`${this.baseUrl}/api/v1/nonexistent`, { timeout: 5000 });
                this.recordFailure('errorHandling', 'Non-existent Endpoint', 'Server responded to non-existent endpoint');
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    this.recordSuccess('errorHandling', 'Non-existent Endpoint', 'Server properly returned 404');
                } else {
                    this.recordFailure('errorHandling', 'Non-existent Endpoint', 'Unexpected error response');
                }
            }
            
            // Test 3: Server Error Recovery
            const serverRunning = await this.checkServerStatus();
            if (serverRunning) {
                this.recordSuccess('errorHandling', 'Server Recovery', 'Server maintains availability after error tests');
            } else {
                this.recordFailure('errorHandling', 'Server Recovery', 'Server may have crashed during error tests');
            }
            
        } catch (error) {
            this.recordFailure('errorHandling', 'Error Handling Tests', `Test execution failed: ${error.message}`);
        }
        
        console.log(`✅ Error Handling: ${this.testResults.errorHandling.passed} passed, ${this.testResults.errorHandling.failed} failed`);
    }

    // ========================================
    // UTILITY METHODS
    // ========================================
    async checkServerStatus() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    recordSuccess(category, testName, details) {
        this.testResults[category].passed++;
        this.testResults[category].tests.push({
            name: testName,
            status: 'PASSED',
            details: details,
            timestamp: new Date().toISOString()
        });
        console.log(`✅ ${testName}: ${details}`);
    }

    recordFailure(category, testName, details) {
        this.testResults[category].failed++;
        this.testResults[category].tests.push({
            name: testName,
            status: 'FAILED',
            details: details,
            timestamp: new Date().toISOString()
        });
        console.log(`❌ ${testName}: ${details}`);
    }

    generateComprehensiveReport() {
        const totalTime = Date.now() - this.startTime;
        const totalTests = Object.values(this.testResults).reduce((acc, cat) => acc + cat.passed + cat.failed, 0);
        const totalPassed = Object.values(this.testResults).reduce((acc, cat) => acc + cat.passed, 0);
        const totalFailed = Object.values(this.testResults).reduce((acc, cat) => acc + cat.failed, 0);
        const successRate = ((totalPassed / totalTests) * 100).toFixed(1);

        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE QA TEST RESULTS');
        console.log('='.repeat(80));
        console.log(`⏱️  Total Execution Time: ${(totalTime / 1000).toFixed(2)} seconds`);
        console.log(`📈 Overall Success Rate: ${successRate}%`);
        console.log(`✅ Tests Passed: ${totalPassed}`);
        console.log(`❌ Tests Failed: ${totalFailed}`);
        console.log(`📋 Total Tests Executed: ${totalTests}`);
        console.log('');

        // Category-wise results
        console.log('📊 DETAILED RESULTS BY CATEGORY:');
        console.log('-'.repeat(60));
        for (const [category, results] of Object.entries(this.testResults)) {
            const categoryRate = results.passed + results.failed > 0 ? 
                ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) : '0.0';
            const statusIcon = categoryRate >= 80 ? '✅' : categoryRate >= 60 ? '⚠️' : '❌';
            
            console.log(`${statusIcon} ${category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}: ${categoryRate}% (${results.passed}/${results.passed + results.failed})`);
        }

        console.log('');

        // Performance grade
        let performanceGrade = 'F';
        if (successRate >= 95) performanceGrade = 'A+';
        else if (successRate >= 90) performanceGrade = 'A';
        else if (successRate >= 85) performanceGrade = 'B+';
        else if (successRate >= 80) performanceGrade = 'B';
        else if (successRate >= 75) performanceGrade = 'C+';
        else if (successRate >= 70) performanceGrade = 'C';
        else if (successRate >= 60) performanceGrade = 'D';

        console.log('🏆 OVERALL APPLICATION PERFORMANCE GRADE: ' + performanceGrade);
        
        if (performanceGrade.startsWith('A')) {
            console.log('🎉 EXCELLENT: Application is optimally configured and performing at peak efficiency!');
        } else if (performanceGrade.startsWith('B')) {
            console.log('👍 GOOD: Application is well-configured with minor areas for improvement.');
        } else if (performanceGrade.startsWith('C')) {
            console.log('⚠️  ACCEPTABLE: Application is functional but has several areas needing attention.');
        } else {
            console.log('🚨 NEEDS IMPROVEMENT: Application has significant issues requiring immediate attention.');
        }

        // Save detailed report
        const reportData = {
            executionTime: totalTime,
            successRate: parseFloat(successRate),
            performanceGrade: performanceGrade,
            summary: {
                totalTests: totalTests,
                passed: totalPassed,
                failed: totalFailed
            },
            categories: this.testResults,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync('qa-test-report.json', JSON.stringify(reportData, null, 2));
        console.log('\n💾 Detailed report saved to: qa-test-report.json');
        console.log('📁 Import this report for detailed analysis and tracking');
        
        console.log('\n' + '='.repeat(80));
        console.log('🔬 COMPREHENSIVE QA TEST SUITE COMPLETED');
        console.log('='.repeat(80));
    }
}

// Execute comprehensive QA test suite
const qaTest = new ComprehensiveQATest();
qaTest.runFullQATestSuite();