import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { GovernanceConfig } from '../models/GovernanceConfig';
import { logAuditEvent } from '../services/auditService';
import { AuditEventType, EventSource } from '../models/TrainingAuditLog';

// @desc    Get current active governance configuration
// @route   GET /api/governance/current
// @access  Private (Admin/QA)
export const getCurrentConfig = async (req: AuthRequest, res: Response) => {
    try {
        const config = await GovernanceConfig.findOne({ isActive: true }).sort({ version: -1 });
        if (!config) {
            return res.status(404).json({ message: 'No active governance configuration found.' });
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get governance configuration history
// @route   GET /api/governance/history
// @access  Private (Admin/QA)
export const getConfigHistory = async (req: AuthRequest, res: Response) => {
    try {
        const history = await GovernanceConfig.find().sort({ version: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Update governance configuration (Create new version)
// @route   POST /api/governance/update
// @access  Private (Admin) - Signature Required
export const updateConfig = async (req: AuthRequest, res: Response) => {
    const { name, description, config, signatureReason } = req.body;

    try {
        // 1. Get latest version
        const latest = await GovernanceConfig.findOne().sort({ version: -1 });
        const nextVersion = latest ? latest.version + 1 : 1;

        // 2. Deactivate current active config
        await GovernanceConfig.updateMany({ isActive: true }, { isActive: false });

        // 3. Create new version
        // signatureId should be passed by the middleware or retrieved from the latest signature record
        const ElectronicSignature = (await import('../models/ElectronicSignature')).ElectronicSignature;
        const lastSignature = await ElectronicSignature.findOne({ adminUser: req.user!._id }).sort({ timestamp: -1 });

        if (!lastSignature) {
            return res.status(500).json({ message: 'Critical Error: Signature record not found after verification.' });
        }

        const newConfig = await GovernanceConfig.create({
            version: nextVersion,
            name,
            description,
            config,
            isActive: true,
            createdBy: req.user!._id,
            signatureId: lastSignature._id
        });

        // 4. Log Audit Event
        await logAuditEvent({
            event_type: AuditEventType.GOVERNANCE_CONFIG_UPDATED,
            user_id: req.user!._id,
            event_source: EventSource.ADMIN,
            metadata: { version: nextVersion, name, reason: signatureReason },
            ip_address: req.ip
        });

        res.status(201).json(newConfig);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Rollback to a specific version
// @route   POST /api/governance/rollback/:version
// @access  Private (Admin) - Signature Required
export const rollbackConfig = async (req: AuthRequest, res: Response) => {
    const { version } = req.params;
    const { signatureReason } = req.body;

    try {
        const targetConfig = await GovernanceConfig.findOne({ version: parseInt(version) });
        if (!targetConfig) {
            return res.status(404).json({ message: `Governance configuration version ${version} not found.` });
        }

        // 1. Deactivate current active config
        await GovernanceConfig.updateMany({ isActive: true }, { isActive: false });

        // 2. Create a NEW version based on the target (to preserve history)
        const latest = await GovernanceConfig.findOne().sort({ version: -1 });
        const nextVersion = latest ? latest.version + 1 : 1;

        const ElectronicSignature = (await import('../models/ElectronicSignature')).ElectronicSignature;
        const lastSignature = await ElectronicSignature.findOne({ adminUser: req.user!._id }).sort({ timestamp: -1 });

        const rolledBackConfig = await GovernanceConfig.create({
            version: nextVersion,
            name: `Rollback to v${version}: ${targetConfig.name}`,
            description: `Automatic rollback triggered. Original reason: ${signatureReason}`,
            config: targetConfig.config,
            isActive: true,
            createdBy: req.user!._id,
            signatureId: lastSignature?._id
        });

        // 3. Log Audit Event
        await logAuditEvent({
            event_type: AuditEventType.GOVERNANCE_CONFIG_ROLLED_BACK,
            user_id: req.user!._id,
            event_source: EventSource.ADMIN,
            metadata: { fromVersion: version, newVersion: nextVersion, reason: signatureReason },
            ip_address: req.ip
        });

        res.json(rolledBackConfig);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
