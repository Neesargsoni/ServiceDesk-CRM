import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

function MyTickets() {
    const [tickets, setTickets] = useState([]);
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
                        <h1 className="text-xl lg:text-2xl font-bold dark:text-white">My Tickets</h1>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    {/* Search and Filters */}
                    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <input
                                type="text"
                                placeholder="🔍 Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                         text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                         text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                         text-sm sm:text-base sm:col-span-2 lg:col-span-1
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <div className="space-y-3 sm:space-y-4">
                        {filteredTickets.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow text-center">
                                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
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
                                    className="block bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow 
                                             hover:shadow-lg transition active:scale-[0.99]"
                                >
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h2 className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-100 mb-2 break-words">
                                                {ticket.title}
                                            </h2>
                                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 break-words">
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

                                            {ticket.assignedTo && (
                                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
                                                    ✅ Assigned to: <strong>{ticket.assignedTo.name}</strong>
                                                </p>
                                            )}
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
                                    
                                    <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 xs:gap-0 text-xs text-gray-400 dark:text-gray-500 mt-3 sm:mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
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

export default MyTickets;