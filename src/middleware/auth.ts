import { Request, Response, NextFunction } from 'express';
import { authService} from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const decoded = await authService.verifyAccessToken(token);
    if (!decoded) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

export const requireEmailVerification = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isEmailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email not verified',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

export const requireOwnership = (resourceUserField = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'AUTHORIZATION_REQUIRED'
      });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    const resourceId = req.params[resourceUserField] || req.body[resourceUserField];

    if(req.user.userId !== resourceId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        code: 'FORBIDDEN'
      });
    }
    next();
  };
};
