import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function AssignedTickets() {
    const [tickets, setTickets] = useState([]);
    const [user, setUser] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchAssignedTickets();
    }, []);

    const fetchAssignedTickets = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/tickets/assigned`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (err) {
            console.error("Error fetching assigned tickets:", err);
        }
    };

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
                <h1 className="text-3xl font-bold mb-6">Tickets Assigned to Me</h1>

                <div className="space-y-4">
                    {tickets.length === 0 ? (
                        <div className="bg-white p-8 rounded-lg shadow text-center">
                            <p className="text-gray-500">No tickets assigned to you yet.</p>
                        </div>
                    ) : (
                        tickets.map((ticket) => (
                            <Link
                                key={ticket._id}
                                to={`/ticket/${ticket._id}`}
                                className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                                            {ticket.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                            {ticket.description}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            👤 Created by: <strong>{ticket.user?.name}</strong>
                                        </p>
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

export default AssignedTickets;