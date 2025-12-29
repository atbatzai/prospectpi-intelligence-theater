import { Request, Response } from 'express';
import { UserService } from '../../models/User';
import Joi from 'joi';
import jwt from 'jsonwebtoken';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  organization_id: Joi.string().uuid().optional()
});

export const registerHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
      return;
    }

    const { email, password, first_name, last_name, organization_id } = value;
    const userService = new UserService();

    try {
      // Create new user
      const user = await userService.createUser({ 
        email, 
        password, 
        first_name, 
        last_name, 
        organization_id 
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          createdAt: user.created_at
        },
        token
      });
    } catch (userError: any) {
      if (userError.message.includes('already exists')) {
        res.status(409).json({
          error: 'User already exists',
          message: userError.message
        });
      } else {
        throw userError;
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user'
    });
  }
};