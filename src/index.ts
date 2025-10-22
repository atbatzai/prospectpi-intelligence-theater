/**
 * ProspectPI Intelligence Theater - Main Entry Point
 * Story 1.1: Three-Agent Orch      console.log('\n📄 EXECUTIVE SUMMARY:');
      console.log('-'.repeat(40));
      console.log(result.dossier.structuredSections.executiveSummary.summary);
      
      console.log('\n📊 STRATEGIC RECOMMENDATIONS:');
      console.log('-'.repeat(40));
      console.log(result.dossier.structuredSections.strategicRecommendations.approachStrategy.substring(0, 1000) + '...');on System
 * 
 * Main application entry point for the three-agent intelligence system
 */

import { AgentOrchestrator } from './services/AgentOrchestrator';
import { ApiConnectivityTest } from './utils/ApiConnectivityTest';
import { OptimizedUserInput, AgentProgress } from './interfaces/AgentTypes';
import { ApiConfig } from './config/ApiConfig';

/**
 * Demo function to test the complete three-agent system
 */
async function demoIntelligenceMission(): Promise<void> {
  console.log('🎭 ProspectPI Intelligence Theater - Three-Agent System Demo');
  console.log('=' .repeat(60));

  // Validate API configuration
  try {
    console.log('\n🔧 Validating API configuration...');
    ApiConfig.validateConfiguration();
    console.log('✅ API configuration validated');
  } catch (error: any) {
    console.error('❌ API configuration failed:', error.message);
    return;
  }

  // Test API connectivity (optional - can be skipped for demo)
  console.log('\n🔍 Testing API connectivity...');
  const connectivityValid = await ApiConnectivityTest.validateAllConnections();
  if (!connectivityValid) {
    console.log('⚠️  Some API connections failed, but continuing with demo...');
  }

  // Demo user input
  const demoInput: OptimizedUserInput = {
    companyName: 'OpenAI',
    vendorName: 'Microsoft',
    productName: 'Azure AI Services',
    industry: 'Technology',
    primaryPainPoint: 'AI model training and deployment costs',
    additionalContext: 'AI research company, creator of ChatGPT and GPT models',
    priority: 'standard',
    outputFormat: 'full',
    confidenceThreshold: 'medium'
  };

  // Progress tracking callback
  const progressCallback = (progress: AgentProgress) => {
    const timestamp = progress.timestamp.toLocaleTimeString();
    const agent = progress.agent.toUpperCase().padEnd(12);
    const stage = progress.stage.toUpperCase().padEnd(12);
    const confidence = `${Math.round(progress.confidence * 100)}%`.padEnd(4);
    
    console.log(`[${timestamp}] ${agent} | ${stage} | ${confidence} | ${progress.message}`);
    
    if (progress.dataSourcesActive?.length) {
      console.log(`                    Active Sources: ${progress.dataSourcesActive.join(', ')}`);
    }
    
    if (progress.insightsDiscovered) {
      console.log(`                    Insights Found: ${progress.insightsDiscovered}`);
    }
  };

  // Execute intelligence mission
  console.log('\n🚀 Executing Intelligence Mission');
  console.log('Target:', demoInput.companyName);
  console.log('Context:', demoInput.additionalContext);
  console.log('-'.repeat(80));

  const orchestrator = new AgentOrchestrator(progressCallback);

  try {
    const startTime = Date.now();
    const result = await orchestrator.executeIntelligenceMission(demoInput);
    const executionTime = Date.now() - startTime;

    console.log('\n' + '='.repeat(80));
    
    if (result.success && result.dossier) {
      console.log('✅ INTELLIGENCE MISSION COMPLETED SUCCESSFULLY');
      console.log(`📊 Execution Time: ${Math.round(executionTime / 1000)}s`);
      console.log(`💰 Total Cost: $${result.totalCost.toFixed(3)}`);
      console.log(`🎯 Confidence Score: ${Math.round(result.dossier.confidenceScore * 100)}%`);
      console.log(`📋 Quality Gates Passed: ${result.qualityGates.filter(g => g.passed).length}/${result.qualityGates.length}`);
      console.log(`📈 Progress Updates: ${result.agentProgress.length}`);
      
      console.log('\n📄 EXECUTIVE SUMMARY:');
      console.log('-'.repeat(40));
      console.log(result.dossier.structuredSections.executiveSummary.summary);
      
      console.log('\n📑 STRATEGIC RECOMMENDATIONS:');
      console.log('-'.repeat(40));
      console.log(result.dossier.structuredSections.strategicRecommendations.approachStrategy.substring(0, 1000) + '...');
      
      console.log('\n🔍 RESEARCH SOURCES:');
      result.dossier.sources.forEach((source, i) => {
        console.log(`${i + 1}. ${source.source.toUpperCase()}: ${Math.round(source.confidence * 100)}% confidence, $${source.cost.toFixed(3)} cost`);
      });
      
    } else {
      console.log('❌ INTELLIGENCE MISSION FAILED');
      console.log(`Error: ${result.error}`);
      console.log(`Execution Time: ${Math.round(executionTime / 1000)}s`);
      console.log(`Partial Cost: $${result.totalCost.toFixed(3)}`);
    }

  } catch (error: any) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    orchestrator.reset();
  }

  console.log('\n🎭 Intelligence Theater Demo Complete');
}

/**
 * Simple API test function
 */
async function testApiOnly(): Promise<void> {
  console.log('🧪 API Connectivity Test Only');
  console.log('=' .repeat(40));
  
  try {
    ApiConfig.validateConfiguration();
    await ApiConnectivityTest.validateAllConnections();
  } catch (error: any) {
    console.error('API test failed:', error.message);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--api-test')) {
    testApiOnly();
  } else {
    demoIntelligenceMission();
  }
}

export { demoIntelligenceMission, testApiOnly };
export { AgentOrchestrator } from './services/AgentOrchestrator';
export { IntelligenceCoordinator } from './agents/IntelligenceCoordinator';
export { FieldIntelligenceResearcher } from './agents/FieldIntelligenceResearcher';
export { ProspectIntelligenceDetective } from './agents/ProspectIntelligenceDetective';