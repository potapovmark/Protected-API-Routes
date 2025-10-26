import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  action: string;
  userId?: string;
  adminId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}

class Logger {
  private logDir: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(entry: LogEntry) {
    const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(entry) + '\n';

    fs.appendFileSync(logFile, logLine);
  }

  logAuthFailure(email: string, reason: string, ip?: string, userAgent?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      action: 'AUTH_FAILURE',
      details: {
        email: email.toLowerCase(),
        reason,
        ip,
        userAgent
      }
    });
  }

  logAuthSuccess(userId: string, email: string, ip?: string, userAgent?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      action: 'AUTH_SUCCESS',
      userId,
      details: {
        email: email.toLowerCase(),
        ip,
        userAgent
      }
    });
  }

  logAdminAction(adminId: string, action: string, targetUserId?: string, details?: any) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      action: `ADMIN_${action.toUpperCase()}`,
      adminId,
      userId: targetUserId,
      details
    });
  }

  logError(error: Error, context?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      action: 'SYSTEM_ERROR',
      details: {
        message: error.message,
        stack: error.stack,
        context
      }
    });
  }
}

export const logger = new Logger();
