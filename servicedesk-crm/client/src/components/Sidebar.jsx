import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Sidebar({ user, isOpen, setIsOpen }) {
    const navigate = useNavigate();

    // Close sidebar when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (!e.target.closest('.mobile-sidebar') && !e.target.closest('button[aria-label="Open menu"]')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, setIsOpen]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

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

    const closeMobileMenu = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* Overlay - Mobile Only */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`
                    mobile-sidebar
                    fixed lg:static
                    inset-y-0 left-0
                    w-64
                    bg-white dark:bg-gray-900 
                    shadow-2xl lg:shadow-lg
                    flex flex-col
                    transition-transform duration-300 ease-in-out
                    z-50 lg:z-auto
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    h-screen
                `}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            ServiceDesk CRM
                        </h2>
                        {/* Close button - Mobile only */}
                        <button
                            onClick={closeMobileMenu}
                            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {user && (
                        <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                {user.name}
                            </p>
                            <span className={`inline-block text-xs px-2.5 py-1 rounded-full mt-1.5 font-semibold ${
                                user.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                user.role === 'agent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            }`}>
                                {user.role?.toUpperCase() || 'USER'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={closeMobileMenu}
                            className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium 
                                     hover:bg-blue-50 dark:hover:bg-gray-800 
                                     hover:text-blue-600 dark:hover:text-blue-400 
                                     px-3 py-2.5 rounded-lg transition-all duration-200
                                     text-sm"
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => {
                            handleLogout();
                            closeMobileMenu();
                        }}
                        className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold 
                                 hover:bg-red-50 dark:hover:bg-red-900/20 
                                 px-3 py-2.5 rounded-lg transition-all duration-200
                                 text-sm"
                    >
                        <span>🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}