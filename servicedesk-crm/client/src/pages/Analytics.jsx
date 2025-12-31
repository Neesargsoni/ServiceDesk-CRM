import { useEffect, useState } from "react";
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import Sidebar from "../components/Sidebar";

function Analytics() {
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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

    const getStatusData = () => {
        const statusCount = { Open: 0, "In Progress": 0, Resolved: 0, Closed: 0 };
        tickets.forEach(ticket => {
            statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1;
        });
        return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
    };

    const getPriorityData = () => {
        const priorityCount = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
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
            .slice(-6)
            .map(([month, tickets]) => ({ month, tickets }));
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
            .map(([name, tickets]) => ({ name, tickets }));
    };

    const COLORS = {
        Open: "#3B82F6", "In Progress": "#8B5CF6", Resolved: "#10B981", Closed: "#6B7280",
        Low: "#10B981", Medium: "#F59E0B", High: "#EF4444", Urgent: "#DC2626"
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <Sidebar user={user} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
                <div className="flex-1 p-4 sm:p-8 flex items-center justify-center">
                    <p className="text-lg sm:text-xl">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const statusData = getStatusData();
    const priorityData = getPriorityData();
    const monthlyTrend = getMonthlyTrend();
    const topUsers = getTopUsers();

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
            <Sidebar user={user} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />

            <main className="flex-1 w-full min-w-0 overflow-x-hidden">
                {/* Header with Hamburger */}
                <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="lg:hidden bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
                            aria-label="Open menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-xl lg:text-2xl font-bold dark:text-white">Analytics Dashboard</h1>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">Total Tickets</h3>
                            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 dark:text-white">{tickets.length}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">Avg per User</h3>
                            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-blue-600">
                                {(tickets.length / Math.max(topUsers.length, 1)).toFixed(1)}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">Resolution Rate</h3>
                            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-green-600">
                                {((statusData.find(s => s.name === "Resolved")?.value || 0) / tickets.length * 100).toFixed(1)}%
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">Active</h3>
                            <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-purple-600">
                                {(statusData.find(s => s.name === "In Progress")?.value || 0)}
                            </p>
                        </div>
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
                            <h2 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">Ticket Status Distribution</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
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

                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
                            <h2 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">Priority Levels</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={priorityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                                    <YAxis tick={{fontSize: 12}} />
                                    <Tooltip />
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
                            <h2 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">Ticket Trend (Last 6 Months)</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tick={{fontSize: 11}} angle={-45} textAnchor="end" height={60} />
                                    <YAxis tick={{fontSize: 12}} />
                                    <Tooltip />
                                    <Line 
                                        type="monotone" 
                                        dataKey="tickets" 
                                        stroke="#3B82F6" 
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
                            <h2 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">Top 5 Users by Tickets</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={topUsers} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tick={{fontSize: 12}} />
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11}} />
                                    <Tooltip />
                                    <Bar dataKey="tickets" fill="#10B981" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Priority Breakdown Table */}
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
                        <h2 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">Detailed Priority Breakdown</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="text-left py-3 px-4 text-sm">Priority</th>
                                        <th className="text-left py-3 px-4 text-sm">Count</th>
                                        <th className="text-left py-3 px-4 text-sm">%</th>
                                        <th className="text-left py-3 px-4 text-sm">Visual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {priorityData.map((item, index) => (
                                        <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="py-3 px-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                                                      style={{ backgroundColor: COLORS[item.name] + '20', color: COLORS[item.name] }}>
                                                    {item.name}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-semibold dark:text-white">{item.value}</td>
                                            <td className="py-3 px-4 dark:text-gray-300">{item.percentage}%</td>
                                            <td className="py-3 px-4">
                                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                    <div 
                                                        className="h-2 rounded-full transition-all duration-300"
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
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Analytics;