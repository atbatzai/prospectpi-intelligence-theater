/**
 * ProspectPI - ML Predictions API Routes
 * Story 8.1: Predictive Intelligence Engine Integration
 */

import express from 'express';
import { PredictiveIntelligenceEngine } from '../../services/ai/PredictiveIntelligenceEngine';
import { DatabaseManager } from '../../database/DatabaseManager';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();
const predictiveEngine = new PredictiveIntelligenceEngine();
let engineInitialized = false;

// Initialize engine on first use
router.use(async (req, res, next) => {
  if (!engineInitialized) {
    await predictiveEngine.initialize();
    engineInitialized = true;
  }
  next();
});

/**
 * POST /api/v1/predictions/:dossierId
 * Generate predictions for a specific dossier
 */
router.post('/:dossierId', authMiddleware, async (req, res) => {
  try {
    const { dossierId } = req.params;
    
    // Fetch dossier
    const dbManager = DatabaseManager.getInstance();
    const dossier = await dbManager.queryOne(
      'SELECT * FROM dossiers WHERE id = ?',
      [dossierId]
    );

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier not found' });
    }

    // Generate predictions
    const startTime = Date.now();
    const prediction = await predictiveEngine.predict(dossier);
    const latency = Date.now() - startTime;

    res.json({
      success: true,
      prediction,
      metadata: {
        latencyMs: latency,
        modelVersion: prediction.modelVersion
      }
    });
  } catch (error: any) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/predictions/:dossierId/history
 * Get prediction history for a dossier
 */
router.get('/:dossierId/history', authMiddleware, async (req, res) => {
  try {
    const { dossierId } = req.params;
    const dbManager = DatabaseManager.getInstance();
    
    const predictions = await dbManager.query(
      SELECT * FROM ml_predictions 
      WHERE dossier_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    , [dossierId]);

    res.json({ success: true, predictions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/predictions/metrics
 * Get model performance metrics
 */
router.get('/metrics', authMiddleware, async (req, res) => {
  try {
    const metrics = await predictiveEngine.getModelMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
