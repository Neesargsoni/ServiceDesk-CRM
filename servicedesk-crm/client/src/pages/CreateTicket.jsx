import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStats } from "../context/StatsContext";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

function CreateTicket() {
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Low");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { updateStats } = useStats();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post("/api/tickets/create", {
                title,
                description,
                priority,
            });

            console.log("✅ Ticket created with AI insights:", response.data);

            setMessage("Ticket created successfully!");
            setTitle("");
            setDescription("");
            setPriority("Low");

            const statsRes = await api.get("/api/tickets/stats");
            updateStats(statsRes.data);

            setTimeout(() => navigate("/my-tickets"), 1500);
        } catch (err) {
            console.error("Error creating ticket:", err);
            setMessage(err.response?.data?.error || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

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
                        <h1 className="text-xl lg:text-2xl font-bold dark:text-white">Create New Ticket</h1>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    {/* Success/Error Message */}
                    {message && (
                        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg ${
                            message.includes("successfully") 
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        }`}>
                            <p className="text-sm sm:text-base">{message}</p>
                        </div>
                    )}
                    
                    {/* Form Card */}
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-lg shadow-md w-full max-w-3xl">
                        {/* Title Field */}
                        <div className="mb-4 sm:mb-6">
                            <label className="block font-semibold mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                Ticket Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Brief description of the issue"
                                className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                         text-sm sm:text-base
                                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                         transition"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Example: "Cannot login to my account"
                            </p>
                        </div>

                        {/* Description Field */}
                        <div className="mb-4 sm:mb-6">
                            <label className="block font-semibold mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                placeholder="Provide detailed information about your issue..."
                                className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                         h-32 sm:h-40 resize-y
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                         text-sm sm:text-base
                                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                         transition"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                💡 The more details you provide, the better AI can categorize your ticket
                            </p>
                        </div>

                        {/* Priority Field */}
                        <div className="mb-6 sm:mb-8">
                            <label className="block font-semibold mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                Priority <span className="text-red-500">*</span>
                            </label>
                            <select
                                className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                         text-sm sm:text-base
                                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                         cursor-pointer transition"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="Low">🟢 Low - Not urgent</option>
                                <option value="Medium">🟡 Medium - Needs attention soon</option>
                                <option value="High">🟠 High - Important issue</option>
                                <option value="Urgent">🔴 Urgent - Critical issue</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={loading}
                            className={`w-full px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base
                                     transition-all duration-200 active:scale-[0.98]
                                     ${loading 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                                     } text-white`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating Ticket...
                                </span>
                            ) : (
                                '🎫 Create Ticket'
                            )}
                        </button>

                        {/* Info Box */}
                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                                <strong>🤖 AI-Powered Features:</strong> Your ticket will be automatically analyzed for category, sentiment, and priority suggestions.
                            </p>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default CreateTicket;