import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

function Profile() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        setUser(storedUser);
    }, []);

    if (!user) return (
        <div className="p-8">
            <p>Loading...</p>
        </div>
    );

    const getRoleBadge = (role) => {
        switch(role) {
            case "admin":
                return "bg-red-100 text-red-700";
            case "agent":
                return "bg-blue-100 text-blue-700";
            default:
                return "bg-green-100 text-green-700";
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar user={user} />

            <main className="flex-1 p-8">
                <h1 className="text-3xl font-bold mb-6">Profile</h1>
                
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-2xl">
                    <div className="flex items-start gap-6 mb-6">
                        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadge(user.role)}`}>
                                {user.role?.toUpperCase() || "USER"}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1 font-semibold text-gray-600">Email:</div>
                            <div className="col-span-2 text-gray-800">{user.email}</div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1 font-semibold text-gray-600">User ID:</div>
                            <div className="col-span-2 text-gray-800 font-mono text-sm">{user._id}</div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1 font-semibold text-gray-600">Role:</div>
                            <div className="col-span-2 text-gray-800 capitalize">{user.role || "User"}</div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <h3 className="font-semibold text-lg mb-3">Permissions</h3>
                        <ul className="space-y-2 text-sm">
                            {user.role === "admin" && (
                                <>
                                    <li className="flex items-center text-green-700">
                                        <span className="mr-2">✅</span> View all tickets
                                    </li>
                                    <li className="flex items-center text-green-700">
                                        <span className="mr-2">✅</span> Assign tickets to agents
                                    </li>
                                    <li className="flex items-center text-green-700">
                                        <span className="mr-2">✅</span> Manage users
                                    </li>
                                    <li className="flex items-center text-green-700">
                                        <span className="mr-2">✅</span> View analytics
                                    </li>
                                </>
                            )}
                            {user.role === "agent" && (
                                <>
                                    <li className="flex items-center text-blue-700">
                                        <span className="mr-2">✅</span> View all tickets
                                    </li>
                                    <li className="flex items-center text-blue-700">
                                        <span className="mr-2">✅</span> View assigned tickets
                                    </li>
                                    <li className="flex items-center text-blue-700">
                                        <span className="mr-2">✅</span> Update ticket status
                                    </li>
                                </>
                            )}
                            {(!user.role || user.role === "user") && (
                                <>
                                    <li className="flex items-center text-gray-700">
                                        <span className="mr-2">✅</span> Create tickets
                                    </li>
                                    <li className="flex items-center text-gray-700">
                                        <span className="mr-2">✅</span> View own tickets
                                    </li>
                                    <li className="flex items-center text-gray-700">
                                        <span className="mr-2">✅</span> Add comments
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Profile;