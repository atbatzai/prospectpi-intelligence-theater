/**
 * ProspectPI Intelligence Theater - GDPR Privacy Routes
 * Minimal GDPR Compliance Implementation
 */

import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { UserService, ConsentUpdateInput } from '../../models/User';
import { AuditService } from '../../services/AuditService';

export const privacyRouter = Router();

const userService = new UserService();
const auditService = new AuditService();

// Middleware to extract user from JWT (simplified)
const requireAuth = (req: any, res: any, next: any) => {
  // In production, this would validate JWT and set req.user
  // For now, assuming user is set by auth middleware
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// GDPR Article 15 - Right to Access (Data Export)
privacyRouter.get('/export', requireAuth, asyncHandler(async (req: any, res: any) => {
  try {
    const userDataExport = await userService.exportUserData(req.user.id);
    
    // Log the data export request
    await auditService.logAction(
      'DATA_EXPORT_REQUEST',
      'user',
      req.user.id,
      req.user.id,
      { export_type: 'full_profile' },
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      success: true,
      message: 'User data exported successfully',
      data: userDataExport,
      exported_at: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export user data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// GDPR Article 17 - Right to be Forgotten (Account Deletion)
privacyRouter.delete('/account', requireAuth, asyncHandler(async (req: any, res: any) => {
  try {
    // First request deletion (grace period)
    await userService.requestAccountDeletion(req.user.id);
    
    // Log the deletion request
    await auditService.logAction(
      'ACCOUNT_DELETION_REQUESTED',
      'user',
      req.user.id,
      req.user.id,
      { deletion_requested: true },
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      success: true,
      message: 'Account deletion requested. Your account will be deactivated and marked for deletion. Contact support within 30 days to cancel this request.',
      deletion_requested_at: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to request account deletion',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// GDPR Article 7 - Consent Management
privacyRouter.put('/consent', requireAuth, asyncHandler(async (req: any, res: any) => {
  try {
    const consentData: ConsentUpdateInput = req.body;

    // Validate consent data
    if (typeof consentData.consent_marketing !== 'boolean' ||
        typeof consentData.consent_analytics !== 'boolean' ||
        typeof consentData.data_processing_consent !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid consent data format'
      });
    }

    await userService.updateUserConsent(req.user.id, consentData);

    // Log consent update
    await auditService.logAction(
      'CONSENT_UPDATED',
      'user',
      req.user.id,
      req.user.id,
      { 
        marketing: consentData.consent_marketing,
        analytics: consentData.consent_analytics,
        data_processing: consentData.data_processing_consent
      },
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      success: true,
      message: 'Consent preferences updated successfully',
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update consent preferences',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get current consent status
privacyRouter.get('/consent', requireAuth, asyncHandler(async (req: any, res: any) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      consent: {
        marketing: user.consent_marketing,
        analytics: user.consent_analytics,
        data_processing: user.data_processing_consent,
        consent_date: user.gdpr_consent_date,
        data_region: user.data_region
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve consent status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Update data region (for regional processing compliance)
privacyRouter.put('/region', requireAuth, asyncHandler(async (req: any, res: any) => {
  try {
    const { region } = req.body;
    
    if (!['US', 'EU', 'UK', 'CA'].includes(region)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid region. Must be one of: US, EU, UK, CA'
      });
    }

    await userService.setUserDataRegion(req.user.id, region);

    // Log region update
    await auditService.logAction(
      'DATA_REGION_UPDATED',
      'user',
      req.user.id,
      req.user.id,
      { new_region: region },
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      success: true,
      message: `Data processing region updated to ${region}`,
      region: region,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update data region',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));