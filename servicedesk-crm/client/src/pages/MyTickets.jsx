// client/src/pages/MyTickets.jsx - AI ENHANCED VERSION
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

function MyTickets() {
    const [tickets, setTickets] = useState([]);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    useEffect(() => {
        loadTickets();
    }, []);

    async function loadTickets() {
        try {
            const res = await api.get("/api/tickets/my");
            setTickets(res.data);
        } catch (err) {
            console.error("Error loading tickets:", err);
        }
    }

    // Filter logic
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = 
            ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
        const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const getPriorityColor = (priority) => {
        switch(priority) {
            case "Urgent": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
            case "High": return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
            case "Medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
            default: return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case "Open": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
            case "In Progress": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
            case "Resolved": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
            case "Closed": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
            default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    // 🤖 AI-RELATED HELPER FUNCTIONS
    const getSentimentEmoji = (sentiment) => {
        switch(sentiment) {
            case "Positive": return "😊";
            case "Negative": return "😠";
            case "Urgent": return "🔥";
            default: return "😐";
        }
    };

    const getCategoryColor = (category) => {
        switch(category) {
            case "Technical Issue": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case "Billing Question": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case "Feature Request": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
            case "Bug Report": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            case "Account Issue": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
            <Sidebar user={user} />

            <main className="flex-1 p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">My Tickets</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            🤖 AI-powered ticket management
                        </p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Hello, <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {user?.name || "User"}
                        </span>
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="🔍 Search tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option value="all">All Status</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option value="all">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                {/* Tickets List */}
                <div className="space-y-4">
                    {filteredTickets.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
                            <p className="text-gray-500 dark:text-gray-400">
                                {tickets.length === 0 
                                    ? "You have no tickets yet. Create one to get started!" 
                                    : "No tickets match your filters."}
                            </p>
                        </div>
                    ) : (
                        filteredTickets.map((ticket) => (
                            <Link
                                key={ticket._id}
                                to={`/ticket/${ticket._id}`}
                                className="block bg-white dark:bg-gray-800 p-6 rounded-lg shadow 
                                         hover:shadow-lg transition"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-2">
                                            {ticket.title}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                                            {ticket.description}
                                        </p>
                                        
                                        {/* 🤖 AI INSIGHTS ROW */}
                                        <div className="flex gap-2 flex-wrap mb-2">
                                            {ticket.aiCategory && (
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(ticket.aiCategory)}`}>
                                                    🤖 {ticket.aiCategory}
                                                </span>
                                            )}
                                            {ticket.aiSentiment && (
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                                                    {getSentimentEmoji(ticket.aiSentiment)} {ticket.aiSentiment}
                                                </span>
                                            )}
                                            {ticket.aiConfidence && (
                                                <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded text-xs font-medium">
                                                    ✨ {ticket.aiConfidence}% confidence
                                                </span>
                                            )}
                                        </div>

                                        {ticket.assignedTo && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                ✅ Assigned to: <strong>{ticket.assignedTo.name}</strong>
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 items-end ml-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    <span>💬 {ticket.comments?.length || 0} comments</span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}

export default MyTickets;