/**
 * SAML 2.0 Routes for Enterprise SSO
 * Story 5.1: Enterprise Authentication
 */

import { Router, Request, Response } from 'express';
import { samlService } from '../../services/auth/SAMLService';
import { oauthUserProvisioning } from '../../services/auth/OAuthUserProvisioning';
import { UserService } from '../../models/User';
import { authMiddleware } from '../../middleware/authMiddleware';

const samlRouter = Router();
const userService = new UserService();

// Get SAML metadata for organization
samlRouter.get('/metadata/:organizationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const config = await samlService.getSAMLConfig(organizationId);

    if (!config) {
      res.status(404).json({ error: 'SAML not configured for this organization' });
      return;
    }

    const metadata = `
      <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
        entityID="${config.issuer}">
        <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
          <AssertionConsumerService
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Location="${config.callbackUrl}"
            index="0" />
        </SPSSODescriptor>
      </EntityDescriptor>
    `;

    res.set('Content-Type', 'application/xml');
    res.send(metadata);
  } catch (error: any) {
    console.error('SAML metadata error:', error);
    res.status(500).json({ error: 'Failed to retrieve SAML metadata' });
  }
});

// Initiate SAML authentication
samlRouter.get('/login/:organizationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const config = await samlService.getSAMLConfig(organizationId);

    if (!config) {
      res.status(404).json({ error: 'SAML not configured for this organization' });
      return;
    }

    const samlRequest = samlService.generateSAMLRequest(config);

    // Redirect to IdP with SAML request
    const redirectUrl = `${config.entryPoint}?SAMLRequest=${encodeURIComponent(samlRequest)}`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('SAML login error:', error);
    res.status(500).json({ error: 'Failed to initiate SAML authentication' });
  }
});

// SAML assertion consumer service (ACS)
samlRouter.post('/acs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { SAMLResponse } = req.body;

    if (!SAMLResponse) {
      res.status(400).json({ error: 'Missing SAML response' });
      return;
    }

    // Verify and parse SAML response
    const samlData = await samlService.verifySAMLResponse(SAMLResponse);

    // Provision or get user
    const user = await oauthUserProvisioning.provisionUser({
      email: samlData.email,
      name: `${samlData.firstName || ''} ${samlData.lastName || ''}`.trim() || samlData.email,
      provider: 'saml',
      providerId: samlData.nameID,
      picture: undefined
    });

    // Generate JWT
    const jwt = await userService.generateJWT(user);

    // Redirect to dashboard with JWT
    res.redirect(`/dashboard?token=${jwt}`);
  } catch (error: any) {
    console.error('SAML ACS error:', error);
    res.status(500).json({ error: 'SAML authentication failed' });
  }
});

// Configure SAML for organization (admin only)
samlRouter.post('/configure', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId, entityId, entryPoint, certificate, issuer, callbackUrl } = req.body;

    if (!organizationId || !entityId || !entryPoint || !certificate || !issuer) {
      res.status(400).json({ error: 'Missing required SAML configuration' });
      return;
    }

    await samlService.registerSAMLProvider(organizationId, {
      entityId,
      entryPoint,
      cert: certificate,
      issuer,
      callbackUrl: callbackUrl || `${process.env.API_URL}/api/auth/saml/acs`
    });

    res.json({
      success: true,
      message: 'SAML configured successfully'
    });
  } catch (error: any) {
    console.error('SAML configuration error:', error);
    res.status(500).json({ error: 'Failed to configure SAML' });
  }
});

export { samlRouter };
