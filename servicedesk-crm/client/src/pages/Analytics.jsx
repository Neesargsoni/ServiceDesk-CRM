import { useEffect, useState } from "react";
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import Sidebar from "../components/Sidebar";

function Analytics() {
    const [user, setUser] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchAllTickets();
    }, []);

    const fetchAllTickets = async () => {
        try {
            const token = localStorage.getItem("token");
            // ✅ FIXED: Added /api prefix
            const res = await fetch(`${API_URL}/api/tickets/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
            setLoading(false);
        } catch (err) {
            console.error("Error fetching tickets:", err);
            setLoading(false);
        }
    };

    // Calculate analytics data
    const getStatusData = () => {
        const statusCount = {
            Open: 0,
            "In Progress": 0,
            Resolved: 0,
            Closed: 0
        };

        tickets.forEach(ticket => {
            statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1;
        });

        return Object.entries(statusCount).map(([name, value]) => ({
            name,
            value
        }));
    };

    const getPriorityData = () => {
        const priorityCount = {
            Low: 0,
            Medium: 0,
            High: 0,
            Urgent: 0
        };

        tickets.forEach(ticket => {
            priorityCount[ticket.priority] = (priorityCount[ticket.priority] || 0) + 1;
        });

        return Object.entries(priorityCount).map(([name, value]) => ({
            name,
            value,
            percentage: ((value / tickets.length) * 100).toFixed(1)
        }));
    };

    const getMonthlyTrend = () => {
        const monthlyData = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        tickets.forEach(ticket => {
            const date = new Date(ticket.createdAt);
            const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
        });

        return Object.entries(monthlyData)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .slice(-6) // Last 6 months
            .map(([month, count]) => ({
                month,
                tickets: count
            }));
    };

    const getTopUsers = () => {
        const userTickets = {};

        tickets.forEach(ticket => {
            const userName = ticket.user?.name || "Unknown";
            userTickets[userName] = (userTickets[userName] || 0) + 1;
        });

        return Object.entries(userTickets)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({
                name,
                tickets: count
            }));
    };

    const COLORS = {
        Open: "#3B82F6",
        "In Progress": "#8B5CF6",
        Resolved: "#10B981",
        Closed: "#6B7280",
        Low: "#10B981",
        Medium: "#F59E0B",
        High: "#EF4444",
        Urgent: "#DC2626"
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <Sidebar user={user} />
                <div className="flex-1 p-8 flex items-center justify-center">
                    <p className="text-xl">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const statusData = getStatusData();
    const priorityData = getPriorityData();
    const monthlyTrend = getMonthlyTrend();
    const topUsers = getTopUsers();

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar user={user} />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-2">Comprehensive ticket insights and trends</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-sm font-semibold text-gray-600">Total Tickets</h3>
                        <p className="text-3xl font-bold mt-2">{tickets.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-sm font-semibold text-gray-600">Average per User</h3>
                        <p className="text-3xl font-bold mt-2 text-blue-600">
                            {(tickets.length / Math.max(topUsers.length, 1)).toFixed(1)}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-sm font-semibold text-gray-600">Resolution Rate</h3>
                        <p className="text-3xl font-bold mt-2 text-green-600">
                            {((statusData.find(s => s.name === "Resolved")?.value || 0) / tickets.length * 100).toFixed(1)}%
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-sm font-semibold text-gray-600">Active Tickets</h3>
                        <p className="text-3xl font-bold mt-2 text-purple-600">
                            {(statusData.find(s => s.name === "In Progress")?.value || 0)}
                        </p>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Status Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Ticket Status Distribution</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Priority Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Priority Levels</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={priorityData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]}>
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Trend */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Ticket Trend (Last 6 Months)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="tickets" 
                                    stroke="#3B82F6" 
                                    strokeWidth={3}
                                    dot={{ r: 6 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Users */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Top 5 Users by Tickets</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topUsers} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="tickets" fill="#10B981" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority Breakdown Table */}
                <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
                    <h2 className="text-xl font-bold mb-4">Detailed Priority Breakdown</h2>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">Priority</th>
                                <th className="text-left py-3 px-4">Count</th>
                                <th className="text-left py-3 px-4">Percentage</th>
                                <th className="text-left py-3 px-4">Visual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {priorityData.map((item, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold`}
                                              style={{ backgroundColor: COLORS[item.name] + '20', color: COLORS[item.name] }}>
                                            {item.name}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 font-semibold">{item.value}</td>
                                    <td className="py-3 px-4">{item.percentage}%</td>
                                    <td className="py-3 px-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="h-2 rounded-full"
                                                style={{ 
                                                    width: `${item.percentage}%`, 
                                                    backgroundColor: COLORS[item.name] 
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

export default Analytics;