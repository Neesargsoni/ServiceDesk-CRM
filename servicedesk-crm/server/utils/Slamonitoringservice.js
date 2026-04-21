import cron from 'node-cron';
import Ticket from '../models/Ticket.js';
import SLA from '../models/Sla.js';

class SLAMonitoringService {
    constructor() {
        this.isRunning = false;
    }

    // Start SLA monitoring (runs every 5 minutes)
    start() {
        if (this.isRunning) {
            console.log('⚠️  SLA monitoring already running');
            return;
        }

        // Run every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            console.log('🔍 Running SLA breach check...');
            await this.checkSLABreaches();
        });

        // Also run every minute for critical tickets
        cron.schedule('* * * * *', async () => {
            await this.checkCriticalBreaches();
        });

        this.isRunning = true;
        console.log('✅ SLA monitoring service started');
        console.log('   - Breach check: Every 5 minutes');
        console.log('   - Critical check: Every 1 minute');
    }

    // Check for SLA breaches
    async checkSLABreaches() {
        try {
            const now = new Date();

            // Find tickets that might have breached SLA
            const tickets = await Ticket.find({
                status: { $in: ['Open', 'In Progress'] },
                'sla.responseDeadline': { $exists: true }
            }).populate('user assignedTo', 'name email');

            let breachesDetected = 0;
            let atRiskCount = 0;

            for (const ticket of tickets) {
                let needsUpdate = false;

                // Check response SLA breach
                if (!ticket.sla.firstResponseAt && !ticket.sla.responseBreached) {
                    if (now > new Date(ticket.sla.responseDeadline)) {
                        ticket.sla.responseBreached = true;
                        ticket.sla.breachReason = 'Response SLA breached - No initial response within deadline';
                        ticket.sla.status = 'Breached';
                        needsUpdate = true;
                        breachesDetected++;

                        console.log(`🚨 Response SLA BREACHED: Ticket #${ticket._id.toString().slice(-6)}`);

                        // TODO: Send email notification to admin
                        // await this.sendBreachNotification(ticket, 'response');
                    }
                }

                // Check resolution SLA breach
                if (!ticket.sla.resolvedAt && !ticket.sla.resolutionBreached) {
                    if (now > new Date(ticket.sla.resolutionDeadline)) {
                        ticket.sla.resolutionBreached = true;
                        ticket.sla.breachReason = ticket.sla.breachReason
                            ? ticket.sla.breachReason + '; Resolution SLA breached'
                            : 'Resolution SLA breached - Not resolved within deadline';
                        ticket.sla.status = 'Breached';
                        needsUpdate = true;
                        breachesDetected++;

                        console.log(`🚨 Resolution SLA BREACHED: Ticket #${ticket._id.toString().slice(-6)}`);

                        // TODO: Send email notification to admin
                        // await this.sendBreachNotification(ticket, 'resolution');
                    }
                }

                // Update SLA status for at-risk tickets
                const calculatedStatus = ticket.calculateSLAStatus();
                if (calculatedStatus !== ticket.sla.status) {
                    ticket.sla.status = calculatedStatus;
                    needsUpdate = true;

                    if (calculatedStatus === 'At Risk') {
                        atRiskCount++;
                        console.log(`⚠️  Ticket #${ticket._id.toString().slice(-6)} is at risk`);
                    }
                }

                if (needsUpdate) {
                    await ticket.save();
                }
            }

            console.log(`✅ SLA check complete: ${breachesDetected} breaches, ${atRiskCount} at risk`);

            return {
                breachesDetected,
                atRiskCount,
                totalChecked: tickets.length
            };
        } catch (error) {
            console.error('❌ Error checking SLA breaches:', error);
            throw error;
        }
    }

    // Check critical (Urgent/High priority) tickets every minute
    async checkCriticalBreaches() {
        try {
            const now = new Date();

            const criticalTickets = await Ticket.find({
                priority: { $in: ['Urgent', 'High'] },
                status: { $in: ['Open', 'In Progress'] },
                'sla.responseBreached': false,
                'sla.resolutionBreached': false,
                'sla.responseDeadline': { $exists: true }
            });

            let urgentBreaches = 0;

            for (const ticket of criticalTickets) {
                let needsUpdate = false;

                // Response breach
                if (!ticket.sla.firstResponseAt && now > new Date(ticket.sla.responseDeadline)) {
                    ticket.sla.responseBreached = true;
                    ticket.sla.breachReason = 'CRITICAL: Response SLA breached';
                    ticket.sla.status = 'Breached';
                    needsUpdate = true;
                    urgentBreaches++;

                    console.log(`🔴 CRITICAL BREACH: Ticket #${ticket._id.toString().slice(-6)} (${ticket.priority})`);
                }

                // Resolution breach
                if (!ticket.sla.resolvedAt && now > new Date(ticket.sla.resolutionDeadline)) {
                    ticket.sla.resolutionBreached = true;
                    ticket.sla.breachReason = ticket.sla.breachReason
                        ? ticket.sla.breachReason + '; CRITICAL: Resolution SLA breached'
                        : 'CRITICAL: Resolution SLA breached';
                    ticket.sla.status = 'Breached';
                    needsUpdate = true;
                    urgentBreaches++;

                    console.log(`🔴 CRITICAL BREACH: Ticket #${ticket._id.toString().slice(-6)} (${ticket.priority})`);
                }

                if (needsUpdate) {
                    await ticket.save();
                    // TODO: Send urgent notification
                    // await this.sendUrgentBreachNotification(ticket);
                }
            }

            if (urgentBreaches > 0) {
                console.log(`🔴 ${urgentBreaches} CRITICAL breaches detected`);
            }
        } catch (error) {
            console.error('❌ Error checking critical breaches:', error);
        }
    }

    // Get SLA statistics
    async getSLAStatistics() {
        try {
            const stats = await Ticket.aggregate([
                {
                    $match: {
                        'sla.responseDeadline': { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$sla.status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const responseBreaches = await Ticket.countDocuments({
                'sla.responseBreached': true
            });

            const resolutionBreaches = await Ticket.countDocuments({
                'sla.resolutionBreached': true
            });

            // Calculate compliance rate
            const totalTickets = await Ticket.countDocuments({
                'sla.responseDeadline': { $exists: true }
            });

            const metSLA = await Ticket.countDocuments({
                'sla.status': 'Met'
            });

            const complianceRate = totalTickets > 0
                ? ((metSLA / totalTickets) * 100).toFixed(2)
                : 0;

            return {
                statusBreakdown: stats,
                responseBreaches,
                resolutionBreaches,
                totalTickets,
                metSLA,
                complianceRate
            };
        } catch (error) {
            console.error('Error getting SLA statistics:', error);
            throw error;
        }
    }

    // Manual breach check (for testing or on-demand)
    async runManualCheck() {
        console.log('🔄 Running manual SLA breach check...');
        const results = await this.checkSLABreaches();
        await this.checkCriticalBreaches();
        return results;
    }
}

// Create singleton instance
const slaMonitoringService = new SLAMonitoringService();

export default slaMonitoringService