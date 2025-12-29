/**
 * Comprehensive Dossier Quality Testing Framework
 * Tests the entire ProspectPI Intelligence Theater for rich, detailed dossiers
 * Identifies all blockers and evaluates content gaps
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:3001';

// Test Companies with varying data availability
const TEST_COMPANIES = [
  {
    name: "Netflix Inc",
    vendorName: "Amazon Web Services", 
    productName: "AWS Media Services",
    industry: "Streaming Entertainment",
    primaryPainPoint: "Content delivery optimization and global scalability",
    expectedDataRichness: "HIGH", // Public company with lots of data
    testId: "netflix_test"
  },
  {
    name: "Stripe Inc",
    vendorName: "Oracle",
    productName: "Database Cloud",
    industry: "Fintech",
    primaryPainPoint: "Database scalability and compliance",
    expectedDataRichness: "HIGH", // Well-known fintech
    testId: "stripe_test"
  },
  {
    name: "Zoom Video Communications",
    vendorName: "Microsoft",
    productName: "Teams",
    industry: "Video Communications",
    primaryPainPoint: "Enterprise collaboration integration",
    expectedDataRichness: "MEDIUM", // Public but specialized
    testId: "zoom_test"
  },
  {
    name: "Fictional Corp XYZ",
    vendorName: "Salesforce",
    productName: "Sales Cloud",
    industry: "Technology",
    primaryPainPoint: "Customer relationship management",
    expectedDataRichness: "LOW", // Non-existent company
    testId: "fictional_test"
  }
];

// Dossier Quality Criteria
const QUALITY_CRITERIA = {
  completeness: {
    requiredSections: [
      'executive_summary',
      'company_overview', 
      'technology_stack',
      'competitive_landscape',
      'financial_intelligence',
      'strategic_recommendations'
    ],
    minSections: 5
  },
  contentDepth: {
    minWordsPerSection: 100,
    minInsights: 3,
    minDataSources: 2
  },
  dataAccuracy: {
    factualConsistency: true,
    sourceCredibility: true,
    recentData: true
  },
  actionability: {
    specificRecommendations: true,
    solutionRelevance: true,
    nextSteps: true
  }
};

class DossierTester {
  constructor() {
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      blockers: [],
      gaps: [],
      dossiers: []
    };
  }

  async runComprehensiveTest() {
    console.log('\n🧪 === COMPREHENSIVE DOSSIER QUALITY TEST STARTING ===\n');
    
    // Step 1: Test API Health
    await this.testAPIHealth();
    
    // Step 2: Test Multiple Company Types
    for (const company of TEST_COMPANIES) {
      await this.testCompanyDossier(company);
      await this.sleep(5000); // Avoid rate limiting
    }
    
    // Step 3: Analyze Results
    this.analyzeResults();
    
    // Step 4: Generate Report
    this.generateReport();
    
    return this.results;
  }

  async testAPIHealth() {
    console.log('🏥 Testing API Health...');
    try {
      const response = await axios.get(`${API_BASE}/health`);
      if (response.status === 200) {
        console.log('✅ API Health: PASS');
        this.results.totalTests++;
        this.results.passedTests++;
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ API Health: FAIL -', error.message);
      this.results.totalTests++;
      this.results.failedTests++;
      this.results.blockers.push({
        type: 'API_HEALTH',
        severity: 'CRITICAL',
        description: 'API health check failed',
        error: error.message
      });
    }
  }

  async testCompanyDossier(company) {
    console.log(`\n🕵️ Testing Dossier Generation: ${company.name}`);
    console.log(`   Expected Data Richness: ${company.expectedDataRichness}`);
    
    const startTime = Date.now();
    let requestId = null;
    
    try {
      // Step 1: Submit dossier request with proper JSON formatting
      const requestBody = {
        companyName: company.name,
        vendorName: company.vendorName,
        productName: company.productName,
        industry: company.industry,
        primaryPainPoint: company.primaryPainPoint,
        additionalContext: `QUALITY TEST: Evaluating ${company.testId}`,
        competitorAnalysis: true,
        budgetIntelligence: true,
        technologyStackFocus: true
      };

      console.log(`   📤 Submitting request body:`, JSON.stringify(requestBody, null, 2));

      const submitResponse = await axios.post(`${API_BASE}/api/v1/research/generate-dossier`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout for submission
      });

      if (submitResponse.status !== 202) {
        throw new Error(`Request submission failed: ${submitResponse.status} - ${submitResponse.statusText}`);
      }

      requestId = submitResponse.data.requestId;
      console.log(`   ✅ Request submitted: ${requestId}`);

      // Step 2: Wait for completion with timeout
      const dossier = await this.waitForCompletion(requestId, 180000); // 3 minute timeout
      
      if (!dossier) {
        throw new Error('Dossier generation timed out');
      }

      // Step 3: Evaluate dossier quality
      const qualityScore = this.evaluateDossierQuality(dossier, company);
      
      const testResult = {
        company: company.name,
        testId: company.testId,
        requestId,
        success: qualityScore.overall >= 0.6, // 60% threshold
        qualityScore,
        generationTime: Date.now() - startTime,
        dossier
      };

      this.results.dossiers.push(testResult);
      this.results.totalTests++;
      
      if (testResult.success) {
        this.results.passedTests++;
        console.log(`   ✅ Dossier Quality: PASS (${Math.round(qualityScore.overall * 100)}%)`);
      } else {
        this.results.failedTests++;
        console.log(`   ❌ Dossier Quality: FAIL (${Math.round(qualityScore.overall * 100)}%)`);
        this.identifyGaps(testResult, company);
      }

    } catch (error) {
      console.log(`   ❌ Test Failed: ${error.message}`);
      this.results.totalTests++;
      this.results.failedTests++;
      
      this.results.blockers.push({
        type: 'DOSSIER_GENERATION',
        severity: 'HIGH',
        company: company.name,
        testId: company.testId,
        requestId,
        description: `Dossier generation failed for ${company.name}`,
        error: error.message
      });
    }
  }

  async waitForCompletion(requestId, timeout = 180000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await axios.get(`${API_BASE}/api/v1/research/results/${requestId}`);
        
        if (response.status === 200 && response.data.success && response.data.dossier) {
          console.log('   ✅ Dossier completed successfully');
          return response.data.dossier;
        } else if (response.status === 202) {
          console.log('   ⏳ Still processing...');
          await this.sleep(10000); // Wait 10 seconds
          continue;
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('   ⏳ Still processing...');
          await this.sleep(10000);
          continue;
        }
        throw error;
      }
    }
    
    return null; // Timeout
  }

  evaluateDossierQuality(dossier, company) {
    const scores = {
      completeness: 0,
      contentDepth: 0,
      dataAccuracy: 0,
      actionability: 0,
      overall: 0
    };

    try {
      // Parse dossier sections
      const sections = this.parseDossierSections(dossier);
      
      // 1. Completeness Score
      scores.completeness = this.evaluateCompleteness(sections);
      
      // 2. Content Depth Score  
      scores.contentDepth = this.evaluateContentDepth(sections);
      
      // 3. Data Accuracy Score
      scores.dataAccuracy = this.evaluateDataAccuracy(sections, company);
      
      // 4. Actionability Score
      scores.actionability = this.evaluateActionability(sections, company);
      
      // Overall score (weighted average)
      scores.overall = (
        scores.completeness * 0.3 +
        scores.contentDepth * 0.25 +
        scores.dataAccuracy * 0.25 +
        scores.actionability * 0.2
      );
      
    } catch (error) {
      console.log(`   ⚠️ Quality evaluation error: ${error.message}`);
    }

    return scores;
  }

  parseDossierSections(dossier) {
    // Handle different dossier formats
    if (typeof dossier === 'string') {
      try {
        dossier = JSON.parse(dossier);
      } catch {
        // If it's a string, try to extract sections by headers
        return this.parseStringDossier(dossier);
      }
    }

    if (dossier.sections) {
      return dossier.sections;
    }

    if (dossier.content) {
      return this.parseStringDossier(dossier.content);
    }

    // Extract all text content
    const content = JSON.stringify(dossier);
    return this.parseStringDossier(content);
  }

  parseStringDossier(content) {
    const sections = {};
    
    // Common section headers to look for
    const sectionPatterns = [
      /## Executive Summary([\s\S]*?)(?=##|$)/i,
      /## Company Overview([\s\S]*?)(?=##|$)/i,
      /## Technology Stack([\s\S]*?)(?=##|$)/i,
      /## Competitive Landscape([\s\S]*?)(?=##|$)/i,
      /## Financial Intelligence([\s\S]*?)(?=##|$)/i,
      /## Strategic Recommendations([\s\S]*?)(?=##|$)/i
    ];

    sectionPatterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        const sectionName = match[0].split('\n')[0].replace('## ', '').toLowerCase().replace(/\s+/g, '_');
        sections[sectionName] = match[1].trim();
      }
    });

    return sections;
  }

  evaluateCompleteness(sections) {
    const requiredSections = QUALITY_CRITERIA.completeness.requiredSections;
    const foundSections = Object.keys(sections);
    
    let score = 0;
    for (const required of requiredSections) {
      if (foundSections.some(found => found.includes(required) || required.includes(found))) {
        score += 1;
      }
    }
    
    return Math.min(score / requiredSections.length, 1.0);
  }

  evaluateContentDepth(sections) {
    const sectionKeys = Object.keys(sections);
    if (sectionKeys.length === 0) return 0;
    
    let totalScore = 0;
    let sectionCount = 0;
    
    for (const [key, content] of Object.entries(sections)) {
      if (content && typeof content === 'string') {
        const wordCount = content.split(/\s+/).length;
        const depthScore = Math.min(wordCount / QUALITY_CRITERIA.contentDepth.minWordsPerSection, 1.0);
        totalScore += depthScore;
        sectionCount++;
      }
    }
    
    return sectionCount > 0 ? totalScore / sectionCount : 0;
  }

  evaluateDataAccuracy(sections, company) {
    // Basic accuracy checks
    let accuracyScore = 0.5; // Base score
    
    const allContent = Object.values(sections).join(' ').toLowerCase();
    
    // Check if company name appears
    if (allContent.includes(company.name.toLowerCase())) {
      accuracyScore += 0.2;
    }
    
    // Check if industry appears
    if (allContent.includes(company.industry.toLowerCase())) {
      accuracyScore += 0.15;
    }
    
    // Check for generic/placeholder content
    const genericPhrases = ['lorem ipsum', 'placeholder', 'example', 'todo', 'tbd'];
    const hasGeneric = genericPhrases.some(phrase => allContent.includes(phrase));
    if (hasGeneric) {
      accuracyScore -= 0.3;
    }
    
    return Math.max(0, Math.min(accuracyScore, 1.0));
  }

  evaluateActionability(sections, company) {
    const allContent = Object.values(sections).join(' ').toLowerCase();
    
    let actionabilityScore = 0;
    
    // Check for recommendation keywords
    const recommendationKeywords = ['recommend', 'suggest', 'should', 'could', 'opportunity', 'next steps'];
    const foundKeywords = recommendationKeywords.filter(keyword => 
      allContent.includes(keyword)
    ).length;
    
    actionabilityScore += Math.min(foundKeywords / recommendationKeywords.length, 0.5);
    
    // Check for solution relevance
    if (allContent.includes(company.vendorName.toLowerCase()) || 
        allContent.includes(company.productName.toLowerCase())) {
      actionabilityScore += 0.3;
    }
    
    // Check for specific next steps
    if (allContent.includes('next step') || allContent.includes('action') || 
        allContent.includes('implement')) {
      actionabilityScore += 0.2;
    }
    
    return Math.min(actionabilityScore, 1.0);
  }

  identifyGaps(testResult, company) {
    const gaps = [];
    
    if (testResult.qualityScore.completeness < 0.7) {
      gaps.push({
        type: 'COMPLETENESS',
        severity: 'HIGH',
        description: `Missing required sections. Found ${testResult.qualityScore.completeness * 100}% of expected sections`,
        company: company.name
      });
    }
    
    if (testResult.qualityScore.contentDepth < 0.5) {
      gaps.push({
        type: 'CONTENT_DEPTH',
        severity: 'MEDIUM', 
        description: 'Content sections are too shallow or lack detail',
        company: company.name
      });
    }
    
    if (testResult.qualityScore.dataAccuracy < 0.6) {
      gaps.push({
        type: 'DATA_ACCURACY',
        severity: 'HIGH',
        description: 'Content appears generic or inaccurate',
        company: company.name
      });
    }
    
    if (testResult.qualityScore.actionability < 0.4) {
      gaps.push({
        type: 'ACTIONABILITY',
        severity: 'MEDIUM',
        description: 'Lacks specific recommendations or next steps',
        company: company.name
      });
    }
    
    this.results.gaps.push(...gaps);
  }

  analyzeResults() {
    console.log('\n📊 === ANALYSIS RESULTS ===\n');
    
    const successRate = (this.results.passedTests / this.results.totalTests) * 100;
    console.log(`Overall Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Total Tests: ${this.results.totalTests}`);
    console.log(`Passed: ${this.results.passedTests}`);
    console.log(`Failed: ${this.results.failedTests}`);
    
    // Critical blockers
    const criticalBlockers = this.results.blockers.filter(b => b.severity === 'CRITICAL');
    if (criticalBlockers.length > 0) {
      console.log(`\n🚨 CRITICAL BLOCKERS (${criticalBlockers.length}):`);
      criticalBlockers.forEach(blocker => {
        console.log(`   - ${blocker.type}: ${blocker.description}`);
      });
    }
    
    // Top gaps by frequency
    const gapTypes = this.results.gaps.reduce((acc, gap) => {
      acc[gap.type] = (acc[gap.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 TOP CONTENT GAPS:');
    Object.entries(gapTypes)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`   - ${type}: ${count} occurrences`);
      });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.totalTests,
        passedTests: this.results.passedTests,
        failedTests: this.results.failedTests,
        successRate: (this.results.passedTests / this.results.totalTests) * 100
      },
      blockers: this.results.blockers,
      gaps: this.results.gaps,
      dossierResults: this.results.dossiers.map(d => ({
        company: d.company,
        testId: d.testId,
        success: d.success,
        qualityScore: d.qualityScore,
        generationTime: d.generationTime
      }))
    };
    
    fs.writeFileSync('dossier-quality-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: dossier-quality-report.json');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const tester = new DossierTester();
  tester.runComprehensiveTest()
    .then(results => {
      console.log('\n✅ Comprehensive testing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = DossierTester;