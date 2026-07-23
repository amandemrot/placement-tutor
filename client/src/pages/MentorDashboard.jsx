import { useEffect, useState, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Clock, IndianRupee, UserCircle, Hourglass, LogOut, XCircle, PartyPopper, MapPin, Briefcase, GraduationCap, BadgeCheck, CalendarCheck, Video, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Availability from "../components/Availability";
import Earnings from "../components/Earnings";
import { useAuth } from "../AuthContext";
import api from "../api";

function MentorBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/bookings/mentor")
      .then((r) => setBookings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const [sub, setSub] = useState("upcoming");
  if (loading)
    return <p className="text-gray-400">Loading…</p>;
  const all = bookings.filter((b) => b.status === "confirmed");
  const now = new Date();
  const upcoming = all.filter((b) => b.slot && new Date(b.slot.startTime) > now);
  const past = all.filter((b) => !b.slot || new Date(b.slot.startTime) <= now);
  const confirmed = sub === "upcoming" ? upcoming : past;
  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-white mb-1">My Bookings</h1>
      <p className="text-gray-400 mb-8">Sessions students have booked with you.</p>
      <div className="flex gap-3 mb-6">
        <button onClick={() => setSub("upcoming")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${sub === "upcoming" ? "bg-brand-500/20 text-brand-400 border-brand-500/40" : "text-gray-400 border-line hover:text-white"}`}>
          Upcoming ({upcoming.length})
        </button>
        <button onClick={() => setSub("past")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${sub === "past" ? "bg-brand-500/20 text-brand-400 border-brand-500/40" : "text-gray-400 border-line hover:text-white"}`}>
          Past ({past.length})
        </button>
      </div>
      {confirmed.length === 0 ? (
        <div className="bg-card2 border border-line rounded-2xl p-10 text-center text-gray-400">
          No bookings yet. Once a student books your slot, it will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {confirmed.map((b) => (
            <div key={b._id} className="bg-card2 border border-line rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <img
                  src={b.student?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(b.student?.name || "student")}`}
                  alt={b.student?.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-line"
                />
                <div className="flex-1">
                  <p className="text-white font-bold">{b.student?.name}</p>
                  <p className="text-gray-400 text-sm break-all">{b.student?.email}</p>
                </div>
                <div className="text-sm text-gray-300">
                  <p>{b.slot?.date}</p>
                  <p className="text-gray-500">
                    {b.slot?.startTime ? new Date(b.slot.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"} · {b.slot?.durationMinutes} min
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-white font-bold">₹{b.amount}</p>
                  {sub === "past" ? (
                    <span className="text-[11px] bg-gray-500/15 text-gray-400 border border-gray-500/40 rounded-full px-2 py-0.5">COMPLETED</span>
                  ) : (
                    <span className="text-[11px] bg-green-500/15 text-green-400 border border-green-500/40 rounded-full px-2 py-0.5">CONFIRMED</span>
                  )}
                </div>
                {sub === "upcoming" && b.meetingLink && (
                  <a href={b.meetingLink} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-brand-400 hover:text-white text-sm font-semibold">
                    <Video size={16} /> Join
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CongratsModal({ firstTime, count, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card2 border border-line rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center">
          <PartyPopper className="text-green-400" size={28} />
        </div>
        {firstTime ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Congratulations on your first booking! 🎉</h1>
            <p className="text-gray-400 mb-4">A student has booked a session with you. Here's a quick reminder of what's expected:</p>
            <ul className="text-left text-sm text-gray-300 space-y-2 mb-6 list-disc list-inside">
              <li>Join the session on time using the meeting link.</li>
              <li>Be professional and respectful throughout.</li>
              <li>Do not share the student's personal information.</li>
              <li>Your earnings are credited after the session completes.</li>
              <li>Repeated cancellations may lead to account suspension.</li>
            </ul>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Congratulations! 🎉</h1>
            <p className="text-gray-400 mb-6">{count === 1 ? "A new session has been booked with you." : `${count} new sessions have been booked with you.`} Check My Bookings for details.</p>
          </>
        )}
        <button onClick={onClose}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow">
          View My Bookings
        </button>
      </div>
    </div>
  );
}

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
    <div className="max-w-6xl">
      <div className="relative rounded-2xl overflow-hidden mb-6 border border-line">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/40 via-brand-500/20 to-transparent" />
        <div className="relative p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6 bg-card2/80">
          <img
            src={p.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor"}
            alt="Profile"
            className="w-32 h-32 rounded-2xl object-cover border border-line shrink-0"
          />
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2 flex-wrap">
              {p.designation || "Mentor"}
              <span className="flex items-center gap-1 text-[11px] bg-brand-500/20 text-brand-400 border border-brand-500/40 rounded-full px-2 py-0.5">
                <BadgeCheck size={12} /> Verified
              </span>
            </h1>
            {p.location && (
              <p className="text-gray-300 mt-2 flex items-center gap-2">
                <MapPin size={16} className="text-brand-400" /> {p.location}
              </p>
            )}
            {p.experience && (
              <p className="text-gray-300 mt-1 flex items-center gap-2">
                <Briefcase size={16} className="text-brand-400" /> {p.experience} yrs of Exp
              </p>
            )}
            {p.pricePerHour && (
              <p className="text-white font-bold mt-3 text-lg">₹{p.pricePerHour}<span className="text-sm text-gray-400 font-normal">/hr</span></p>
            )}
          </div>
        </div>
      </div>

      {p.bio && (
        <div className="bg-card2 border border-line rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold tracking-widest text-brand-400 uppercase mb-3">About</h2>
          <p className="text-gray-300 leading-relaxed">{p.bio}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-6 items-start">
        <div className="bg-card2 border border-line rounded-2xl p-6">
          <h2 className="text-sm font-semibold tracking-widest text-brand-400 uppercase mb-2">Personal</h2>
          <ProfileRow label="Phone" value={p.phone} />
          <ProfileRow label="Location" value={p.location} />
          <ProfileRow label="LinkedIn" value={p.linkedIn} />
        </div>
        <div className="bg-card2 border border-line rounded-2xl p-6">
          <h2 className="text-sm font-semibold tracking-widest text-brand-400 uppercase mb-2 flex items-center gap-2"><GraduationCap size={15} /> Education</h2>
          <ProfileRow label="College" value={p.college} />
          <ProfileRow label="Degree" value={p.degree} />
          <ProfileRow label="Branch" value={p.branch} />
          <ProfileRow label="Graduation Year" value={p.graduationYear} />
        </div>
        <div className="bg-card2 border border-line rounded-2xl p-6">
          <h2 className="text-sm font-semibold tracking-widest text-brand-400 uppercase mb-2 flex items-center gap-2"><Briefcase size={15} /> Experience</h2>
          <ProfileRow label="Company" value={p.company} />
          <ProfileRow label="Designation" value={p.designation} />
          <ProfileRow label="Experience (years)" value={p.experience} />
          <ProfileRow label="Price per hour" value={p.pricePerHour ? `₹${p.pricePerHour}` : ""} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {(Array.isArray(p.skills) ? p.skills : []).length > 0 && (
          <div className="bg-card2 border border-line rounded-2xl p-6">
            <h2 className="text-sm font-semibold tracking-widest text-brand-400 uppercase mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <span key={s} className="text-sm bg-black/20 border border-line rounded-full px-4 py-1.5 text-gray-300">{s}</span>
              ))}
            </div>
          </div>
        )}
        <div className="bg-card2 border border-line rounded-2xl p-6">
          <h2 className="text-sm font-semibold tracking-widest text-brand-400 uppercase mb-3">Verified Info</h2>
          <p className="text-green-400 text-sm flex items-center gap-2 mb-2"><BadgeCheck size={15} /> Email Verified</p>
         {p.phone && <p className="text-green-400 text-sm flex items-center gap-2"><BadgeCheck size={15} /> Phone Verified</p>}
        </div>
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
  const [congrats, setCongrats] = useState(null);
  useEffect(() => {
    api.get("/mentors/onboarding")
      .then((res) => setProfile(res.data.mentorProfile || {}))
      .catch(() => setProfile({}))
      .finally(() => setLoading(false));
    Promise.all([
      api.get("/bookings/mentor"),
      api.get("/mentors/onboarding"),
    ])
      .then(([b, o]) => {
        const confirmed = b.data.filter((x) => x.status === "confirmed");
        const seen = Number(o.data.mentorProfile?.seenBookings || 0);
        if (confirmed.length > seen) {
          setCongrats({ firstTime: seen === 0, count: confirmed.length - seen });
          api.put("/mentors/onboarding", { data: { seenBookings: confirmed.length } }).catch(() => {});
        }
      })
      .catch(() => {});
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
    { key: "bookings", label: "My Bookings", icon: CalendarCheck },
    { key: "earnings", label: "Earnings", icon: IndianRupee },
    { key: "profile", label: "My Profile", icon: UserCircle },
  ];

  return (
    <div className="flex">
      <Sidebar items={items} active={tab} onSelect={setTab} />
      <main className="flex-1 p-4 pt-24 pb-16 md:p-10 md:pt-10 md:h-screen md:overflow-y-auto">
        {tab === "availability" && <Availability />}
        {tab === "bookings" && <MentorBookings />}
        {tab === "earnings" && <Earnings />}
        {tab === "profile" && <MentorProfile profile={profile} />}
      </main>
      {congrats && (
        <CongratsModal firstTime={congrats.firstTime} count={congrats.count}
          onClose={() => { setCongrats(null); setTab("bookings"); }} />
      )}
    </div>
  );
}