import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function MyTickets() {
    const [tickets, setTickets] = useState([]);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    useEffect(() => {
        loadTickets();
    }, []);

    async function loadTickets() {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/tickets/my`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTickets(data);
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

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar user={user} />

            <main className="flex-1 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">My Tickets</h1>
                    <p className="text-gray-600">
                        Hello, <span className="font-semibold text-blue-600">{user?.name || "User"}</span>
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="🔍 Search tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 border rounded-lg"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="p-3 border rounded-lg"
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
                            className="p-3 border rounded-lg"
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
                        <div className="bg-white p-8 rounded-lg shadow text-center">
                            <p className="text-gray-500">
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
                                className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h2 className="font-bold text-xl text-gray-800 mb-2">
                                            {ticket.title}
                                        </h2>
                                        <p className="text-gray-600 mb-3 line-clamp-2">
                                            {ticket.description}
                                        </p>
                                        {ticket.assignedTo && (
                                            <p className="text-sm text-gray-500 mb-2">
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
                                <div className="flex justify-between items-center text-xs text-gray-400 mt-4 pt-3 border-t">
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