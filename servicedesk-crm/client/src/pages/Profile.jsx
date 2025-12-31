import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

function Profile() {
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        setUser(storedUser);
    }, []);

    if (!user) return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar user={null} isOpen={false} setIsOpen={() => {}} />
            <div className="flex-1 p-4 flex items-center justify-center">
                <p className="text-base">Loading...</p>
            </div>
        </div>
    );

    const getRoleBadge = (role) => {
        switch(role) {
            case "admin":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
            case "agent":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
            default:
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
        }
    };

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
                        <h1 className="text-xl lg:text-2xl font-bold dark:text-white">Profile</h1>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 sm:p-6 max-w-2xl">
                        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h2 className="text-xl font-bold mb-2 dark:text-white break-words">
                                    {user.name}
                                </h2>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadge(user.role)}`}>
                                    {user.role?.toUpperCase() || "USER"}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <h3 className="font-semibold text-base dark:text-white">Account Details</h3>
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                    <div className="font-semibold text-sm text-gray-600 dark:text-gray-400 sm:w-1/3">Email:</div>
                                    <div className="text-sm text-gray-800 dark:text-gray-200 break-all sm:w-2/3">{user.email}</div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                    <div className="font-semibold text-sm text-gray-600 dark:text-gray-400 sm:w-1/3">User ID:</div>
                                    <div className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all sm:w-2/3">{user._id}</div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:gap-4 py-2">
                                    <div className="font-semibold text-sm text-gray-600 dark:text-gray-400 sm:w-1/3">Role:</div>
                                    <div className="text-sm text-gray-800 dark:text-gray-200 capitalize sm:w-2/3">{user.role || "User"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-base mb-3 dark:text-white">Permissions</h3>
                            <ul className="space-y-2">
                                {user.role === "admin" && (
                                    <>
                                        <li className="flex items-start text-green-700 dark:text-green-400 text-sm">
                                            <span className="mr-2 mt-0.5">✅</span><span>View all tickets</span>
                                        </li>
                                        <li className="flex items-start text-green-700 dark:text-green-400 text-sm">
                                            <span className="mr-2 mt-0.5">✅</span><span>Assign tickets to agents</span>
                                        </li>
                                        <li className="flex items-start text-green-700 dark:text-green-400 text-sm">
                                            <span className="mr-2 mt-0.5">✅</span><span>Manage users</span>
                                        </li>
                                        <li className="flex items-start text-green-700 dark:text-green-400 text-sm">
                                            <span className="mr-2 mt-0.5">✅</span><span>View analytics dashboard</span>
                                        </li>
                                    </>
                                )}
                                {user.role === "agent" && (
                                    <>
                                        <li className="flex items-start text-blue-700 dark:text-blue-400 text-sm">
                                            <span className="mr-2 mt-0.5">✅</span><span>View all tickets</span>
                                        </li>
                                        <li className="flex items-start text-blue-700 dark:text-blue-400 text-sm">
                                            <span className="mr-2 mt-0.5">✅</span><span>View assigned tickets</span>
                                        </li>
                                        <li className="flex items-start text-blue-700 dark:text-blue-400 text-sm">
                                            <span className="mr-2 mt-0.5">✅</span><span>Update ticket status</span>
                                        </li>
                                    </>
                                )}
                                {(!user.role || user.role === "user") && (
                                    <>
                                        <li className="flex items-start text-gray-700 dark:text-gray-300 text-sm">
                                            <span className="mr-2 mt-0.5">✅</span><span>Create new tickets</span>
                                        </li>
                                        <li className="flex items-start text-gray-700 dark:text-gray-300 text-sm">
                                            <span className="mr-2 mt-0.5">✅</span><span>View own tickets</span>
                                        </li>
                                        <li className="flex items-start text-gray-700 dark:text-gray-300 text-sm">
                                            <span className="mr-2 mt-0.5">✅</span><span>Add comments to tickets</span>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Profile;