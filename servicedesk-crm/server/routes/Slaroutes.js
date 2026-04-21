import express from 'express';
const router = express.Router();
import SLA from '../models/Sla.js';
import Ticket from '../models/Ticket.js';
import authenticate from '../middleware/authMiddleware.js';
import { requireRole as authorize } from '../middleware/rbacMiddleware.js';
import slaMonitoringService from '../utils/Slamonitoringservice.js';

// ===== GET ALL SLA POLICIES =====
router.get('/sla-policies', authenticate, async (req, res) => {
    try {
        const policies = await SLA.find().sort({ priority: 1 });
        res.json(policies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== CREATE SLA POLICY (Admin only) =====
router.post('/sla-policies', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const { name, priority, responseTime, resolutionTime, businessHoursOnly } = req.body;

        // Check if policy for this priority already exists
        const existing = await SLA.findOne({ priority, isActive: true });
        if (existing) {
            return res.status(400).json({
                error: `Active SLA policy for ${priority} priority already exists`
            });
        }

        const slaPolicy = await SLA.create({
            name,
            priority,
            responseTime,
            resolutionTime,
            businessHoursOnly
        });

        res.status(201).json(slaPolicy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== UPDATE SLA POLICY (Admin only) =====
router.put('/sla-policies/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const { name, responseTime, resolutionTime, businessHoursOnly, isActive } = req.body;

        const slaPolicy = await SLA.findByIdAndUpdate(
            req.params.id,
            { name, responseTime, resolutionTime, businessHoursOnly, isActive },
            { new: true, runValidators: true }
        );

        if (!slaPolicy) {
            return res.status(404).json({ error: 'SLA policy not found' });
        }

        res.json(slaPolicy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== DELETE SLA POLICY (Admin only) =====
router.delete('/sla-policies/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const slaPolicy = await SLA.findByIdAndDelete(req.params.id);

        if (!slaPolicy) {
            return res.status(404).json({ error: 'SLA policy not found' });
        }

        res.json({ message: 'SLA policy deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== GET SLA STATISTICS =====
router.get('/sla/statistics', authenticate, async (req, res) => {
    try {
        const stats = await slaMonitoringService.getSLAStatistics();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== GET SLA DASHBOARD DATA =====
router.get('/sla/dashboard', authenticate, async (req, res) => {
    try {
        const now = new Date();

        // Overall statistics
        const stats = await slaMonitoringService.getSLAStatistics();

        // Breached tickets
        const breachedTickets = await Ticket.find({
            $or: [
                { 'sla.responseBreached': true },
                { 'sla.resolutionBreached': true }
            ]
        })
            .populate('user assignedTo', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        // At-risk tickets
        const atRiskTickets = await Ticket.find({
            'sla.status': 'At Risk',
            status: { $in: ['Open', 'In Progress'] }
        })
            .populate('user assignedTo', 'name email')
            .sort({ 'sla.responseDeadline': 1 })
            .limit(10);

        // SLA performance by priority
        const performanceByPriority = await Ticket.aggregate([
            {
                $match: {
                    'sla.responseDeadline': { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$priority',
                    total: { $sum: 1 },
                    met: {
                        $sum: {
                            $cond: [{ $eq: ['$sla.status', 'Met'] }, 1, 0]
                        }
                    },
                    breached: {
                        $sum: {
                            $cond: [{ $eq: ['$sla.status', 'Breached'] }, 1, 0]
                        }
                    },
                    atRisk: {
                        $sum: {
                            $cond: [{ $eq: ['$sla.status', 'At Risk'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    priority: '$_id',
                    total: 1,
                    met: 1,
                    breached: 1,
                    atRisk: 1,
                    complianceRate: {
                        $multiply: [
                            { $divide: ['$met', '$total'] },
                            100
                        ]
                    }
                }
            },
            {
                $sort: { priority: 1 }
            }
        ]);

        // Recent SLA events (last 24 hours)
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentEvents = await Ticket.find({
            updatedAt: { $gte: last24Hours },
            $or: [
                { 'sla.responseBreached': true },
                { 'sla.resolutionBreached': true },
                { 'sla.status': 'Met' }
            ]
        })
            .populate('user assignedTo', 'name email')
            .sort({ updatedAt: -1 })
            .limit(20);

        res.json({
            overview: stats,
            breachedTickets,
            atRiskTickets,
            performanceByPriority,
            recentEvents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== MANUAL SLA CHECK (Admin only - for testing) =====
router.post('/sla/manual-check', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const results = await slaMonitoringService.runManualCheck();
        res.json({
            message: 'Manual SLA check completed',
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== GET TICKETS BREACHING SLA =====
router.get('/tickets/sla-breached', authenticate, async (req, res) => {
    try {
        const { type } = req.query; // 'response' or 'resolution' or 'all'

        let filter = {
            status: { $in: ['Open', 'In Progress'] }
        };

        if (type === 'response') {
            filter['sla.responseBreached'] = true;
        } else if (type === 'resolution') {
            filter['sla.resolutionBreached'] = true;
        } else {
            filter.$or = [
                { 'sla.responseBreached': true },
                { 'sla.resolutionBreached': true }
            ];
        }

        const tickets = await Ticket.find(filter)
            .populate('user assignedTo', 'name email')
            .sort({ 'sla.responseDeadline': 1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== GET TICKETS AT RISK =====
router.get('/tickets/sla-at-risk', authenticate, async (req, res) => {
    try {
        const tickets = await Ticket.find({
            'sla.status': 'At Risk',
            status: { $in: ['Open', 'In Progress'] }
        })
            .populate('user assignedTo', 'name email')
            .sort({ 'sla.responseDeadline': 1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== INITIALIZE DEFAULT SLA POLICIES =====
router.post('/sla/initialize-defaults', authenticate, authorize(['admin']), async (req, res) => {
    try {
        await SLA.initializeDefaults();
        const policies = await SLA.find();
        res.json({
            message: 'Default SLA policies initialized',
            policies
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
