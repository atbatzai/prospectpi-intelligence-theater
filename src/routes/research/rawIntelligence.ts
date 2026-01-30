/**
 * ProspectPI Intelligence Theater - Raw Intelligence API Routes
 * 
 * These endpoints let you see 100% of what came from each data source
 * BEFORE the Detective synthesizes it into a dossier.
 * 
 * Endpoints:
 *   GET /api/v1/research/:requestId/raw-intelligence          - Summary of all sources
 *   GET /api/v1/research/:requestId/raw-intelligence/:source  - Full data from one source
 *   GET /api/v1/research/:requestId/raw-intelligence/export   - Download all as JSON
 *   GET /api/v1/research/raw-intelligence/requests            - List all requests with raw data
 */

import { Router, Request, Response } from 'express';
import { RawIntelligenceVault } from '../../services/RawIntelligenceVault';
import { SourceQualityGuide } from '../../services/SourceQualityGuide';
import { optionalAuth } from '../../middleware/auth';

export const rawIntelligenceRouter = Router();

/**
 * GET /api/v1/research/:requestId/raw-intelligence
 * Get summary of all sources collected for a research request
 * Shows: source name, status, confidence, data size, key fields preview
 */
rawIntelligenceRouter.get('/:requestId/raw-intelligence', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const vault = RawIntelligenceVault.getInstance();
    
    const summary = await vault.getIntelligenceSummary(requestId);
    
    if (summary.totalSources === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No raw intelligence found for request: ${requestId}`
        }
      });
      return;
    }

    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error('Error fetching raw intelligence summary:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/research/:requestId/raw-intelligence/all
 * Get 100% of raw data from ALL sources for a request
 * WARNING: This can be a large response!
 */
rawIntelligenceRouter.get('/:requestId/raw-intelligence/all', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const vault = RawIntelligenceVault.getInstance();
    
    const allRecords = await vault.getAllRawIntelligence(requestId);
    
    if (allRecords.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No raw intelligence found for request: ${requestId}`
        }
      });
      return;
    }

    // Group by source for easier viewing
    const bySource: Record<string, any> = {};
    for (const record of allRecords) {
      bySource[record.source] = {
        status: record.status,
        confidence: record.confidence,
        cost: record.apiCost,
        responseTimeMs: record.responseTimeMs,
        dataSize: record.dataSize,
        fetchedAt: record.fetchedAt,
        errorMessage: record.errorMessage,
        data: record.rawData  // 100% of the raw data
      };
    }

    const totalSize = allRecords.reduce((sum, r) => sum + r.dataSize, 0);
    
    res.json({
      success: true,
      meta: {
        requestId,
        sourceCount: allRecords.length,
        totalDataSize: totalSize,
        totalDataSizeFormatted: `${(totalSize / 1024).toFixed(1)} KB`
      },
      sources: bySource
    });
  } catch (error: any) {
    console.error('Error fetching all raw intelligence:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/research/:requestId/raw-intelligence/source/:source
 * Get 100% of raw data from ONE specific source
 * e.g., /api/v1/research/req_abc123/raw-intelligence/source/theirstack
 */
rawIntelligenceRouter.get('/:requestId/raw-intelligence/source/:source', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId, source } = req.params;
    const vault = RawIntelligenceVault.getInstance();
    
    const displayData = await vault.getRawDataForDisplay(requestId, source);
    
    if (!displayData) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No data found for source '${source}' in request '${requestId}'`
        }
      });
      return;
    }

    // Parse back to object for JSON response (or send as string with format param)
    const format = req.query.format as string;
    
    if (format === 'text') {
      // Return as formatted JSON text (good for copy-paste)
      res.setHeader('Content-Type', 'text/plain');
      res.send(displayData.formattedJson);
      return;
    }

    res.json({
      success: true,
      source: displayData.source,
      metadata: displayData.metadata,
      data: JSON.parse(displayData.formattedJson)  // Full raw data
    });
  } catch (error: any) {
    console.error('Error fetching source raw intelligence:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/research/:requestId/raw-intelligence/export
 * Download all raw intelligence as a single JSON file
 */
rawIntelligenceRouter.get('/:requestId/raw-intelligence/export', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const vault = RawIntelligenceVault.getInstance();
    
    const exportJson = await vault.exportAllAsJson(requestId);
    const parsed = JSON.parse(exportJson);
    
    if (parsed.totalSources === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No raw intelligence found for request: ${requestId}`
        }
      });
      return;
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="raw-intelligence-${requestId}.json"`);
    res.send(exportJson);
  } catch (error: any) {
    console.error('Error exporting raw intelligence:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/research/raw-intelligence/requests
 * List all requests that have raw intelligence stored
 */
rawIntelligenceRouter.get('/raw-intelligence/requests', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const vault = RawIntelligenceVault.getInstance();
    
    const requests = await vault.listRequests(limit);
    
    res.json({
      success: true,
      count: requests.length,
      requests: requests.map(r => ({
        ...r,
        totalSizeFormatted: `${(r.totalSize / 1024).toFixed(1)} KB`
      }))
    });
  } catch (error: any) {
    console.error('Error listing raw intelligence requests:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/research/:requestId/synthesis-guide
 * Get source quality guide and hints for Detective synthesis
 * Shows: tier categorization, section mapping, synthesis instructions
 */
rawIntelligenceRouter.get('/:requestId/synthesis-guide', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const guide = new SourceQualityGuide();
    await guide.initialize();
    
    const hints = await guide.generateSynthesisHints(requestId);
    
    if (!hints) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No source data found for guided synthesis: ${requestId}`
        }
      });
      return;
    }

    // Also get the formatted prompt hints
    const promptHints = await guide.getDetectivePromptHints(requestId);

    res.json({
      success: true,
      data: {
        ...hints,
        formattedPromptHints: promptHints
      }
    });
  } catch (error: any) {
    console.error('Error generating synthesis guide:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * DELETE /api/v1/research/:requestId/raw-intelligence
 * Delete raw intelligence for a request (cleanup)
 */
rawIntelligenceRouter.delete('/:requestId/raw-intelligence', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const vault = RawIntelligenceVault.getInstance();
    
    const deletedCount = await vault.deleteRawIntelligence(requestId);
    
    res.json({
      success: true,
      message: `Deleted ${deletedCount} raw intelligence records for request: ${requestId}`
    });
  } catch (error: any) {
    console.error('Error deleting raw intelligence:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});
