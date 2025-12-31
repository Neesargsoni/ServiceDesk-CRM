import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

function AllTickets() {
    const [tickets, setTickets] = useState([]);
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await api.get("/api/tickets/all");
            setTickets(res.data);
        } catch (err) {
            console.error("Error fetching tickets:", err);
            if (err.response?.status === 403) {
                alert("Access denied. Admin or Agent role required.");
            }
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = 
            ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

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
                        <h1 className="text-xl lg:text-2xl font-bold dark:text-white">All Tickets</h1>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    {/* Search and Filter */}
                    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="🔍 Search tickets by title, description, or user..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                         text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                         text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <div className="space-y-3 sm:space-y-4">
                        {filteredTickets.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow text-center">
                                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No tickets found</p>
                            </div>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <Link
                                    key={ticket._id}
                                    to={`/ticket/${ticket._id}`}
                                    className="block bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition active:scale-[0.99]"
                                >
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 break-words">
                                                {ticket.title}
                                            </h3>
                                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2 line-clamp-2 break-words">
                                                {ticket.description}
                                            </p>
                                            
                                            <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-2">
                                                {ticket.aiCategory && (
                                                    <span className={`px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${getCategoryColor(ticket.aiCategory)}`}>
                                                        🤖 {ticket.aiCategory}
                                                    </span>
                                                )}
                                                {ticket.aiSentiment && (
                                                    <span className="px-2 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                                                        {getSentimentEmoji(ticket.aiSentiment)} {ticket.aiSentiment}
                                                    </span>
                                                )}
                                                {ticket.aiConfidence && (
                                                    <span className="px-2 py-0.5 sm:py-1 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded text-xs font-medium">
                                                        ✨ {ticket.aiConfidence}%
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col xs:flex-row gap-1 xs:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                <span className="truncate">👤 {ticket.user?.name || "Unknown"}</span>
                                                {ticket.assignedTo && (
                                                    <span className="truncate">
                                                        ✅ Assigned: <strong>{ticket.assignedTo.name}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex sm:flex-col gap-2 items-start sm:items-end flex-wrap sm:flex-nowrap">
                                            <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                            <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 xs:gap-0 text-xs text-gray-400 dark:text-gray-500 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <span className="truncate">Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        <span className="whitespace-nowrap">💬 {ticket.comments?.length || 0} comments</span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AllTickets;