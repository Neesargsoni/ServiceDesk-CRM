import { useState, useEffect } from 'react';

function SLAIndicator({ ticket }) {
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [slaStatus, setSlaStatus] = useState(null);

    useEffect(() => {
        calculateSLAStatus();

        // Update every minute
        const interval = setInterval(() => {
            calculateSLAStatus();
        }, 60000);

        return () => clearInterval(interval);
    }, [ticket]);

    const calculateSLAStatus = () => {
        if (!ticket.sla || !ticket.sla.responseDeadline) {
            setSlaStatus(null);
            return;
        }

        const now = new Date();
        const responseDeadline = new Date(ticket.sla.responseDeadline);
        const resolutionDeadline = new Date(ticket.sla.resolutionDeadline);

        // Check if breached
        if (ticket.sla.responseBreached || ticket.sla.resolutionBreached) {
            setSlaStatus({
                status: 'breached',
                color: 'red',
                bgColor: 'bg-red-100',
                textColor: 'text-red-700',
                borderColor: 'border-red-500',
                icon: '🚨',
                label: 'SLA Breached',
                message: ticket.sla.breachReason || 'SLA deadline has been exceeded'
            });
            setTimeRemaining(null);
            return;
        }

        // Check if ticket is resolved
        if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
            if (ticket.sla.resolvedAt && new Date(ticket.sla.resolvedAt) <= resolutionDeadline) {
                setSlaStatus({
                    status: 'met',
                    color: 'green',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-700',
                    borderColor: 'border-green-500',
                    icon: '✅',
                    label: 'SLA Met',
                    message: 'Ticket resolved within SLA deadline'
                });
                setTimeRemaining(null);
                return;
            }
        }

        // Calculate time remaining for active tickets
        let deadline, type, label;

        if (!ticket.sla.firstResponseAt) {
            // Waiting for first response
            deadline = responseDeadline;
            type = 'response';
            label = 'Response Due';
        } else {
            // Waiting for resolution
            deadline = resolutionDeadline;
            type = 'resolution';
            label = 'Resolution Due';
        }

        const minutesRemaining = Math.floor((deadline - now) / 60000);
        const formattedTime = formatTimeRemaining(minutesRemaining);

        // Determine status based on time remaining
        const totalTime = deadline - new Date(ticket.createdAt);
        const elapsedTime = now - new Date(ticket.createdAt);
        const progress = elapsedTime / totalTime;

        let status, color, bgColor, textColor, borderColor, icon;

        if (minutesRemaining < 0) {
            // Overdue (shouldn't happen if monitoring is working, but just in case)
            status = 'breached';
            color = 'red';
            bgColor = 'bg-red-100';
            textColor = 'text-red-700';
            borderColor = 'border-red-500';
            icon = '🚨';
        } else if (progress > 0.75) {
            // At risk (less than 25% time remaining)
            status = 'at-risk';
            color = 'orange';
            bgColor = 'bg-orange-100';
            textColor = 'text-orange-700';
            borderColor = 'border-orange-500';
            icon = '⚠️';
        } else {
            // On track
            status = 'on-track';
            color = 'green';
            bgColor = 'bg-green-100';
            textColor = 'text-green-700';
            borderColor = 'border-green-500';
            icon = '✅';
        }

        setSlaStatus({
            status,
            color,
            bgColor,
            textColor,
            borderColor,
            icon,
            label,
            message: formattedTime
        });

        setTimeRemaining({
            type,
            minutes: minutesRemaining,
            formatted: formattedTime,
            deadline
        });
    };

    const formatTimeRemaining = (minutes) => {
        if (minutes < 0) {
            const absMinutes = Math.abs(minutes);
            if (absMinutes < 60) {
                return `${absMinutes} min overdue`;
            }
            const hours = Math.floor(absMinutes / 60);
            if (hours < 24) {
                return `${hours} hour${hours > 1 ? 's' : ''} overdue`;
            }
            const days = Math.floor(hours / 24);
            return `${days} day${days > 1 ? 's' : ''} overdue`;
        }

        if (minutes < 60) {
            return `${minutes} min remaining`;
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
        }

        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        if (remainingHours > 0) {
            return `${days}d ${remainingHours}h remaining`;
        }
        return `${days} day${days > 1 ? 's' : ''} remaining`;
    };

    const getProgressPercentage = () => {
        if (!timeRemaining || !ticket.sla) return 0;

        const now = new Date();
        const created = new Date(ticket.createdAt);
        const deadline = new Date(timeRemaining.deadline);

        const totalTime = deadline - created;
        const elapsedTime = now - created;

        return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
    };

    if (!slaStatus) return null;

    const progress = getProgressPercentage();

    return (
        <div className={`sla-indicator ${slaStatus.bgColor} ${slaStatus.textColor} border-2 ${slaStatus.borderColor} rounded-lg p-4 shadow-md dark:bg-opacity-20`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{slaStatus.icon}</span>
                    <div>
                        <h4 className="font-bold text-sm">{slaStatus.label}</h4>
                        <p className="text-xs opacity-90">{slaStatus.message}</p>
                    </div>
                </div>

                {/* Priority badge */}
                <span className={`
          px-2 py-1 rounded-full text-xs font-semibold
          ${ticket.priority === 'Urgent' ? 'bg-red-200 text-red-800' : ''}
          ${ticket.priority === 'High' ? 'bg-orange-200 text-orange-800' : ''}
          ${ticket.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' : ''}
          ${ticket.priority === 'Low' ? 'bg-blue-200 text-blue-800' : ''}
        `}>
                    {ticket.priority}
                </span>
            </div>

            {/* Progress bar */}
            {timeRemaining && slaStatus.status !== 'breached' && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${slaStatus.status === 'at-risk' ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* SLA Details */}
            {ticket.sla && (
                <div className="mt-3 pt-3 border-t border-opacity-30 text-xs space-y-1">
                    <div className="flex justify-between">
                        <span className="opacity-75">Response Deadline:</span>
                        <span className="font-semibold">
                            {new Date(ticket.sla.responseDeadline).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="opacity-75">Resolution Deadline:</span>
                        <span className="font-semibold">
                            {new Date(ticket.sla.resolutionDeadline).toLocaleString()}
                        </span>
                    </div>
                    {ticket.sla.firstResponseAt && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span className="opacity-75">✓ First Response:</span>
                            <span className="font-semibold">
                                {new Date(ticket.sla.firstResponseAt).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SLAIndicator;