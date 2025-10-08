import { Router } from 'express';
import { registerHandler } from './register';
import { loginHandler } from './login';
import { rateLimiter } from '../../middleware/rateLimiter';

const authRouter = Router();

// Auth endpoints with rate limiting
authRouter.post('/register', rateLimiter, registerHandler);
authRouter.post('/login', rateLimiter, loginHandler);

export { authRouter };