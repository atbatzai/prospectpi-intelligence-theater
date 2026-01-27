import { Router } from 'express';
import { registerHandler } from './register';
import { loginHandler } from './login';
import { rateLimiter } from '../../middleware/rateLimiter';
import { authenticateJWT } from '../../middleware/auth';

const authRouter = Router();

// Auth endpoints with rate limiting
authRouter.post('/register', rateLimiter, registerHandler);
authRouter.post('/login', rateLimiter, loginHandler);

// User profile and subscription management (protected)
authRouter.get('/profile', authenticateJWT, async (req: any, res) => {
  try {
    const { UserService } = await import('../../models/User');
    const userService = new UserService();
    const user = await userService.getUserById(req.user.id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Return user profile with subscription info (excluding sensitive data)
    const { password_hash, email_verification_token, password_reset_token, ...safeUser } = user;
    
    res.json({
      success: true,
      data: {
        user: safeUser,
        subscription: {
          plan: user.subscription_plan,
          status: user.subscription_status,
          usage: {
            dossiers_used_this_month: user.dossiers_used_this_month,
            dossier_limit: user.dossier_limit,
            remaining: user.dossier_limit - user.dossiers_used_this_month
          },
          trial_ends_at: user.trial_ends_at,
          current_period_end: user.current_period_end
        }
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

export default authRouter;