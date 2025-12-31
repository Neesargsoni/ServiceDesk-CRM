import { useEffect, useState } from "react";
import { useStats } from "../context/StatsContext";
import { useSocket } from "../context/SocketContext";
import Sidebar from "../components/Sidebar";

function Dashboard() {
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { stats, updateStats } = useStats();
    const { socket, connected, addNotification } = useSocket();
    const API_URL = import.meta.env.VITE_API_URL;

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/tickets/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            updateStats(data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchStats();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on("ticket_created", (data) => {
            fetchStats();
            addNotification({
                type: "info",
                title: "New Ticket Created",
                message: `${data.createdBy} created: ${data.ticket.title}`,
            });
        });

        socket.on("ticket_updated", (data) => {
            fetchStats();
            addNotification({
                type: "warning",
                title: "Ticket Updated",
                message: `${data.updatedBy} updated ticket`,
            });
        });

        socket.on("ticket_commented", (data) => {
            addNotification({
                type: "info",
                title: "New Comment",
                message: `${data.commentedBy} commented on a ticket`,
            });
        });

        socket.on("ticket_assigned", (data) => {
            fetchStats();
            addNotification({
                type: "success",
                title: "Ticket Assigned",
                message: `Ticket assigned to ${data.assignedTo}`,
            });
        });

        return () => {
            socket.off("ticket_created");
            socket.off("ticket_updated");
            socket.off("ticket_commented");
            socket.off("ticket_assigned");
        };
    }, [socket]);

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
            {/* Pass isMenuOpen state to Sidebar */}
            <Sidebar user={user} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />

            <main className="flex-1 w-full min-w-0 overflow-x-hidden">
                {/* Compact Header with inline hamburger button */}
                <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div className="flex items-center gap-3">
                        {/* Small Hamburger Button - Mobile Only */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="lg:hidden bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
                            aria-label="Open menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        
                        {/* Title */}
                        <h1 className="text-xl lg:text-2xl font-bold dark:text-white flex-1">
                            Dashboard
                        </h1>
                        
                        {/* Welcome text - desktop only */}
                        <p className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                            Welcome, <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {user?.name || "User"}
                            </span>
                        </p>
                    </div>
                    
                    {/* Connection status */}
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            {connected ? 'Live Updates Active' : 'Connecting...'}
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-4 sm:p-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 shadow-md p-4 rounded-xl hover:shadow-lg transition">
                            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Total
                            </h3>
                            <p className="text-2xl font-bold dark:text-white">
                                {stats.total || 0}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 shadow-md p-4 rounded-xl hover:shadow-lg transition">
                            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Open
                            </h3>
                            <p className="text-2xl font-bold text-blue-600">
                                {stats.open || 0}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 shadow-md p-4 rounded-xl hover:shadow-lg transition">
                            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                In Progress
                            </h3>
                            <p className="text-2xl font-bold text-purple-600">
                                {stats.inProgress || 0}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 shadow-md p-4 rounded-xl hover:shadow-lg transition">
                            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Resolved
                            </h3>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.resolved || 0}
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6">
                        <h2 className="text-lg font-bold mb-4 dark:text-white">
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <a
                                href="/create-ticket"
                                className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg 
                                         hover:bg-blue-100 dark:hover:bg-blue-900/30 
                                         transition text-center group"
                            >
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                                    ➕
                                </div>
                                <p className="font-semibold text-sm dark:text-white">
                                    Create New Ticket
                                </p>
                            </a>
                            <a
                                href="/my-tickets"
                                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg 
                                         hover:bg-green-100 dark:hover:bg-green-900/30 
                                         transition text-center group"
                            >
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                                    🎫
                                </div>
                                <p className="font-semibold text-sm dark:text-white">
                                    View My Tickets
                                </p>
                            </a>
                            {user && ["admin", "agent"].includes(user.role) && (
                                <a
                                    href="/all-tickets"
                                    className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg 
                                             hover:bg-purple-100 dark:hover:bg-purple-900/30 
                                             transition text-center group
                                             sm:col-span-2 lg:col-span-1"
                                >
                                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                                        📋
                                    </div>
                                    <p className="font-semibold text-sm dark:text-white">
                                        View All Tickets
                                    </p>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;