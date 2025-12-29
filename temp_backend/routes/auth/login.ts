import { Request, Response } from 'express';
import { UserService } from '../../models/User';
import Joi from 'joi';
import jwt from 'jsonwebtoken';

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
      return;
    }

    const { email, password } = value;
    const userService = new UserService();

    // Find user by email
    const user = await userService.getUserByEmail(email);
    if (!user) {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
      return;
    }

    // Verify password
    const isValidPassword = await userService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process login'
    });
  }
};