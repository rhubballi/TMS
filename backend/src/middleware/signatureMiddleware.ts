import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from './authMiddleware';
import { ElectronicSignature } from '../models/ElectronicSignature';
import { logAuditEvent } from '../services/auditService';
import { AuditEventType, EventSource } from '../models/TrainingAuditLog';

/**
 * Middleware: requireElectronicSignature
 * Enforces a password-verified electronic signature for sensitive Admin/QA actions.
 * @param actionType - The specific governance action Being signed (e.g. "GOVERNANCE_CONFIG_UPDATE")
 */
export const requireElectronicSignature = (actionType: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { signaturePassword, signatureReason } = req.body;

        // 1. Validate Input
        if (!signaturePassword || !signatureReason) {
            return res.status(400).json({
                message: 'Electronic signature required: please provide password and reason for this action.'
            });
        }

        // 2. Validate Role (Already protected by adminOnly usually, but double checking for safety)
        if (!req.user || (req.user.role !== 'Administrator' && req.user.role !== 'QA')) {
            return res.status(403).json({ message: 'Signature denied: Unauthorized role.' });
        }

        try {
            // 3. Verify Password
            const User = (await import('../models/User')).default;
            const user = await User.findById(req.user._id);

            if (!user) {
                return res.status(401).json({ message: 'User not found during signature verification.' });
            }

            const isMatch = await bcrypt.compare(signaturePassword, user.password);

            if (!isMatch) {
                // Log failure
                await logAuditEvent({
                    event_type: AuditEventType.SIGNATURE_FAILED,
                    user_id: req.user._id,
                    event_source: EventSource.ADMIN,
                    metadata: { actionType, reason: 'Invalid password' },
                    ip_address: req.ip
                });

                return res.status(401).json({ message: 'Electronic signature failed: Invalid password.' });
            }

            // 4. Create Immutable Signature Record
            await ElectronicSignature.create({
                adminUser: req.user._id,
                actionType,
                reason: signatureReason,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            // 5. Log Success Audit Event
            await logAuditEvent({
                event_type: AuditEventType.SIGNATURE_CAPTURED,
                user_id: req.user._id,
                event_source: EventSource.ADMIN,
                metadata: { actionType, signatureReason },
                ip_address: req.ip
            });

            // Clean up request body so password doesn't leak into controllers
            delete req.body.signaturePassword;

            next();

        } catch (error) {
            console.error('[Signature Middleware] Error:', error);
            res.status(500).json({ message: 'Signature verification system error.' });
        }
    };
};
