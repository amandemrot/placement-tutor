import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AuthPage from "./pages/AuthPage";
import StudentDashboard from "./pages/StudentDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Onboarding from "./pages/Onboarding";
import MentorOnboarding from "./pages/MentorOnboarding";

function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role === "mentor") {
    if (!user.mentorProfile?.onboardingSubmitted)
      return <Navigate to="/mentor-onboarding" replace />;
    return <Navigate to="/mentor" replace />;
  }
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (!user.profileCompleted) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <div className="min-h-screen aurora">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
<Route path="/onboarding" element={<Protected role="student"><Onboarding /></Protected>} />
<Route path="/mentor-onboarding" element={<Protected role="mentor"><MentorOnboarding /></Protected>} />
        <Route path="/student" element={<Protected role="student"><StudentDashboard /></Protected>} />
        <Route path="/mentor" element={<Protected role="mentor"><MentorDashboard /></Protected>} />
        <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
      </Routes>
    </div>
  );
}