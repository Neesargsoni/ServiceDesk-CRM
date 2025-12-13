import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [user, setUser] = useState(null);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [newPriority, setNewPriority] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchTicket();
        fetchAgents();
    }, [id]);

    const fetchTicket = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/tickets/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                alert("Failed to load ticket");
                navigate("/my-tickets");
                return;
            }

            const data = await res.json();
            setTicket(data);
            setNewStatus(data.status);
            setNewPriority(data.priority);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching ticket:", err);
            setLoading(false);
        }
    };

    const fetchAgents = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/tickets/agents/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAgents(data);
            }
        } catch (err) {
            console.error("Error fetching agents:", err);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/tickets/${id}/comment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text: comment }),
            });

            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setComment("");
            } else {
                alert("Failed to add comment");
            }
        } catch (err) {
            console.error("Error adding comment:", err);
        }
    };

    const handleUpdateTicket = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/tickets/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: newStatus,
                    priority: newPriority,
                }),
            });

            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                alert("Ticket updated successfully");
            }
        } catch (err) {
            console.error("Error updating ticket:", err);
        }
    };

    const handleAssignTicket = async () => {
        if (!selectedAgent) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/tickets/${id}/assign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ agentId: selectedAgent }),
            });

            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setSelectedAgent("");
                alert("Ticket assigned successfully");
            }
        } catch (err) {
            console.error("Error assigning ticket:", err);
        }
    };

    if (loading) return <div className="p-8">Loading ticket...</div>;
    if (!ticket) return <div className="p-8">Ticket not found</div>;

    const isAdminOrAgent = user && ["admin", "agent"].includes(user.role);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar user={user} />

            <main className="flex-1 p-8 overflow-y-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 text-blue-600 hover:underline"
                >
                    ← Back
                </button>

                <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold">{ticket.title}</h1>
                            <p className="text-gray-600 mt-2">
                                Created by: <span className="font-semibold">{ticket.user?.name}</span>
                            </p>
                            <p className="text-sm text-gray-500">
                                {new Date(ticket.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                ticket.priority === "Urgent" ? "bg-red-100 text-red-700" :
                                ticket.priority === "High" ? "bg-orange-100 text-orange-700" :
                                ticket.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                                "bg-green-100 text-green-700"
                            }`}>
                                {ticket.priority}
                            </span>
                            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                                ticket.status === "Open" ? "bg-blue-100 text-blue-700" :
                                ticket.status === "In Progress" ? "bg-purple-100 text-purple-700" :
                                ticket.status === "Resolved" ? "bg-green-100 text-green-700" :
                                "bg-gray-100 text-gray-700"
                            }`}>
                                {ticket.status}
                            </span>
                        </div>
                    </div>

                    <div className="border-t pt-4 mb-6">
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-gray-700">{ticket.description}</p>
                    </div>

                    {ticket.assignedTo && (
                        <div className="bg-blue-50 p-3 rounded mb-4">
                            <p className="text-sm">
                                <span className="font-semibold">Assigned to:</span> {ticket.assignedTo.name}
                                <span className="ml-2 text-xs px-2 py-1 bg-blue-200 rounded">
                                    {ticket.assignedTo.role}
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Update Controls for Admin/Agent */}
                    {isAdminOrAgent && (
                        <div className="border-t pt-4 space-y-4">
                            <h3 className="font-semibold">Update Ticket</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option>Open</option>
                                        <option>In Progress</option>
                                        <option>Resolved</option>
                                        <option>Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Priority</label>
                                    <select
                                        value={newPriority}
                                        onChange={(e) => setNewPriority(e.target.value)}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                        <option>Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={handleUpdateTicket}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Update Ticket
                            </button>

                            {/* Assignment Section */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium mb-1">Assign to Agent</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedAgent}
                                        onChange={(e) => setSelectedAgent(e.target.value)}
                                        className="flex-1 p-2 border rounded"
                                    >
                                        <option value="">Select an agent...</option>
                                        {agents.map((agent) => (
                                            <option key={agent._id} value={agent._id}>
                                                {agent.name} ({agent.role})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAssignTicket}
                                        disabled={!selectedAgent}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-300"
                                    >
                                        Assign
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Activity Timeline */}
                <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">📜 Activity Timeline</h2>
                    <div className="space-y-3">
                        {ticket.activity && ticket.activity.length > 0 ? (
                            ticket.activity.map((activity, index) => (
                                <div key={index} className="flex gap-3 border-l-2 border-blue-300 pl-4 pb-3">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{activity.userName}</p>
                                        <p className="text-sm text-gray-600">{activity.details}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No activity yet</p>
                        )}
                    </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">💬 Comments</h2>

                    {/* Existing Comments */}
                    <div className="space-y-4 mb-6">
                        {ticket.comments && ticket.comments.length > 0 ? (
                            ticket.comments.map((c, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded border-l-4 border-blue-400">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-semibold">
                                            {c.userName}
                                            {c.userRole && (
                                                <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                    {c.userRole}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(c.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="text-gray-700">{c.text}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No comments yet</p>
                        )}
                    </div>

                    {/* Add Comment Form */}
                    <form onSubmit={handleAddComment} className="border-t pt-4">
                        <label className="block font-medium mb-2">Add a Comment</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write your comment here..."
                            className="w-full p-3 border rounded mb-2 h-24"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                        >
                            Post Comment
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default TicketDetail;