import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './index.css';

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OAuthSuccess from "./pages/OAuthSuccess";

// User Pages
import Dashboard from "./pages/Dashboard";
import CreateTicket from "./pages/CreateTicket";
import MyTickets from "./pages/MyTickets";
import Profile from "./pages/Profile";

// Ticket Detail Page
import TicketDetail from "./pages/TicketDetail";

// Admin/Agent Pages
import AllTickets from "./pages/AllTickets";
import AssignedTickets from "./pages/AssignedTickets";

// Analytics Page
import Analytics from "./pages/Analytics";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationToast from "./components/NotificationToast";

// Context
import { StatsProvider } from "./context/StatsContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <SocketProvider>
        <StatsProvider>
          <BrowserRouter>
            {/* Real-time notification toasts */}
            <NotificationToast />

            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/oauth-success" element={<OAuthSuccess />} />

              {/* Protected User Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-ticket"
                element={
                  <ProtectedRoute>
                    <CreateTicket />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute>
                    <MyTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Ticket Detail Route */}
              <Route
                path="/ticket/:id"
                element={
                  <ProtectedRoute>
                    <TicketDetail />
                  </ProtectedRoute>
                }
              />

              {/* Admin/Agent Routes */}
              <Route
                path="/all-tickets"
                element={
                  <ProtectedRoute>
                    <AllTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assigned-tickets"
                element={
                  <ProtectedRoute>
                    <AssignedTickets />
                  </ProtectedRoute>
                }
              />

              {/* Analytics Route */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </StatsProvider>
      </SocketProvider>
    </ThemeProvider>
  </React.StrictMode>
);