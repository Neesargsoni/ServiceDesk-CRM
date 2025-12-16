import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStats } from "../context/StatsContext";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

function CreateTicket() {
    const [user, setUser] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Low");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();
    const { updateStats } = useStats();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            await api.post("/tickets/create", {
                title,
                description,
                priority,
            });

            setMessage("Ticket created successfully!");
            setTitle("");
            setDescription("");
            setPriority("Low");

            const statsRes = await api.get("/tickets/stats");
            updateStats(statsRes.data);

            setTimeout(() => navigate("/my-tickets"), 1000);
        } catch (err) {
            setMessage(err.response?.data?.message || "Something went wrong");
        }
    }
}
// 🔽 JSX stays SAME
export default CreateTicket;