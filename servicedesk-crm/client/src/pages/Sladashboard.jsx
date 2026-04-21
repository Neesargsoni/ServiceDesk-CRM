import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';

function SLADashboard() {
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [refreshInterval, setRefreshInterval] = useState(null);

    useEffect(() => {
        fetchDashboardData();

        // Auto-refresh every 2 minutes
        const interval = setInterval(() => {
            fetchDashboardData();
        }, 120000);

        setRefreshInterval(interval);

        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/api/sla/dashboard');
            setDashboardData(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching SLA dashboard:', error);
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'On Track': return 'bg-green-100 text-green-700 border-green-500';
            case 'At Risk': return 'bg-orange-100 text-orange-700 border-orange-500';
            case 'Breached': return 'bg-red-100 text-red-700 border-red-500';
            case 'Met': return 'bg-blue-100 text-blue-700 border-blue-500';
            default: return 'bg-gray-100 text-gray-700 border-gray-500';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Urgent': return 'bg-red-200 text-red-800';
            case 'High': return 'bg-orange-200 text-orange-800';
            case 'Medium': return 'bg-yellow-200 text-yellow-800';
            case 'Low': return 'bg-blue-200 text-blue-800';
            default: return 'bg-gray-200 text-gray-800';
        }
    };

    const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
                <Sidebar user={user} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading SLA Dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
                <Sidebar user={user} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-red-600">Error loading dashboard data</p>
                </div>
            </div>
        );
    }

    const { overview, breachedTickets, atRiskTickets, performanceByPriority } = dashboardData;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar user={user} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="lg:hidden bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
                            aria-label="Open menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl lg:text-2xl font-bold dark:text-white">SLA Dashboard</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Real-time Service Level Agreement monitoring • Auto-refreshes every 2 minutes
                            </p>
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* Overall Compliance */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-2 border-blue-500">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">SLA Compliance</h3>
                                <span className="text-2xl">📊</span>
                            </div>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {overview.complianceRate}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {overview.metSLA} of {overview.totalTickets} tickets
                            </p>
                        </div>

                        {/* Breached Tickets */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-2 border-red-500">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">SLA Breaches</h3>
                                <span className="text-2xl">🚨</span>
                            </div>
                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                {breachedTickets.length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Requires immediate attention
                            </p>
                        </div>

                        {/* At Risk Tickets */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-2 border-orange-500">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">At Risk</h3>
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                {atRiskTickets.length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {'<'} 25% time remaining
                            </p>
                        </div>

                        {/* Response Breaches */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-2 border-purple-500">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Response Breaches</h3>
                                <span className="text-2xl">⏱️</span>
                            </div>
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                {overview.responseBreaches}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                No initial response in time
                            </p>
                        </div>
                    </div>

                    {/* Performance by Priority */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-lg font-bold mb-4 dark:text-white">SLA Performance by Priority</h2>
                        <div className="space-y-4">
                            {performanceByPriority.map((perf) => (
                                <div key={perf._id} className="border dark:border-gray-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(perf._id)}`}>
                                                {perf._id}
                                            </span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {perf.total} total tickets
                                            </span>
                                        </div>
                                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                            {perf.complianceRate ? perf.complianceRate.toFixed(1) : 0}%
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-center">
                                            <span className="text-green-700 dark:text-green-400 font-bold block">{perf.met}</span>
                                            <span className="text-green-600 dark:text-green-500">Met</span>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-center">
                                            <span className="text-orange-700 dark:text-orange-400 font-bold block">{perf.atRisk}</span>
                                            <span className="text-orange-600 dark:text-orange-500">At Risk</span>
                                        </div>
                                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-center">
                                            <span className="text-red-700 dark:text-red-400 font-bold block">{perf.breached}</span>
                                            <span className="text-red-600 dark:text-red-500">Breached</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Breached Tickets */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold dark:text-white">🚨 Breached SLA ({breachedTickets.length})</h2>
                                <Link to="/tickets?filter=breached" className="text-sm text-blue-600 hover:underline">
                                    View All
                                </Link>
                            </div>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {breachedTickets.length === 0 ? (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                        ✅ No SLA breaches - Great job!
                                    </p>
                                ) : (
                                    breachedTickets.map((ticket) => (
                                        <Link
                                            key={ticket._id}
                                            to={`/ticket/${ticket._id}`}
                                            className="block border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-semibold text-sm dark:text-white flex-1 mr-2">
                                                    #{ticket._id.slice(-6)} - {ticket.title}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </div>
                                            <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                                                🚨 {ticket.sla.breachReason}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                                <span>By: {ticket.user.name}</span>
                                                {ticket.assignedTo && <span>Agent: {ticket.assignedTo.name}</span>}
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* At Risk Tickets */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold dark:text-white">⚠️ At Risk ({atRiskTickets.length})</h2>
                                <Link to="/tickets?filter=at-risk" className="text-sm text-blue-600 hover:underline">
                                    View All
                                </Link>
                            </div>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {atRiskTickets.length === 0 ? (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                        ✅ No tickets at risk
                                    </p>
                                ) : (
                                    atRiskTickets.map((ticket) => (
                                        <Link
                                            key={ticket._id}
                                            to={`/ticket/${ticket._id}`}
                                            className="block border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-semibold text-sm dark:text-white flex-1 mr-2">
                                                    #{ticket._id.slice(-6)} - {ticket.title}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                <span>By: {ticket.user.name}</span>
                                                {ticket.assignedTo && <span>Agent: {ticket.assignedTo.name}</span>}
                                            </div>
                                            {ticket.sla && (
                                                <div className="text-xs text-orange-600 dark:text-orange-400">
                                                    ⏱️ {!ticket.sla.firstResponseAt ? 'Response' : 'Resolution'} due: {new Date(
                                                        !ticket.sla.firstResponseAt
                                                            ? ticket.sla.responseDeadline
                                                            : ticket.sla.resolutionDeadline
                                                    ).toLocaleString()}
                                                </div>
                                            )}
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SLADashboard;