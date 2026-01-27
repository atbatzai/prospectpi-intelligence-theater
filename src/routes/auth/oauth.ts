/**
 * OAuth 2.0 Routes
 * Story 5.1: Enterprise Authentication
 */

import { Router, Request, Response } from 'express';
import { oauthRegistry } from '../../services/auth/OAuthProviderRegistry';
import { oauthStateManager } from '../../services/auth/OAuthStateManager';
import { oauthUserProvisioning } from '../../services/auth/OAuthUserProvisioning';
import { UserService } from '../../models/User';
import axios from 'axios';

const oauthRouter = Router();
const userService = new UserService();

// List available OAuth providers
oauthRouter.get('/providers', (req: Request, res: Response) => {
  const providers = oauthRegistry.listProviders();
  res.json({
    providers: providers.map(p => ({
      name: p.name,
      type: 'oauth2',
      enabled: true
    }))
  });
});

// Initiate OAuth flow
oauthRouter.get('/:provider/authorize', async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    const oauthProvider = oauthRegistry.getProvider(provider);

    if (!oauthProvider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    // Generate CSRF state token
    const state = await oauthStateManager.generateState();

    // Build authorization URL
    const authUrl = new URL(oauthProvider.authorizationURL);
    authUrl.searchParams.set('client_id', oauthProvider.clientID);
    authUrl.searchParams.set('redirect_uri', oauthProvider.callbackURL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', oauthProvider.scope.join(' '));
    authUrl.searchParams.set('state', state);

    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('OAuth authorization error:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

// OAuth callback
oauthRouter.get('/:provider/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;
    const { provider } = req.params;

    if (!code || !state) {
      res.status(400).json({ error: 'Missing code or state parameter' });
      return;
    }

    // Verify CSRF state
    const isValidState = await oauthStateManager.verifyState(state as string);
    if (!isValidState) {
      res.status(403).json({ error: 'Invalid state parameter (CSRF protection)' });
      return;
    }

    const oauthProvider = oauthRegistry.getProvider(provider);
    if (!oauthProvider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(oauthProvider.tokenURL, new URLSearchParams({
      code: code as string,
      client_id: oauthProvider.clientID,
      client_secret: oauthProvider.clientSecret,
      redirect_uri: oauthProvider.callbackURL,
      grant_type: 'authorization_code'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = tokenResponse.data;

    // Get user profile
    let profileUrl = '';
    if (provider === 'google') {
      profileUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    } else if (provider === 'microsoft') {
      profileUrl = 'https://graph.microsoft.com/v1.0/me';
    } else if (provider === 'github') {
      profileUrl = 'https://api.github.com/user';
    }

    const profileResponse = await axios.get(profileUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const profile = oauthProvider.profileMapper(profileResponse.data);

    // Provision user
    const user = await oauthUserProvisioning.provisionUser(profile);

    // Generate ProspectPI JWT
    const jwt = await userService.generateJWT(user);

    // Redirect to dashboard with JWT
    res.redirect(`/dashboard?token=${jwt}`);
  } catch (error: any) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

// Token refresh endpoint
oauthRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({ error: 'Missing refresh token' });
      return;
    }

    // TODO: Implement token refresh logic
    res.status(501).json({ error: 'Token refresh not yet implemented' });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

export { oauthRouter };
