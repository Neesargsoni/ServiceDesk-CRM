import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters";
    if (/^\d/.test(name)) return "Name cannot start with a number";
    if (!/^[a-zA-Z\s'-]+$/.test(name)) return "Name can only contain letters, spaces, hyphens, and apostrophes";
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return "Phone number is required";
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) return "Phone must be at least 10 digits";
    if (digitsOnly.length > 15) return "Phone must be less than 15 digits";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Must contain uppercase letter";
    if (!/[a-z]/.test(password)) return "Must contain lowercase letter";
    if (!/\d/.test(password)) return "Must contain a number";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return "Must contain special character";
    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (touched[name]) {
      let error = "";
      switch (name) {
        case "name": error = validateName(value); break;
        case "email": error = validateEmail(value); break;
        case "phone": error = validatePhone(value); break;
        case "password": 
          error = validatePassword(value);
          if (form.confirmPassword) {
            setErrors(prev => ({
              ...prev,
              confirmPassword: validateConfirmPassword(form.confirmPassword, value)
            }));
          }
          break;
        case "confirmPassword": error = validateConfirmPassword(value, form.password); break;
      }
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });

    let error = "";
    switch (name) {
      case "name": error = validateName(value); break;
      case "email": error = validateEmail(value); break;
      case "phone": error = validatePhone(value); break;
      case "password": error = validatePassword(value); break;
      case "confirmPassword": error = validateConfirmPassword(value, form.password); break;
    }
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    const newErrors = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.confirmPassword, form.password),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error !== "")) {
      setMessage("Please fix all errors before submitting");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/customers", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        password: form.password,
      });

      setMessage(`✅ "${res.data.name}" registered successfully! Redirecting...`);
      setShowMessage(true);

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Server error. Please try again.");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Social login handlers (placeholder)
  const handleGoogleSignup = () => {
    alert("Google signup - Coming soon! Implement OAuth 2.0 integration.");
  };

  const handleFacebookSignup = () => {
    alert("Facebook signup - Coming soon! Implement OAuth 2.0 integration.");
  };

  const handleLinkedInSignup = () => {
    alert("LinkedIn signup - Coming soon! Implement OAuth 2.0 integration.");
  };

  const handleMicrosoftSignup = () => {
    alert("Microsoft signup - Coming soon! Implement OAuth 2.0 integration.");
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: "", color: "" };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

    if (strength <= 2) return { strength: "Weak", color: "text-red-600" };
    if (strength <= 4) return { strength: "Medium", color: "text-yellow-600" };
    return { strength: "Strong", color: "text-green-600" };
  };

  const passwordStrength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">ServiceDesk</h1>
          <p className="text-gray-600">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Sign Up</h2>
          <p className="text-gray-600 text-sm text-center mb-6">
            Join our platform in seconds
          </p>

          {showMessage && (
            <div className={`mb-4 p-3 rounded-lg border ${
              message.includes("✅") 
                ? "bg-green-50 text-green-700 border-green-300" 
                : "bg-red-50 text-red-700 border-red-300"
            }`}>
              <p className="text-sm text-center">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  errors.name && touched.name
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.name && touched.name && (
                <p className="text-red-500 text-xs mt-1">⚠️ {errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  errors.email && touched.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.email && touched.email && (
                <p className="text-red-500 text-xs mt-1">⚠️ {errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={form.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                  errors.phone && touched.phone
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.phone && touched.phone && (
                <p className="text-red-500 text-xs mt-1">⚠️ {errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.password && touched.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {form.password && (
                <p className={`text-xs mt-1 font-medium ${passwordStrength.color}`}>
                  {passwordStrength.strength}
                </p>
              )}
              {errors.password && touched.password && (
                <p className="text-red-500 text-xs mt-1">⚠️ {errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.confirmPassword && touched.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {form.confirmPassword && !errors.confirmPassword && (
                <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>
              )}
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">⚠️ {errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all ${
                loading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">OR SIGN UP WITH</span>
            </div>
          </div>

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleGoogleSignup} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>

            <button onClick={handleMicrosoftSignup} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <svg className="w-5 h-5" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              <span className="text-sm font-medium">Microsoft</span>
            </button>

            <button onClick={handleLinkedInSignup} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="text-sm font-medium">LinkedIn</span>
            </button>

            <button onClick={handleFacebookSignup} className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium">Facebook</span>
            </button>
          </div>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <span
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer hover:underline"
              onClick={() => navigate("/login")}
            >
              Sign In
            </span>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          By signing up, you agree to our{" "}
          <a href="#" className="text-blue-600 hover:underline">Terms</a>
          {" "}and{" "}
          <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Register;