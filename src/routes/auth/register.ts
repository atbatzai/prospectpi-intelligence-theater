import { Request, Response } from 'express';
import { UserService } from '../../models/User';
import Joi from 'joi';
import jwt from 'jsonwebtoken';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
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

    const { email, password } = value;
    const userService = new UserService();

    try {
      // Create new user
      const user = await userService.createUser({ email, password });

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