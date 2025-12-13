import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");


    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Store token if backend returns it
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Server error. Try again.");
    }


  };

  return (<div className="min-h-screen bg-gray-100 flex items-center justify-center p-6"> <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md"> <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
    ServiceDesk CRM </h1>


    {error && (
      <p className="text-red-500 text-center mb-2 font-medium">{error}</p>
    )}

    <label className="block mb-2 text-gray-700 font-semibold">Email</label>
    <input
      type="email"
      className="w-full p-3 border rounded-lg mb-4 focus:ring focus:ring-blue-300"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="Enter your email"
    />

    <label className="block mb-2 text-gray-700 font-semibold">Password</label>
    <input
      type="password"
      className="w-full p-3 border rounded-lg mb-4 focus:ring focus:ring-blue-300"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Enter your password"
    />

    <button
      onClick={handleLogin}
      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition mt-2"
    >
      Login
    </button>

    <p className="text-center mt-4 text-gray-600">
      Don’t have an account?{" "}
      <Link to="/register" className="text-blue-600 font-semibold">
        Register
      </Link>
    </p>
  </div>
  </div>


  );
}

export default Login;
