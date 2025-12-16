import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

function MyTickets() {
    const [tickets, setTickets] = useState([]);
    const [user, setUser] = useState(null);
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
            const res = await api.get("/tickets/my");
            setTickets(res.data);
        } catch (err) {
            console.error("Error loading tickets:", err);
        }
    }
}

// 🔽 rest of your JSX stays 
