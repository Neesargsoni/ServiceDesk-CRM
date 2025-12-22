import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";  // ✅ ADD THIS

function AllTickets() {
    const [tickets, setTickets] = useState([]);
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            // ✅ FIXED: Using api helper with /api prefix
            const res = await api.get("/api/tickets/all");
            setTickets(res.data);
        } catch (err) {
            console.error("Error fetching tickets:", err);
            if (err.response?.status === 403) {
                alert("Access denied. Admin or Agent role required.");
            }
        }
    };

    // Filter tickets
    const filteredTickets = tickets.filter(ticket => {
        // Search filter
        const matchesSearch = 
            ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        if (filter === "all") return matchesSearch;
        if (filter === "open") return matchesSearch && ticket.status === "Open";
        if (filter === "inprogress") return matchesSearch && ticket.status === "In Progress";
        if (filter === "resolved") return matchesSearch && ticket.status === "Resolved";
        if (filter === "closed") return matchesSearch && ticket.status === "Closed";
        if (filter === "unassigned") return matchesSearch && !ticket.assignedTo;
        
        return matchesSearch;
    });

    const getPriorityColor = (priority) => {
        switch(priority) {
            case "Urgent": return "bg-red-100 text-red-700";
            case "High": return "bg-orange-100 text-orange-700";
            case "Medium": return "bg-yellow-100 text-yellow-700";
            default: return "bg-green-100 text-green-700";
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case "Open": return "bg-blue-100 text-blue-700";
            case "In Progress": return "bg-purple-100 text-purple-700";
            case "Resolved": return "bg-green-100 text-green-700";
            case "Closed": return "bg-gray-100 text-gray-700";
            default: return "bg-gray-100 text-gray-700";
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
            case "Technical Issue": return "bg-blue-100 text-blue-800";
            case "Billing Question": return "bg-green-100 text-green-800";
            case "Feature Request": return "bg-purple-100 text-purple-800";
            case "Bug Report": return "bg-red-100 text-red-800";
            case "Account Issue": return "bg-orange-100 text-orange-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar user={user} />

            <main className="flex-1 p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">All Tickets</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            🤖 AI-powered ticket management
                        </p>
                    </div>
                    <p className="text-gray-600">
                        Total: <span className="font-bold text-blue-600">{filteredTickets.length}</span>
                    </p>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="🔍 Search tickets by title, description, or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 border rounded-lg"
                        />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="p-3 border rounded-lg"
                        >
                            <option value="all">All Tickets</option>
                            <option value="open">Open</option>
                            <option value="inprogress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                            <option value="unassigned">Unassigned</option>
                        </select>
                    </div>
                </div>

                {/* Tickets Grid */}
                <div className="space-y-4">
                    {filteredTickets.length === 0 ? (
                        <div className="bg-white p-8 rounded-lg shadow text-center">
                            <p className="text-gray-500">No tickets found</p>
                        </div>
                    ) : (
                        filteredTickets.map((ticket) => (
                            <Link
                                key={ticket._id}
                                to={`/ticket/${ticket._id}`}
                                className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                                            {ticket.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
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
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                                    {getSentimentEmoji(ticket.aiSentiment)} {ticket.aiSentiment}
                                                </span>
                                            )}
                                            {ticket.aiConfidence && (
                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                                                    ✨ {ticket.aiConfidence}% confidence
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-2 items-center text-sm text-gray-500">
                                            <span>👤 {ticket.user?.name || "Unknown"}</span>
                                            {ticket.assignedTo && (
                                                <span className="ml-3">
                                                    ✅ Assigned to: <strong>{ticket.assignedTo.name}</strong>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400 mt-3 border-t pt-3">
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

export default AllTickets;