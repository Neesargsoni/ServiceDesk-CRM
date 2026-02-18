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

    // 🔒 Internal Note State
    const [internalNote, setInternalNote] = useState("");

    // 🤖 AI STATES
    const [smartReplies, setSmartReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    // 🤖 AI HELPER FUNCTIONS
    const getSentimentEmoji = (sentiment) => {
        switch (sentiment) {
            case "Positive": return "😊";
            case "Negative": return "😠";
            case "Urgent": return "🔥";
            default: return "😐";
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case "Technical Issue": return "🔧";
            case "Billing Question": return "💳";
            case "Feature Request": return "✨";
            case "Bug Report": return "🐛";
            case "Account Issue": return "👤";
            default: return "📋";
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchTicket();
        fetchAgents();
    }, [id]);

    const fetchTicket = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/tickets/${id}`, {
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
            const res = await fetch(`${API_URL}/api/tickets/agents/list`, {
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

    // 🤖 Fetch Smart Replies
    const fetchSmartReplies = async () => {
        if (!isAdminOrAgent) return;

        setLoadingReplies(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/tickets/${id}/smart-replies`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setSmartReplies(data.suggestions.replies || []);
            }
        } catch (err) {
            console.error("Error fetching smart replies:", err);
        } finally {
            setLoadingReplies(false);
        }
    };

    const useSmartReply = (message) => {
        setComment(message);
        document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/tickets/${id}/comment`, {
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
            const res = await fetch(`${API_URL}/api/tickets/${id}`, {
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
            const res = await fetch(`${API_URL}/api/tickets/${id}/assign`, {
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

    // 🔒 Add Internal Note
    const handleAddInternalNote = async (e) => {
        e.preventDefault();
        if (!internalNote.trim()) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/tickets/${id}/internal-note`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text: internalNote }),
            });

            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setInternalNote("");
                alert("Internal note added");
            } else {
                alert("Failed to add internal note");
            }
        } catch (err) {
            console.error("Error adding internal note:", err);
        }
    };

    if (loading) return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar user={user} />
            <div className="flex-1 p-4 sm:p-8 flex items-center justify-center">
                <p className="text-base sm:text-lg">Loading ticket...</p>
            </div>
        </div>
    );

    if (!ticket) return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar user={user} />
            <div className="flex-1 p-4 sm:p-8 flex items-center justify-center">
                <p className="text-base sm:text-lg">Ticket not found</p>
            </div>
        </div>
    );

    const isAdminOrAgent = user && ["admin", "agent"].includes(user.role);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar user={user} />

            <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden overflow-y-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-3 sm:mb-4 text-sm sm:text-base text-blue-600 hover:underline flex items-center gap-1"
                >
                    ← Back
                </button>

                {/* Main Ticket Card */}
                <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    {/* Header - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-4 pb-4 border-b">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">
                                {ticket.title}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-2">
                                Created by: <span className="font-semibold">{ticket.user?.name}</span>
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                {new Date(ticket.createdAt).toLocaleString()}
                            </p>
                        </div>

                        {/* Badges - Horizontal on mobile, stack on tiny screens */}
                        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                            <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${ticket.priority === "Urgent" ? "bg-red-100 text-red-700" :
                                ticket.priority === "High" ? "bg-orange-100 text-orange-700" :
                                    ticket.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                                        "bg-green-100 text-green-700"
                                }`}>
                                {ticket.priority}
                            </span>
                            <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${ticket.status === "Open" ? "bg-blue-100 text-blue-700" :
                                ticket.status === "In Progress" ? "bg-purple-100 text-purple-700" :
                                    ticket.status === "Resolved" ? "bg-green-100 text-green-700" :
                                        "bg-gray-100 text-gray-700"
                                }`}>
                                {ticket.status}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Description</h3>
                        <p className="text-sm sm:text-base text-gray-700 break-words">
                            {ticket.description}
                        </p>
                    </div>

                    {/* Assigned Agent */}
                    {ticket.assignedTo && (
                        <div className="bg-blue-50 p-3 rounded mb-4">
                            <p className="text-xs sm:text-sm">
                                <span className="font-semibold">Assigned to:</span> {ticket.assignedTo.name}
                                <span className="ml-2 text-xs px-2 py-0.5 sm:py-1 bg-blue-200 rounded">
                                    {ticket.assignedTo.role}
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Update Controls for Admin/Agent - Responsive */}
                    {isAdminOrAgent && (
                        <div className="border-t pt-4 space-y-4">
                            <h3 className="font-semibold text-sm sm:text-base">Update Ticket</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium mb-1">Status</label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full p-2 sm:p-2.5 border rounded text-sm sm:text-base"
                                    >
                                        <option>Open</option>
                                        <option>In Progress</option>
                                        <option>Resolved</option>
                                        <option>Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium mb-1">Priority</label>
                                    <select
                                        value={newPriority}
                                        onChange={(e) => setNewPriority(e.target.value)}
                                        className="w-full p-2 sm:p-2.5 border rounded text-sm sm:text-base"
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
                                className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded text-sm sm:text-base hover:bg-blue-700 transition"
                            >
                                Update Ticket
                            </button>

                            {/* Assignment Section - Responsive */}
                            <div className="mt-4">
                                <label className="block text-xs sm:text-sm font-medium mb-1">Assign to Agent</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <select
                                        value={selectedAgent}
                                        onChange={(e) => setSelectedAgent(e.target.value)}
                                        className="flex-1 p-2 sm:p-2.5 border rounded text-sm sm:text-base"
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
                                        className="bg-green-600 text-white px-4 py-2 sm:py-2.5 rounded text-sm sm:text-base hover:bg-green-700 disabled:bg-gray-300 transition whitespace-nowrap"
                                    >
                                        Assign
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 🤖 AI INSIGHTS SECTION - Responsive grid */}
                {(ticket.aiCategory || ticket.aiSentiment || ticket.aiSuggestedPriority) && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6 border border-blue-200">
                        <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex flex-wrap items-center gap-2 text-gray-800">
                            <span className="text-xl sm:text-2xl">🤖</span>
                            <span>AI Insights</span>
                            {ticket.aiConfidence && (
                                <span className="text-xs sm:text-sm font-normal px-2 sm:px-3 py-1 bg-white rounded-full text-indigo-600">
                                    ✨ {ticket.aiConfidence}%
                                </span>
                            )}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {ticket.aiCategory && (
                                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                        Category
                                    </p>
                                    <p className="font-semibold text-sm sm:text-base text-gray-800 flex items-center gap-2">
                                        <span className="text-lg sm:text-xl">{getCategoryIcon(ticket.aiCategory)}</span>
                                        <span className="break-words">{ticket.aiCategory}</span>
                                    </p>
                                </div>
                            )}

                            {ticket.aiSentiment && (
                                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                        Sentiment
                                    </p>
                                    <p className="font-semibold text-sm sm:text-base text-gray-800 flex items-center gap-2">
                                        <span className="text-lg sm:text-xl">{getSentimentEmoji(ticket.aiSentiment)}</span>
                                        {ticket.aiSentiment}
                                    </p>
                                </div>
                            )}

                            {ticket.aiSuggestedPriority && (
                                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm sm:col-span-2 lg:col-span-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                        AI Suggested Priority
                                    </p>
                                    <p className="font-semibold text-sm sm:text-base text-gray-800 flex flex-wrap items-center gap-2">
                                        <span className="text-lg sm:text-xl">🎯</span>
                                        <span>{ticket.aiSuggestedPriority}</span>
                                        {ticket.priority !== ticket.aiSuggestedPriority && (
                                            <span className="text-xs text-orange-600">
                                                (Current: {ticket.priority})
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>

                        {ticket.aiProcessedAt && (
                            <p className="text-xs text-gray-500 mt-3 text-right">
                                Analyzed on {new Date(ticket.aiProcessedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                )}

                {/* 🤖 SMART REPLIES SECTION - Mobile optimized */}
                {isAdminOrAgent && (
                    <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                                <span className="text-xl sm:text-2xl">💬</span>
                                <span>Smart Replies</span>
                            </h2>
                            <button
                                onClick={fetchSmartReplies}
                                disabled={loadingReplies}
                                className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${loadingReplies
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                                    }`}
                            >
                                {loadingReplies ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Generating...
                                    </span>
                                ) : (
                                    '✨ Generate AI Replies'
                                )}
                            </button>
                        </div>

                        {smartReplies.length > 0 ? (
                            <div className="space-y-3">
                                {smartReplies.map((reply, index) => (
                                    <div
                                        key={index}
                                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50"
                                        onClick={() => useSmartReply(reply.message)}
                                    >
                                        <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2 mb-2">
                                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                                {reply.type || `Option ${index + 1}`}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    useSmartReply(reply.message);
                                                }}
                                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors self-start xs:self-auto"
                                            >
                                                Use This Reply
                                            </button>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                                            {reply.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 sm:py-8 text-gray-500">
                                <p className="mb-2 text-sm sm:text-base">
                                    🤖 Click "Generate AI Replies" to get suggestions
                                </p>
                                <p className="text-xs">AI will analyze the ticket and suggest professional responses</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Activity Timeline - Mobile optimized */}
                <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">📜 Activity Timeline</h2>
                    <div className="space-y-3">
                        {ticket.activity && ticket.activity.length > 0 ? (
                            ticket.activity.map((activity, index) => (
                                <div key={index} className="flex gap-3 border-l-2 border-blue-300 pl-3 sm:pl-4 pb-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm sm:text-base text-gray-800 break-words">
                                            {activity.userName}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-600 break-words">
                                            {activity.details}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No activity yet</p>
                        )}
                    </div>
                </div>

                {/* 🔒 INTERNAL NOTES SECTION (Agents & Admins Only) */}
                {isAdminOrAgent && (
                    <div className="bg-yellow-50 border border-yellow-200 shadow-lg rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-yellow-800">
                            🔒 Internal Notes (Private)
                        </h2>

                        <div className="space-y-3 mb-4">
                            {ticket.internalNotes && ticket.internalNotes.length > 0 ? (
                                ticket.internalNotes.map((note, index) => (
                                    <div key={index} className="bg-white p-3 sm:p-4 rounded border border-yellow-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-sm text-gray-800">{note.userName}</span>
                                            <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-700">{note.text}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 italic">No internal notes yet.</p>
                            )}
                        </div>

                        <form onSubmit={handleAddInternalNote}>
                            <textarea
                                value={internalNote}
                                onChange={(e) => setInternalNote(e.target.value)}
                                placeholder="Add a private note for other agents..."
                                className="w-full p-2 border border-yellow-300 rounded mb-2 h-20 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-yellow-700 transition shadow-sm"
                            >
                                Add Internal Note
                            </button>
                        </form>
                    </div>
                )}

                {/* Comments Section - Mobile optimized */}
                <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">💬 Comments</h2>

                    {/* Existing Comments */}
                    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                        {ticket.comments && ticket.comments.length > 0 ? (
                            ticket.comments.map((c, index) => (
                                <div key={index} className="bg-gray-50 p-3 sm:p-4 rounded border-l-4 border-blue-400">
                                    <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-1 xs:gap-0 mb-2">
                                        <p className="font-semibold text-sm sm:text-base">
                                            {c.userName}
                                            {c.userRole && (
                                                <span className="ml-2 text-xs px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded">
                                                    {c.userRole}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(c.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-700 break-words">
                                        {c.text}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No comments yet</p>
                        )}
                    </div>

                    {/* Add Comment Form - Mobile friendly */}
                    <form onSubmit={handleAddComment} className="border-t pt-4">
                        <label className="block font-medium text-sm sm:text-base mb-2">Add a Comment</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write your comment here..."
                            className="w-full p-2.5 sm:p-3 border rounded mb-2 h-20 sm:h-24 text-sm sm:text-base resize-y"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded text-sm sm:text-base hover:bg-blue-700 transition"
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