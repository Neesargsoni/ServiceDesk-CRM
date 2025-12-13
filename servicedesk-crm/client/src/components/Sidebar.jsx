import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Sidebar({ user }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    // Role-based navigation items
    const getNavItems = () => {
        const role = user?.role || "user";

        const allItems = {
            user: [
                { to: "/dashboard", label: "Dashboard", icon: "📊" },
                { to: "/create-ticket", label: "Create Ticket", icon: "➕" },
                { to: "/my-tickets", label: "My Tickets", icon: "🎫" },
                { to: "/profile", label: "Profile", icon: "👤" },
            ],
            agent: [
                { to: "/dashboard", label: "Dashboard", icon: "📊" },
                { to: "/all-tickets", label: "All Tickets", icon: "📋" },
                { to: "/assigned-tickets", label: "Assigned to Me", icon: "✅" },
                { to: "/create-ticket", label: "Create Ticket", icon: "➕" },
                { to: "/my-tickets", label: "My Tickets", icon: "🎫" },
                { to: "/profile", label: "Profile", icon: "👤" },
            ],
            admin: [
                { to: "/dashboard", label: "Dashboard", icon: "📊" },
                { to: "/all-tickets", label: "All Tickets", icon: "📋" },
                { to: "/analytics", label: "Analytics", icon: "📈" },
                { to: "/users", label: "Manage Users", icon: "👥" },
                { to: "/create-ticket", label: "Create Ticket", icon: "➕" },
                { to: "/profile", label: "Profile", icon: "👤" },
            ]
        };

        return allItems[role] || allItems.user;
    };

    const navItems = getNavItems();

    return (
        <aside className="w-64 bg-white dark:bg-gray-900 shadow-lg p-5 flex flex-col h-screen transition-colors duration-300">
            <div>
                <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">ServiceDesk CRM</h2>
                {user && (
                    <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{user.name}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-700' :
                            user.role === 'agent' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                            {user.role?.toUpperCase() || 'USER'}
                        </span>
                    </div>
                )}
            </div>

            <nav className="space-y-2 flex-1">
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className="block text-gray-700 dark:text-gray-200 font-medium hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 p-3 rounded transition"
                    >
                        <span className="mr-2">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <button
                onClick={handleLogout}
                className="w-full text-red-500 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 p-3 rounded transition mt-4"
            >
                🚪 Logout
            </button>
            
            {/* Theme Toggle */}
            <ThemeToggle />
        </aside>
    );
}