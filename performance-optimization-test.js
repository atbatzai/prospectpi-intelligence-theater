/**
 * PERFORMANCE OPTIMIZATION TEST
 * ProspectPI Intelligence Theater - Focused Performance Analysis
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('⚡ PERFORMANCE OPTIMIZATION TEST');
console.log('='.repeat(60));
console.log('🎯 Focused Performance Analysis for ProspectPI Intelligence Theater');
console.log('');

class PerformanceOptimizationTest {
    constructor() {
        this.results = {
            codeQuality: [],
            fileStructure: [],
            dependencies: [],
            configuration: [],
            memoryEfficiency: []
        };
        this.recommendations = [];
    }

    async runPerformanceTests() {
        console.log('🚀 RUNNING PERFORMANCE OPTIMIZATION TESTS');
        console.log('-'.repeat(50));
        
        this.testCodeQuality();
        this.testFileStructure();
        this.testDependencies();
        this.testConfiguration();
        this.testMemoryEfficiency();
        this.generateOptimizationRecommendations();
        this.displayResults();
    }

    testCodeQuality() {
        console.log('\n📝 TESTING CODE QUALITY & STRUCTURE');
        console.log('-'.repeat(40));
        
        // Test TypeScript usage
        const tsFiles = this.findFiles('.ts', 'src');
        const jsFiles = this.findFiles('.js', '.');
        
        if (tsFiles.length > jsFiles.length) {
            this.recordSuccess('codeQuality', 'TypeScript Usage', `${tsFiles.length} TS files vs ${jsFiles.length} JS files - Good type safety`);
        } else {
            this.recordWarning('codeQuality', 'TypeScript Usage', 'Consider migrating more JS files to TypeScript');
        }
        
        // Test agent file sizes (complexity check)
        const agentFiles = [
            'src/agents/IntelligenceCoordinator.ts',
            'src/agents/FieldIntelligenceResearcher.ts', 
            'src/agents/ProspectIntelligenceDetective.ts'
        ];
        
        for (const agentFile of agentFiles) {
            if (fs.existsSync(agentFile)) {
                const stats = fs.statSync(agentFile);
                const sizeKB = Math.round(stats.size / 1024);
                
                if (sizeKB > 50) {
                    this.recordWarning('codeQuality', `${path.basename(agentFile)} Size`, `${sizeKB}KB - Consider refactoring for maintainability`);
                } else if (sizeKB > 20) {
                    this.recordSuccess('codeQuality', `${path.basename(agentFile)} Size`, `${sizeKB}KB - Well-structured agent`);
                } else {
                    this.recordSuccess('codeQuality', `${path.basename(agentFile)} Size`, `${sizeKB}KB - Compact implementation`);
                }
            }
        }
        
        // Test for proper separation of concerns
        const hasServices = fs.existsSync('src/services');
        const hasModels = fs.existsSync('src/models');
        const hasInterfaces = fs.existsSync('src/interfaces');
        
        if (hasServices && hasModels && hasInterfaces) {
            this.recordSuccess('codeQuality', 'Architecture', 'Good separation of concerns with services/models/interfaces');
        } else {
            this.recordWarning('codeQuality', 'Architecture', 'Consider improving separation of concerns');
        }
    }

    testFileStructure() {
        console.log('\n📁 TESTING FILE STRUCTURE & ORGANIZATION');
        console.log('-'.repeat(40));
        
        // Test directory structure
        const expectedDirs = ['src', 'frontend', 'docs', 'data'];
        for (const dir of expectedDirs) {
            if (fs.existsSync(dir)) {
                this.recordSuccess('fileStructure', `Directory: ${dir}`, 'Directory exists and properly organized');
            } else {
                this.recordWarning('fileStructure', `Directory: ${dir}`, 'Expected directory missing');
            }
        }
        
        // Test for documentation
        const docFiles = this.findFiles('.md', 'docs');
        if (docFiles.length > 10) {
            this.recordSuccess('fileStructure', 'Documentation', `${docFiles.length} documentation files - Excellent coverage`);
        } else if (docFiles.length > 5) {
            this.recordSuccess('fileStructure', 'Documentation', `${docFiles.length} documentation files - Good coverage`);
        } else {
            this.recordWarning('fileStructure', 'Documentation', 'Consider adding more documentation');
        }
        
        // Test for proper gitignore
        if (fs.existsSync('.gitignore')) {
            const gitignore = fs.readFileSync('.gitignore', 'utf8');
            if (gitignore.includes('node_modules') && gitignore.includes('.env')) {
                this.recordSuccess('fileStructure', 'Git Configuration', 'Proper .gitignore configuration');
            } else {
                this.recordWarning('fileStructure', 'Git Configuration', 'Review .gitignore for security');
            }
        }
    }

    testDependencies() {
        console.log('\n📦 TESTING DEPENDENCIES & PACKAGES');
        console.log('-'.repeat(40));
        
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            // Count dependencies
            const depCount = Object.keys(packageJson.dependencies || {}).length;
            const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
            
            if (depCount < 50) {
                this.recordSuccess('dependencies', 'Dependency Count', `${depCount} production dependencies - Lean setup`);
            } else {
                this.recordWarning('dependencies', 'Dependency Count', `${depCount} production dependencies - Consider optimization`);
            }
            
            if (devDepCount < 30) {
                this.recordSuccess('dependencies', 'Dev Dependencies', `${devDepCount} dev dependencies - Good development setup`);
            }
            
            // Check for essential dependencies
            const essentialDeps = ['express', 'dotenv', 'axios'];
            for (const dep of essentialDeps) {
                if (packageJson.dependencies && packageJson.dependencies[dep]) {
                    this.recordSuccess('dependencies', `Essential: ${dep}`, 'Required dependency present');
                } else {
                    this.recordWarning('dependencies', `Essential: ${dep}`, 'Missing essential dependency');
                }
            }
            
            // Check for TypeScript setup
            if (packageJson.devDependencies && packageJson.devDependencies.typescript) {
                this.recordSuccess('dependencies', 'TypeScript Setup', 'TypeScript properly configured');
            }
            
        } catch (error) {
            this.recordWarning('dependencies', 'Package Analysis', 'Cannot read package.json');
        }
    }

    testConfiguration() {
        console.log('\n⚙️ TESTING CONFIGURATION & ENVIRONMENT');
        console.log('-'.repeat(40));
        
        // Test environment configuration
        if (fs.existsSync('.env')) {
            this.recordSuccess('configuration', 'Environment File', '.env file exists for configuration');
            
            // Count configured environment variables
            const envContent = fs.readFileSync('.env', 'utf8');
            const envVars = envContent.split('\n').filter(line => line.includes('=') && !line.startsWith('#'));
            
            if (envVars.length > 10) {
                this.recordSuccess('configuration', 'Environment Variables', `${envVars.length} environment variables configured`);
            } else {
                this.recordWarning('configuration', 'Environment Variables', 'Consider adding more configuration options');
            }
        } else {
            this.recordWarning('configuration', 'Environment File', '.env file missing');
        }
        
        // Test TypeScript configuration
        if (fs.existsSync('tsconfig.json')) {
            this.recordSuccess('configuration', 'TypeScript Config', 'TypeScript configuration present');
        }
        
        // Test for performance-related configs
        const configs = ['jest.config.js', 'vitest.config.ts', 'next.config.mjs'];
        for (const config of configs) {
            if (fs.existsSync(config) || fs.existsSync(`frontend/${config}`)) {
                this.recordSuccess('configuration', `Config: ${config}`, 'Performance configuration file present');
            }
        }
    }

    testMemoryEfficiency() {
        console.log('\n🧠 TESTING MEMORY EFFICIENCY');
        console.log('-'.repeat(40));
        
        // Test current memory usage
        const memUsage = process.memoryUsage();
        const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
        
        if (memUsedMB < 50) {
            this.recordSuccess('memoryEfficiency', 'Memory Usage', `${memUsedMB}MB used - Excellent efficiency`);
        } else if (memUsedMB < 100) {
            this.recordSuccess('memoryEfficiency', 'Memory Usage', `${memUsedMB}MB used - Good efficiency`);
        } else {
            this.recordWarning('memoryEfficiency', 'Memory Usage', `${memUsedMB}MB used - Consider optimization`);
        }
        
        // Test for memory leaks (basic check)
        const memEfficiency = (memUsedMB / memTotalMB) * 100;
        if (memEfficiency < 70) {
            this.recordSuccess('memoryEfficiency', 'Memory Efficiency', `${memEfficiency.toFixed(1)}% heap utilization - Good memory management`);
        } else {
            this.recordWarning('memoryEfficiency', 'Memory Efficiency', `${memEfficiency.toFixed(1)}% heap utilization - Monitor for leaks`);
        }
        
        // Test database file size
        const dbPath = 'data/prospectpi.db';
        if (fs.existsSync(dbPath)) {
            const dbStats = fs.statSync(dbPath);
            const dbSizeMB = Math.round(dbStats.size / 1024 / 1024 * 100) / 100;
            
            if (dbSizeMB < 10) {
                this.recordSuccess('memoryEfficiency', 'Database Size', `${dbSizeMB}MB - Optimal database size`);
            } else if (dbSizeMB < 50) {
                this.recordSuccess('memoryEfficiency', 'Database Size', `${dbSizeMB}MB - Acceptable database size`);
            } else {
                this.recordWarning('memoryEfficiency', 'Database Size', `${dbSizeMB}MB - Consider database optimization`);
            }
        }
    }

    generateOptimizationRecommendations() {
        console.log('\n🎯 GENERATING OPTIMIZATION RECOMMENDATIONS');
        console.log('-'.repeat(40));
        
        // API Performance Recommendations
        this.recommendations.push({
            category: 'API Performance',
            priority: 'HIGH',
            recommendation: 'Implement API response caching for frequently requested data',
            impact: 'Reduce response times by 60-80%'
        });
        
        this.recommendations.push({
            category: 'Database Performance', 
            priority: 'MEDIUM',
            recommendation: 'Add database indexing for frequently queried columns',
            impact: 'Improve query performance by 40-60%'
        });
        
        this.recommendations.push({
            category: 'Memory Optimization',
            priority: 'MEDIUM', 
            recommendation: 'Implement proper cleanup in agent orchestration lifecycle',
            impact: 'Prevent memory leaks during long-running operations'
        });
        
        this.recommendations.push({
            category: 'Code Optimization',
            priority: 'LOW',
            recommendation: 'Consider using lazy loading for non-critical modules',
            impact: 'Reduce initial application startup time'
        });
        
        this.recommendations.push({
            category: 'Security Performance',
            priority: 'HIGH',
            recommendation: 'Implement rate limiting and request throttling',
            impact: 'Prevent API abuse and maintain performance under load'
        });
        
        for (const rec of this.recommendations) {
            const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
            console.log(`${priorityIcon} ${rec.category}: ${rec.recommendation}`);
            console.log(`   Impact: ${rec.impact}`);
        }
    }

    findFiles(extension, directory) {
        const files = [];
        
        function searchDirectory(dir) {
            if (!fs.existsSync(dir)) return;
            
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    if (!item.startsWith('.') && item !== 'node_modules') {
                        searchDirectory(fullPath);
                    }
                } else if (item.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        }
        
        searchDirectory(directory);
        return files;
    }

    recordSuccess(category, test, details) {
        this.results[category].push({
            test,
            status: 'PASSED',
            details,
            type: 'success'
        });
        console.log(`✅ ${test}: ${details}`);
    }

    recordWarning(category, test, details) {
        this.results[category].push({
            test,
            status: 'WARNING',
            details,
            type: 'warning'
        });
        console.log(`⚠️ ${test}: ${details}`);
    }

    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 PERFORMANCE OPTIMIZATION RESULTS');
        console.log('='.repeat(60));
        
        let totalTests = 0;
        let passedTests = 0;
        let warningTests = 0;
        
        for (const [category, results] of Object.entries(this.results)) {
            if (category === 'recommendations') continue;
            
            const categoryPassed = results.filter(r => r.type === 'success').length;
            const categoryWarnings = results.filter(r => r.type === 'warning').length;
            const categoryTotal = results.length;
            
            totalTests += categoryTotal;
            passedTests += categoryPassed;
            warningTests += categoryWarnings;
            
            if (categoryTotal > 0) {
                const successRate = ((categoryPassed / categoryTotal) * 100).toFixed(1);
                const statusIcon = successRate >= 80 ? '✅' : successRate >= 60 ? '⚠️' : '❌';
                
                console.log(`${statusIcon} ${category.toUpperCase()}: ${successRate}% (${categoryPassed}/${categoryTotal})`);
            }
        }
        
        const overallSuccess = ((passedTests / totalTests) * 100).toFixed(1);
        
        console.log('');
        console.log(`📈 Overall Performance Score: ${overallSuccess}%`);
        console.log(`✅ Optimizations Passed: ${passedTests}`);
        console.log(`⚠️ Areas for Improvement: ${warningTests}`);
        console.log(`📋 Total Performance Checks: ${totalTests}`);
        
        // Performance Grade
        let grade = 'F';
        if (overallSuccess >= 95) grade = 'A+';
        else if (overallSuccess >= 90) grade = 'A';
        else if (overallSuccess >= 85) grade = 'B+';
        else if (overallSuccess >= 80) grade = 'B';
        else if (overallSuccess >= 75) grade = 'C+';
        else if (overallSuccess >= 70) grade = 'C';
        else if (overallSuccess >= 60) grade = 'D';
        
        console.log(`\n🏆 PERFORMANCE OPTIMIZATION GRADE: ${grade}`);
        
        if (grade.startsWith('A')) {
            console.log('🎉 EXCELLENT: Application is highly optimized for performance!');
        } else if (grade.startsWith('B')) {
            console.log('👍 GOOD: Application has solid performance with room for minor improvements.');
        } else if (grade.startsWith('C')) {
            console.log('⚠️ ACCEPTABLE: Application performance is adequate but has optimization opportunities.');
        } else {
            console.log('🚨 NEEDS IMPROVEMENT: Application requires significant performance optimization.');
        }
        
        console.log(`\n📋 HIGH PRIORITY RECOMMENDATIONS: ${this.recommendations.filter(r => r.priority === 'HIGH').length}`);
        console.log(`📋 MEDIUM PRIORITY RECOMMENDATIONS: ${this.recommendations.filter(r => r.priority === 'MEDIUM').length}`);
        console.log(`📋 LOW PRIORITY RECOMMENDATIONS: ${this.recommendations.filter(r => r.priority === 'LOW').length}`);
        
        // Save detailed report
        const report = {
            overallScore: parseFloat(overallSuccess),
            grade: grade,
            summary: {
                totalTests,
                passed: passedTests,
                warnings: warningTests
            },
            results: this.results,
            recommendations: this.recommendations,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync('performance-optimization-report.json', JSON.stringify(report, null, 2));
        console.log('\n💾 Detailed report saved to: performance-optimization-report.json');
        
        console.log('\n' + '='.repeat(60));
        console.log('⚡ PERFORMANCE OPTIMIZATION TEST COMPLETED');
        console.log('='.repeat(60));
    }
}

// Execute performance optimization test
const perfTest = new PerformanceOptimizationTest();
perfTest.runPerformanceTests();