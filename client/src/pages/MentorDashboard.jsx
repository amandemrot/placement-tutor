import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Clock, IndianRupee, UserCircle, Hourglass, LogOut, XCircle, PartyPopper } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Availability from "../components/Availability";
import Earnings from "../components/Earnings";
import { useAuth } from "../AuthContext";
import api from "../api";

function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-3 border-b border-line last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-white text-right break-all">{value || "—"}</span>
    </div>
  );
}

function MentorProfile({ profile }) {
  const p = profile || {};
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-1">My Profile</h1>
      <p className="text-gray-400 mb-8">Details you submitted during onboarding.</p>

      {p.photo && (
        <img src={p.photo} alt="Profile"
          className="w-24 h-24 rounded-2xl object-cover mb-6 border border-line" />
      )}

      <div className="bg-card2 border border-line rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold tracking-widest text-brand-400 uppercase mb-2">Personal</h2>
        <ProfileRow label="Phone" value={p.phone} />
        <ProfileRow label="Location" value={p.location} />
        <ProfileRow label="Bio" value={p.bio} />
        <ProfileRow label="LinkedIn" value={p.linkedIn} />
      </div>

      <div className="bg-card2 border border-line rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold tracking-widest text-brand-400 uppercase mb-2">Education</h2>
        <ProfileRow label="College" value={p.college} />
        <ProfileRow label="Degree" value={p.degree} />
        <ProfileRow label="Branch" value={p.branch} />
        <ProfileRow label="Graduation Year" value={p.graduationYear} />
      </div>

      <div className="bg-card2 border border-line rounded-2xl p-6">
        <h2 className="text-sm font-semibold tracking-widest text-brand-400 uppercase mb-2">Experience</h2>
        <ProfileRow label="Company" value={p.company} />
        <ProfileRow label="Designation" value={p.designation} />
        <ProfileRow label="Experience (years)" value={p.experience} />
        <ProfileRow label="Skills" value={Array.isArray(p.skills) ? p.skills.join(", ") : p.skills} />
        <ProfileRow label="Price per hour" value={p.pricePerHour ? `₹${p.pricePerHour}` : ""} />
      </div>
    </div>
  );
}

function CenterCard({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-card2 border border-line rounded-2xl p-10">{children}</div>
    </div>
  );
}

function PendingScreen() {
  const { logout } = useAuth();
  return (
    <CenterCard>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
          <Hourglass className="text-amber-400" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Account under approval</h1>
        <p className="text-gray-400 mb-8">
          Your dashboard will open after approval. Our team is reviewing your details — this usually takes 1–2 days.
        </p>
        <button onClick={logout}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-line text-gray-400 hover:text-white transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </CenterCard>
  );
}

function RejectedScreen() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const refill = async () => {
    setBusy(true);
    try {
      await api.put("/mentors/onboarding", {
        step: 1,
        data: { onboardingSubmitted: false, termsAccepted: false },
      });
      navigate("/mentor-onboarding", { replace: true });
    } catch {
      setBusy(false);
    }
  };

  return (
    <CenterCard>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center">
          <XCircle className="text-red-400" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Account rejected</h1>
        <p className="text-gray-400 mb-8">
          Unfortunately your application was not approved. You can update your details and submit again.
        </p>
        <button onClick={refill} disabled={busy}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-60 mb-3">
          {busy ? "Opening…" : "Fill the form again"}
        </button>
        <button onClick={logout}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-line text-gray-400 hover:text-white transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </CenterCard>
  );
}

const TERMS = [
  "You will conduct all mentorship sessions professionally and on time.",
  "You will not share students' personal information with anyone.",
  "Session payments are collected by PlacementTutor; earnings are credited to you after each completed session.",
  "Cancelling confirmed sessions repeatedly may lead to suspension of your mentor account.",
  "You confirm that all details submitted during onboarding are true and belong to you.",
  "PlacementTutor may contact you for additional verification at any time.",
];

function TermsScreen({ onAccepted }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const accept = async () => {
    setBusy(true); setErr("");
    try {
      await api.put("/mentors/onboarding", { data: { termsAccepted: true } });
      onAccepted();
    } catch (e) {
      setErr(e.response?.data?.message || "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <CenterCard>
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center">
          <PartyPopper className="text-green-400" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Congratulations! 🎉</h1>
        <p className="text-gray-400">Your mentor account has been approved. Please read and accept the terms to continue.</p>
      </div>

      <div className="bg-black/20 border border-line rounded-xl p-5 max-h-56 overflow-y-auto mb-5 text-left">
        <h2 className="text-sm font-semibold tracking-widest text-brand-400 uppercase mb-3">Terms &amp; Conditions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
          {TERMS.map((t, i) => <li key={i}>{t}</li>)}
        </ol>
      </div>

      <label className="flex items-start gap-3 mb-5 cursor-pointer text-left">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}
          className="mt-1 w-4 h-4 accent-brand-500" />
        <span className="text-sm text-gray-300">I have read and agree to the Terms &amp; Conditions.</span>
      </label>

      {err && <p className="text-red-400 text-sm mb-3">{err}</p>}

      <button onClick={accept} disabled={!checked || busy}
        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-40">
        {busy ? "Please wait…" : "Accept & Open Dashboard"}
      </button>
    </CenterCard>
  );
}

export default function MentorDashboard() {
  const [tab, setTab] = useState("availability");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/mentors/onboarding")
      .then((res) => setProfile(res.data.mentorProfile || {}))
      .catch(() => setProfile({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  if (!profile?.onboardingSubmitted)
    return <Navigate to="/mentor-onboarding" replace />;

  if (profile?.verificationStatus === "rejected") return <RejectedScreen />;

  if (profile?.verificationStatus !== "approved") return <PendingScreen />;

  if (!profile?.termsAccepted)
    return <TermsScreen onAccepted={() => setProfile({ ...profile, termsAccepted: true })} />;

  const items = [
    { key: "availability", label: "Availability", icon: Clock },
    { key: "earnings", label: "Earnings", icon: IndianRupee },
    { key: "profile", label: "My Profile", icon: UserCircle },
  ];

  return (
    <div className="flex">
      <Sidebar items={items} active={tab} onSelect={setTab} />
      <main className="flex-1 p-4 pt-24 pb-16 md:p-10 md:pt-10 md:h-screen md:overflow-y-auto">
        {tab === "availability" && <Availability />}
        {tab === "earnings" && <Earnings />}
        {tab === "profile" && <MentorProfile profile={profile} />}
      </main>
    </div>
  );
}