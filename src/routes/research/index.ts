/**
 * ProspectPI Intelligence Theater - Research Routes
 * Story 1.2: REST API Endpoints & Request Handling
 */

import { Router } from 'express';
import { generateDossierHandler } from './generateDossier';
import { optionalAuth } from '../../middleware/auth';

export const researchRouter = Router();

// POST /api/v1/research/generate-dossier - Testing mode (subscription limits disabled)
researchRouter.post('/generate-dossier', optionalAuth, generateDossierHandler);

// YOLO: User Dossier Management Routes
import { DossierService } from '../../models/Dossier';

// GET /api/v1/research/dossiers - Get user's dossier history
researchRouter.get('/dossiers', optionalAuth, async (req: any, res): Promise<void> => {
  try {
    // 🚀 PRODUCTION-READY: Now using persistent demo user
    console.log('📚 Loading dossiers for user:', req.user?.id);
    
    if (!req.user?.id) {
      console.warn('⚠️ No authenticated user - this should not happen with optionalAuth');
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const includeArchived = req.query.archived === 'true';

    const dossierService = new DossierService();
    const result = await dossierService.getUserDossiers(req.user.id, {
      limit,
      offset,
      includeArchived
    });

    res.json({
      success: true,
      data: {
        dossiers: result.dossiers,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: result.hasMore
        }
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

// GET /api/v1/research/dossiers/:id - Get specific user dossier
researchRouter.get('/dossiers/:id', optionalAuth, async (req: any, res): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    const dossierService = new DossierService();
    const dossier = await dossierService.getUserDossierById(req.user.id, req.params.id);
    
    if (!dossier) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Dossier not found' }
      });
      return;
    }

    // Get full dossier with sections
    const fullDossier = await dossierService.getDossierWithSections(dossier.request_id);
    
    res.json({
      success: true,
      data: fullDossier
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

// DEV AGENT: Dossier Sharing API Endpoints

// POST /api/v1/research/dossiers/:id/share - Share dossier
researchRouter.post('/dossiers/:id/share', optionalAuth, async (req: any, res): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    const { sharedWithUserId, sharedWithOrganizationId, permissionLevel, expiresAt } = req.body;
    
    if (!permissionLevel || !['read', 'comment', 'export', 'admin'].includes(permissionLevel)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PERMISSION', message: 'Valid permission level required' }
      });
      return;
    }

    if (!sharedWithUserId && !sharedWithOrganizationId) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TARGET', message: 'Must specify user or organization to share with' }
      });
      return;
    }

    const dossierService = new DossierService();
    const share = await dossierService.shareDossier(req.params.id, req.user.id, {
      sharedWithUserId,
      sharedWithOrganizationId,
      permissionLevel,
      expiresAt
    });

    res.json({
      success: true,
      data: { share }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SHARE_ERROR', message: error.message }
    });
  }
});

// GET /api/v1/research/dossiers/:id/shares - Get dossier shares
researchRouter.get('/dossiers/:id/shares', optionalAuth, async (req: any, res): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    const dossierService = new DossierService();
    const shares = await dossierService.getDossierShares(req.params.id, req.user.id);

    res.json({
      success: true,
      data: { shares }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

// DELETE /api/v1/research/shares/:shareId - Revoke share
researchRouter.delete('/shares/:shareId', optionalAuth, async (req: any, res): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    const dossierService = new DossierService();
    await dossierService.revokeDossierShare(req.params.shareId, req.user.id);

    res.json({
      success: true,
      message: 'Share revoked successfully'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'REVOKE_ERROR', message: error.message }
    });
  }
});

// GET /api/v1/research/shared - Get dossiers shared with user
researchRouter.get('/shared', optionalAuth, async (req: any, res): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    const dossierService = new DossierService();
    const sharedDossiers = await dossierService.getSharedDossiers(req.user.id);

    res.json({
      success: true,
      data: { dossiers: sharedDossiers }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

// GET /api/v1/research/results/:requestId - For retrieving completed dossiers
researchRouter.get('/results/:requestId', optionalAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log(`🔍 FBI-QUALITY DOSSIER RETRIEVAL: ${requestId}`);
    
    // Import database services
    const { DatabaseManager } = await import('../../database/DatabaseManager');
    const { DossierService } = await import('../../models/Dossier');
    
    const db = DatabaseManager.getInstance();
    const dossierService = new DossierService();
    
    // Check if dossier exists
    const dossier = await dossierService.getDossierByRequestId(requestId);
    
    if (!dossier) {
      // Check if request exists but dossier is still processing
      const request = await db.queryOne('SELECT * FROM research_requests WHERE request_id = ?', [requestId]);
      
      if (!request) {
        res.status(404).json({
          success: false,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: `Research request ${requestId} not found`,
            details: 'The request ID may be invalid or expired'
          }
        });
        return;
      }
      
      if (request.status === 'processing') {
        res.status(202).json({
          success: false,
          status: 'processing',
          message: 'FBI-Quality dossier is still being generated',
          progress: {
            requestId: requestId,
            status: request.status,
            estimatedCompletion: request.estimated_completion,
            websocketUrl: `ws://localhost:3001/ws/research/${requestId}`
          }
        });
        return;
      }
      
      if (request.status === 'error') {
        res.status(500).json({
          success: false,
          error: {
            code: 'GENERATION_FAILED',
            message: 'Dossier generation failed',
            details: request.error_message || 'Unknown error occurred during generation'
          }
        });
        return;
      }
      
      // Request exists but no dossier found - shouldn't happen
      res.status(500).json({
        success: false,
        error: {
          code: 'INCONSISTENT_STATE',
          message: 'Request completed but dossier not found',
          details: 'Database inconsistency detected'
        }
      });
      return;
    }
    
    // Check for real dossier content first
    const dossierContent = await db.queryOne('SELECT * FROM dossier_content WHERE request_id = ?', [requestId]);
    
    if (dossierContent) {
      // Return the real FBI-quality dossier from agents
      console.log(`✅ REAL FBI-QUALITY DOSSIER RETRIEVED: ${requestId}`);
      
      let realDossier;
      try {
        realDossier = JSON.parse(dossierContent.content_json);
      } catch (parseError) {
        console.error('Error parsing dossier content JSON:', parseError);
        res.status(500).json({
          success: false,
          error: {
            code: 'CONTENT_PARSE_ERROR',
            message: 'Failed to parse dossier content',
            details: 'Stored dossier content is corrupted'
          }
        });
        return;
      }

      // Transform agent dossier format to frontend format
      const transformedDossier = {
        id: dossier.id,
        companyName: dossier.company_name,
        vendorName: realDossier.vendorName || 'Unknown Vendor',
        productName: realDossier.productName || 'Unknown Product',
        industry: realDossier.industry || 'Unknown Industry',
        primaryPainPoint: realDossier.primaryPainPoint || 'Unknown Pain Point',
        classification: dossier.classification,
        generatedAt: dossier.generated_at,
        confidence: dossier.confidence_score,
        sourceCount: dossier.source_count,
        sections: [], // Will populate from structuredSections
        executiveSummary: realDossier.structuredSections?.executiveSummary?.summary || 
                         realDossier.structuredSections?.executiveSummary?.content ||
                         realDossier.structuredSections?.executiveSummary ||
                         realDossier.executiveSummary ||
                         'Executive summary not available',
        structuredSections: realDossier.structuredSections || {},
        solutionRelevanceScore: realDossier.solutionRelevanceScore || 75
      };

      // Convert structured sections to sections array for frontend compatibility
      if (realDossier.structuredSections) {
        const sectionsArray = Object.entries(realDossier.structuredSections).map(([key, value]) => {
          let content = '';
          let summary = '';
          
          // Handle different content structures
          if (typeof value === 'object' && value !== null) {
            // If it has a summary field, use that
            if ('summary' in value) {
              summary = (value as any).summary || '';
              content = summary;
            }
            
            // If it has content field, use that
            if ('content' in value) {
              content = (value as any).content || content;
            }
            
            // If it has insights, recommendations, etc., extract them
            if ('insights' in value && Array.isArray((value as any).insights)) {
              const insights = (value as any).insights;
              content = insights.map((insight: any) => 
                typeof insight === 'string' ? insight : 
                insight.text || insight.description || insight.content || JSON.stringify(insight)
              ).join('\n\n');
            }
            
            // If it has recommendations
            if ('recommendations' in value && Array.isArray((value as any).recommendations)) {
              const recommendations = (value as any).recommendations;
              content += '\n\n**Recommendations:**\n' + recommendations.map((rec: any) => 
                typeof rec === 'string' ? `• ${rec}` : 
                `• ${rec.text || rec.description || rec.recommendation || JSON.stringify(rec)}`
              ).join('\n');
            }
            
            // If it has keyFindings
            if ('keyFindings' in value && Array.isArray((value as any).keyFindings)) {
              const findings = (value as any).keyFindings;
              content += '\n\n**Key Findings:**\n' + findings.map((finding: any) => 
                typeof finding === 'string' ? `• ${finding}` : 
                `• ${finding.text || finding.description || finding.finding || JSON.stringify(finding)}`
              ).join('\n');
            }
            
            // If nothing else worked, try to extract meaningful content
            if (!content && !summary) {
              // Look for any text-like properties
              const textProps = ['description', 'text', 'details', 'analysis', 'overview'];
              for (const prop of textProps) {
                if (prop in value && typeof (value as any)[prop] === 'string') {
                  content = (value as any)[prop];
                  break;
                }
              }
              
              // If still no content, stringify the object but make it readable
              if (!content) {
                content = JSON.stringify(value, null, 2)
                  .replace(/[{}"]/g, '')
                  .replace(/,\s*\n/g, '\n')
                  .replace(/:\s*/g, ': ')
                  .trim();
              }
            }
          } else if (typeof value === 'string') {
            content = value;
            summary = value.length > 200 ? value.substring(0, 200) + '...' : value;
          } else {
            content = String(value);
            summary = content.length > 200 ? content.substring(0, 200) + '...' : content;
          }
          
          return {
            id: key,
            title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            content: content || 'No content available',
            confidence: 'high' as 'high' | 'medium' | 'limited',
            summary: summary || 'No summary available'
          };
        });
        (transformedDossier as any).sections = sectionsArray;
      }

      const response = {
        success: true,
        dossier: transformedDossier,
        meta: {
          generatedBy: 'FBI-Quality 3-Agent System',
          totalCost: realDossier.totalCost || 0,
          executionTime: realDossier.executionTime || 0,
          apiSources: realDossier.sourcesUsed || [],
          confidenceScore: dossier.confidence_score
        }
      };

      res.status(200).json(response);
      return;
    }
    
    // Fallback: Legacy format (if no dossier_content exists)
    const sections = await db.query('SELECT * FROM intelligence_sections WHERE dossier_id = ? ORDER BY display_order', [dossier.id]);
    const dataSources = await db.query('SELECT * FROM data_sources WHERE dossier_id = ?', [dossier.id]);
    
    // Get insights for each section
    for (const section of sections) {
      section.insights = await db.query('SELECT * FROM intelligence_insights WHERE section_id = ? ORDER BY display_order', [section.id]);
    }
    
    // Return legacy structured dossier
    const fbiQualityDossier = {
      success: true,
      dossier: {
        id: dossier.id,
        requestId: dossier.request_id,
        companyName: dossier.company_name,
        classification: dossier.classification,
        confidenceScore: dossier.confidence_score,
        sourceCount: dossier.source_count,
        generatedAt: dossier.generated_at,
        lastUpdated: dossier.last_updated,
        
        // FBI-Quality Intelligence Sections
        intelligenceSections: sections,
        
        // Data Source Attribution
        dataSources: dataSources,
        
        // Quality Metrics
        qualityMetrics: {
          totalSources: dataSources.length,
          averageReliability: dataSources.reduce((acc, ds) => acc + ds.reliability, 0) / dataSources.length,
          dataFreshness: Math.min(...dataSources.map(ds => ds.data_freshness_hours || 24)),
          confidenceLevel: dossier.confidence_score
        }
      }
    };
    
    console.log(`✅ FBI-QUALITY DOSSIER RETRIEVED: ${requestId} - ${sections.length} sections, ${dataSources.length} sources`);
    res.status(200).json(fbiQualityDossier);
    
  } catch (error: any) {
    console.error('❌ DOSSIER RETRIEVAL ERROR:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RETRIEVAL_ERROR',
        message: 'Failed to retrieve dossier results',
        details: error.message
      }
    });
  }
});