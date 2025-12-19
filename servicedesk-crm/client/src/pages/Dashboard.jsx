import { useEffect, useState } from "react";
import { useStats } from "../context/StatsContext";
import { useSocket } from "../context/SocketContext";
import Sidebar from "../components/Sidebar";

function Dashboard() {
    const [user, setUser] = useState(null);
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

    // 🔴 Real-time socket listeners
    useEffect(() => {
        if (!socket) return;

        // Listen for new tickets
        socket.on("ticket_created", (data) => {
            console.log("🔴 New ticket created:", data);
            fetchStats(); // Refresh stats
            addNotification({
                type: "info",
                title: "New Ticket Created",
                message: `${data.createdBy} created: ${data.ticket.title}`,
            });
        });

        // Listen for ticket updates
        socket.on("ticket_updated", (data) => {
            console.log("🔴 Ticket updated:", data);
            fetchStats(); // Refresh stats
            addNotification({
                type: "warning",
                title: "Ticket Updated",
                message: `${data.updatedBy} updated ticket`,
            });
        });

        // Listen for new comments
        socket.on("ticket_commented", (data) => {
            console.log("🔴 New comment:", data);
            addNotification({
                type: "info",
                title: "New Comment",
                message: `${data.commentedBy} commented on a ticket`,
            });
        });

        // Listen for ticket assignments
        socket.on("ticket_assigned", (data) => {
            console.log("🔴 Ticket assigned:", data);
            fetchStats();
            addNotification({
                type: "success",
                title: "Ticket Assigned",
                message: `Ticket assigned to ${data.assignedTo}`,
            });
        });

        // Cleanup listeners
        return () => {
            socket.off("ticket_created");
            socket.off("ticket_updated");
            socket.off("ticket_commented");
            socket.off("ticket_assigned");
        };
    }, [socket]);

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
            <Sidebar user={user} />

            <main className="flex-1 p-10">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">Dashboard</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                            <span className="text-xs text-gray-600">
                                {connected ? 'Live Updates Active' : 'Connecting...'}
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-600">
                        Welcome, <span className="font-semibold text-blue-600">{user?.name || "User"}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-white-800 shadow-md p-6 rounded-xl hover:shadow-lg transition">
                        <h3 className="text-lg font-semibold text-gray-600">Total Tickets</h3>
                        <p className="text-4xl font-bold mt-2">{stats.total || 0}</p>
                    </div>
                    <div className="bg-white shadow-md p-6 rounded-xl hover:shadow-lg transition">
                        <h3 className="text-lg font-semibold text-gray-600">Open Tickets</h3>
                        <p className="text-4xl font-bold mt-2 text-blue-600">{stats.open || 0}</p>
                    </div>
                    <div className="bg-white shadow-md p-6 rounded-xl hover:shadow-lg transition">
                        <h3 className="text-lg font-semibold text-gray-600">In Progress</h3>
                        <p className="text-4xl font-bold mt-2 text-purple-600">{stats.inProgress || 0}</p>
                    </div>
                    <div className="bg-white shadow-md p-6 rounded-xl hover:shadow-lg transition">
                        <h3 className="text-lg font-semibold text-gray-600">Resolved</h3>
                        <p className="text-4xl font-bold mt-2 text-green-600">{stats.resolved || 0}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow-lg rounded-xl p-6">
                    <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="/create-ticket"
                            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-center"
                        >
                            <div className="text-3xl mb-2">➕</div>
                            <p className="font-semibold">Create New Ticket</p>
                        </a>
                        <a
                            href="/my-tickets"
                            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-center"
                        >
                            <div className="text-3xl mb-2">🎫</div>
                            <p className="font-semibold">View My Tickets</p>
                        </a>
                        {user && ["admin", "agent"].includes(user.role) && (
                            <a
                                href="/all-tickets"
                                className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition text-center"
                            >
                                <div className="text-3xl mb-2">📋</div>
                                <p className="font-semibold">View All Tickets</p>
                            </a>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;