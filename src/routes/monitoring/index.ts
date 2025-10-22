/**
 * ProspectPI Intelligence Theater - Monitoring & Cost Tracking Routes
 * Epic 2.5.3: Performance Optimization & External Validation
 * 
 * Task 2.3: Daily/weekly cost reporting dashboard for business stakeholders
 * Task 2.4: Research quality metrics tracking and reporting
 */

import { Router, Request, Response } from 'express';
import { ApiCostTracker } from '../../config/ApiConfig';

export const monitoringRouter = Router();

/**
 * Epic 2.5.3 Task 2.3: Daily Cost Report
 * GET /api/monitoring/costs/daily?date=YYYY-MM-DD
 */
monitoringRouter.get('/costs/daily', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;
    const costTracker = ApiCostTracker.getInstance();
    
    const report = costTracker.getDailyCostReport(date);
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Failed to generate daily cost report: ${error.message}`
    });
  }
});

/**
 * Epic 2.5.3 Task 2.4: Research Quality Metrics
 * GET /api/monitoring/quality?days=7
 */
monitoringRouter.get('/quality', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const costTracker = ApiCostTracker.getInstance();
    
    const metrics = costTracker.getValueMetrics(days);
    
    res.json({
      success: true,
      data: {
        ...metrics,
        periodDays: days,
        reportDate: new Date().toISOString().split('T')[0]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Failed to generate quality metrics: ${error.message}`
    });
  }
});

/**
 * Epic 2.5.3: Business Dashboard Summary
 * GET /api/monitoring/dashboard
 */
monitoringRouter.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const costTracker = ApiCostTracker.getInstance();
    
    // Current day cost report
    const todayCosts = costTracker.getDailyCostReport();
    
    // Last 7 days quality metrics
    const qualityMetrics = costTracker.getValueMetrics(7);
    
    // Last 30 days quality metrics for comparison
    const monthlyMetrics = costTracker.getValueMetrics(30);
    
    const dashboardData = {
      costs: {
        today: todayCosts,
        budgetStatus: todayCosts.utilizationPercent <= 100 ? 'on_track' : 
                     todayCosts.utilizationPercent <= 120 ? 'warning' : 'over_budget'
      },
      quality: {
        weekly: qualityMetrics,
        monthly: monthlyMetrics,
        trends: {
          valueScoreImprovement: qualityMetrics.averageValueScore - monthlyMetrics.averageValueScore,
          solutionFocusGrowth: qualityMetrics.solutionFocusedPercent - monthlyMetrics.solutionFocusedPercent
        }
      },
      alerts: {
        budgetWarning: todayCosts.utilizationPercent >= 120,
        lowQualityScore: qualityMetrics.averageValueScore < 3.0,
        insufficientSolutionFocus: qualityMetrics.solutionFocusedPercent < 60
      }
    };
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Failed to generate dashboard data: ${error.message}`
    });
  }
});

/**
 * Epic 2.5.3: Winston's Performance Requirements Status
 * GET /api/monitoring/performance/status
 */
monitoringRouter.get('/performance/status', async (_req: Request, res: Response) => {
  try {
    const costTracker = ApiCostTracker.getInstance();
    const circuitBreakerStatus = costTracker.getCircuitBreakerStatus();
    
    const performanceStatus = {
      adaptiveApiStrategy: 'implemented',   // Task 3.1
      performanceBudgets: 'implemented',     // Task 3.2  
      circuitBreakers: 'implemented',       // Task 3.3 ✅ COMPLETE
      qualityGates: 'implemented'           // Task 3.4 ✅ COMPLETE
    };

    const qualityGates = costTracker.validateQualityGates();
    
    res.json({
      success: true,
      data: {
        epic: '2.5.3',
        status: 'complete', // Task 3 fully implemented
        winstonRequirements: performanceStatus,
        circuitBreakers: circuitBreakerStatus,
        qualityGates: qualityGates,
        completionPercentage: 100, // All Winston's requirements implemented
        nextPriority: 'Task 4: Sally\'s UX Requirements'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Failed to get performance status: ${error.message}`
    });
  }
});

/**
 * Epic 2.5.3 Task 3.3: Circuit Breaker Status Monitoring
 * GET /api/monitoring/circuit-breakers
 */
monitoringRouter.get('/circuit-breakers', async (_req: Request, res: Response) => {
  try {
    const costTracker = ApiCostTracker.getInstance();
    const circuitBreakerStatus = costTracker.getCircuitBreakerStatus();
    
    const summary = {
      totalServices: Object.keys(circuitBreakerStatus).length,
      healthyServices: Object.values(circuitBreakerStatus).filter(cb => cb.state === 'closed').length,
      degradedServices: Object.values(circuitBreakerStatus).filter(cb => cb.state === 'open').length,
      recoveringServices: Object.values(circuitBreakerStatus).filter(cb => cb.state === 'half-open').length
    };
    
    res.json({
      success: true,
      data: {
        summary,
        services: circuitBreakerStatus,
        systemHealth: summary.degradedServices === 0 ? 'healthy' : 
                     summary.degradedServices < summary.totalServices / 2 ? 'degraded' : 'critical'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Failed to get circuit breaker status: ${error.message}`
    });
  }
});

/**
 * Epic 2.5.3 Task 3.4: Quality Gates for Production Deployment Validation
 * GET /api/monitoring/quality-gates
 */
monitoringRouter.get('/quality-gates', async (_req: Request, res: Response) => {
  try {
    const costTracker = ApiCostTracker.getInstance();
    const qualityGateResults = costTracker.validateQualityGates();
    
    res.json({
      success: true,
      data: {
        ...qualityGateResults,
        deploymentReady: qualityGateResults.passed,
        recommendations: qualityGateResults.passed 
          ? ['System ready for production deployment']
          : qualityGateResults.gates
              .filter(g => !g.passed)
              .map(g => `Address ${g.name}: ${g.details}`)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Failed to validate quality gates: ${error.message}`
    });
  }
});