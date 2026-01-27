import { Request, Response } from 'express';
import { database } from '../../database';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Get full user data
    const userData = database.prepare('SELECT * FROM users WHERE id = ?').get(user.userId) as any;
    const organization = database.prepare('SELECT * FROM organizations WHERE id = ?').get(userData.organization_id);

    // Get usage stats
    const dossierCount = database.prepare(
      'SELECT COUNT(*) as count FROM research_requests WHERE user_id = ?'
    ).get(user.userId) as any;

    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        organization_id: userData.organization_id,
        subscription_plan: (organization as any).plan_tier,
        dossiers_used_this_month: dossierCount.count,
        dossier_limit: (organization as any).usage_limit,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      },
      organization
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};