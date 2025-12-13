import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStats } from "../context/StatsContext";
import Sidebar from "../components/Sidebar";

function CreateTicket() {
    const [user, setUser] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Low");
    const [message, setMessage] = useState("");
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const { updateStats } = useStats();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/tickets/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, description, priority }),
        });
        const data = await res.json();
        if (res.ok) {
            setMessage("Ticket created successfully!");
            setTitle("");
            setDescription("");
            setPriority("Low");

            // Refresh stats immediately
            const statsRes = await fetch(`${API_URL}/tickets/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const statsData = await statsRes.json();
            updateStats(statsData);

            // Navigate to My Tickets after short delay
            setTimeout(() => navigate("/my-tickets"), 1000);
        } else {
            setMessage(data.message || "Something went wrong");
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar user={user} />

            <main className="flex-1 p-8">
                <h1 className="text-3xl font-bold mb-6">Create New Ticket</h1>
                
                {message && (
                    <div className={`mb-4 p-4 rounded ${
                        message.includes("successfully") 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                    }`}>
                        {message}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
                    <div className="mb-6">
                        <label className="block font-semibold mb-2 text-gray-700">
                            Ticket Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Brief description of the issue"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block font-semibold mb-2 text-gray-700">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            placeholder="Provide detailed information about your issue..."
                            className="w-full p-3 border rounded-lg h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block font-semibold mb-2 text-gray-700">
                            Priority <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="Low">Low - Not urgent</option>
                            <option value="Medium">Medium - Needs attention soon</option>
                            <option value="High">High - Important issue</option>
                            <option value="Urgent">Urgent - Critical issue</option>
                        </select>
                    </div>

                    <button className="bg-blue-600 text-white px-8 py-3 rounded-lg w-full font-semibold hover:bg-blue-700 transition">
                        Create Ticket
                    </button>
                </form>
            </main>
        </div>
    );
}

export default CreateTicket;