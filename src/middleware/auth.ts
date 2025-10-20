import { Request, Response, NextFunction } from 'express';
import { authService} from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const decoded = authService.verifyAccessToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }

  req.user = decoded;
  next();
}
