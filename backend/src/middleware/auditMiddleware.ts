import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../types/express';

const auditLog = async (
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: any,
  newValues?: any,
  req?: AuthRequest
) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress: req?.ip || req?.connection?.remoteAddress || 'unknown',
      userAgent: req?.get('User-Agent') || 'unknown',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

export const auditMiddleware = (action: string, entityType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    let responseData: any;

    // Capture response data
    res.send = function (data) {
      responseData = data;
      return originalSend.call(this, data);
    };

    res.on('finish', async () => {
      try {
        if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
          let entityId = '';

          // Extract entity ID based on route
          if (req.params.id) {
            entityId = req.params.id;
          } else if (responseData && typeof responseData === 'string') {
            try {
              const parsed = JSON.parse(responseData);
              entityId = parsed._id || parsed.id || '';
            } catch (e) {
              // Ignore parsing errors
            }
          }

          await auditLog(
            req.user._id.toString(),
            action,
            entityType,
            entityId,
            req.method === 'PUT' ? req.body : undefined,
            responseData,
            req
          );
        }
      } catch (error) {
        console.error('Audit middleware error:', error);
      }
    });

    next();
  };
};

export { auditLog };