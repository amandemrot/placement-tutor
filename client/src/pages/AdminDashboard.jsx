import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Users, AlertTriangle, BadgeCheck, FileText, X, ChevronDown,
  LayoutDashboard, GraduationCap, CalendarDays, IndianRupee, Clock, XCircle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import api from "../api";

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const items = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "mentors", label: "Mentors", icon: GraduationCap },
    { key: "students", label: "Students", icon: Users },
    { key: "bookings", label: "Bookings", icon: CalendarDays },
    { key: "queue", label: "Approvals", icon: ShieldCheck },
  ];
  return (
    <div className="flex">
      <Sidebar items={items} active={tab} onSelect={setTab} />
      <main className="flex-1 p-4 pt-24 pb-16 md:p-10 md:pt-10 md:h-screen md:overflow-y-auto">
        {tab === "overview" && <Overview />}
        {tab === "mentors" && <Mentors />}
        {tab === "students" && <Students />}
        {tab === "bookings" && <Bookings />}
        {tab === "queue" && <Queue />}
      </main>
    </div>
  );
}

function Head({ title, sub }) {
  return (
    <>
      <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-bold text-white">{title}</motion.h1>
      <p className="text-gray-400 mt-2 mb-8">{sub}</p>
    </>
  );
}

/* ───────────── OVERVIEW ───────────── */
function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setS(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <Head title="Overview" sub="Everything happening on PlacementTutor right now." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Stat icon={Users} label="STUDENTS" value={s?.students ?? "—"} />
        <Stat icon={GraduationCap} label="MENTORS" value={s?.mentors ?? "—"} />
        <Stat icon={AlertTriangle} label="PENDING APPROVAL" value={s?.pending ?? "—"} highlight={s?.pending > 0} />
        <Stat icon={BadgeCheck} label="CONFIRMED SESSIONS" value={s?.bookings ?? "—"} />
        <Stat icon={XCircle} label="CANCELLED" value={s?.cancelled ?? "—"} />
        <Stat icon={Clock} label="OPEN SLOTS" value={s?.slotsOpen ?? "—"} />
        <div className="col-span-2 lg:col-span-3">
          <Stat icon={IndianRupee} label="TOTAL REVENUE" value={`₹${s?.revenue ?? 0}`} highlight />
        </div>
      </div>
    </div>
  );
}

/* ───────────── MENTORS ───────────── */
function Mentors() {
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);
  useEffect(() => { api.get("/admin/mentors").then((r) => setRows(r.data)).catch(() => {}); }, []);

  const badge = (st) =>
    st === "approved" ? "text-green-400 border-green-500/40 bg-green-500/10"
    : st === "rejected" ? "text-red-400 border-red-500/40 bg-red-500/10"
    : "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";

  return (
    <div>
      <Head title="Mentors" sub={`${rows.length} mentor accounts on the platform.`} />
      <div className="space-y-3">
        {rows.map((m) => (
          <div key={m._id} className="glass rounded-2xl p-5">
            <div onClick={() => setOpenId(openId === m._id ? null : m._id)}
              className="flex items-start gap-4 cursor-pointer">
              <img
                src={m.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`}
                alt={m.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-white">{m.name}</p>
                  <span className={`text-[10px] tracking-widest uppercase rounded-full px-2.5 py-0.5 border ${badge(m.status)}`}>
                    {m.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 break-all">{m.email}</p>
                <p className="text-sm text-gray-500">
                  {m.designation ? `${m.designation} · ` : ""}{m.company || "—"}
                </p>
              </div>
              <ChevronDown size={18}
                className={`text-gray-500 shrink-0 transition-transform ${openId === m._id ? "rotate-180" : ""}`} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-line">
              <Mini label="Rate" value={`₹${m.pricePerHour}/hr`} />
              <Mini label="Slots made" value={m.slotsCreated} />
              <Mini label="Slots booked" value={m.slotsBooked} />
              <Mini label="Sessions" value={m.sessions} />
              <Mini label="Earnings" value={`₹${m.earnings}`} />
            </div>

            {openId === m._id && <MentorDetail id={m._id} />}
          </div>
        ))}
        {rows.length === 0 && <p className="text-gray-500">No mentors yet.</p>}
      </div>
    </div>
  );
}

function MentorDetail({ id }) {
  const [data, setData] = useState(null);

  const load = () => api.get(`/admin/mentors/${id}`).then((r) => setData(r.data)).catch(() => {});
  useEffect(() => {
    load();
    const iv = setInterval(load, 15000); // live-refresh slots every 15s
    return () => clearInterval(iv);
  }, [id]);

  if (!data) return <p className="text-gray-500 text-sm mt-5 pt-5 border-t border-line">Loading…</p>;

  const p = data.mentor.mentorProfile || {};
  const t = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const slotBadge = (st) =>
    st === "available" ? "text-green-400 border-green-500/40 bg-green-500/10"
    : st === "booked" ? "text-brand-400 border-brand-500/40 bg-brand-500/10"
    : "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";

  return (
    <div className="mt-5 pt-5 border-t border-line space-y-6">
      <div>
        <p className="text-xs tracking-widest text-brand-400 uppercase mb-3">Profile</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <Detail label="Phone" value={p.phone} />
          <Detail label="Location" value={p.location} />
          <Detail label="LinkedIn" value={p.linkedIn} link />
          <Detail label="College" value={p.college} />
          <Detail label="Degree" value={p.degree} />
          <Detail label="Branch" value={p.branch} />
          <Detail label="Graduation Year" value={p.graduationYear} />
          <Detail label="Company" value={p.company} />
          <Detail label="Designation" value={p.designation} />
          <Detail label="Experience" value={p.experience != null ? `${p.experience} yrs` : ""} />
          <Detail label="Price/hour" value={p.pricePerHour ? `₹${p.pricePerHour}` : ""} />
          <Detail label="Skills" value={(p.skills || []).join(", ")} />
          <Detail label="Sessions done" value={data.sessions} />
          <Detail label="Cancelled" value={data.cancelled} />
          <Detail label="Terms accepted" value={p.termsAccepted ? "Yes" : "No"} />
        </div>
        {p.verificationDoc && (
          <a href={p.verificationDoc} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 mt-3 hover:underline">
            <FileText size={12} /> View verification document
          </a>
        )}
        {p.bio && (
          <div className="mt-4">
            <p className="text-xs tracking-widest text-gray-500 mb-1">BIO</p>
            <p className="text-gray-300 text-sm">{p.bio}</p>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs tracking-widest text-brand-400 uppercase mb-3">
          Slots ({data.slots.length}) · live
        </p>
        {data.slots.length === 0 ? (
          <p className="text-gray-500 text-sm">No slots created yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.slots.map((s) => (
              <div key={s._id}
                className="flex items-center justify-between gap-2 bg-card2 border border-line rounded-xl px-4 py-2.5 text-sm">
                <span className="text-gray-300">
                  {s.date} · {t(s.startTime)} · {s.durationMinutes}min · ₹{s.price}
                </span>
                <span className={`text-[10px] tracking-widest uppercase rounded-full px-2.5 py-0.5 border shrink-0 ${slotBadge(s.status)}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── STUDENTS ───────────── */
function Students() {
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);
  useEffect(() => { api.get("/admin/students").then((r) => setRows(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <Head title="Students" sub={`${rows.length} student accounts registered.`} />
      <div className="space-y-3">
        {rows.map((s) => (
          <div key={s._id} className="glass rounded-2xl p-5">
            <div onClick={() => setOpenId(openId === s._id ? null : s._id)}
              className="flex items-start gap-4 cursor-pointer">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`}
                alt={s.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-white">{s.name}</p>
                  {!s.profileCompleted && (
                    <span className="text-[10px] tracking-widest uppercase rounded-full px-2.5 py-0.5 border text-gray-400 border-line">
                      profile incomplete
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 break-all">{s.email}</p>
                <p className="text-sm text-gray-500">
                  {[s.college, s.year, s.fieldOfInterest].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <ChevronDown size={18}
                className={`text-gray-500 shrink-0 transition-transform ${openId === s._id ? "rotate-180" : ""}`} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-line">
              <Mini label="Sessions" value={s.sessions} />
              <Mini label="Cancelled" value={s.cancelled} />
              <Mini label="Spent" value={`₹${s.spent}`} />
            </div>

            {openId === s._id && <StudentDetail id={s._id} />}
          </div>
        ))}
        {rows.length === 0 && <p className="text-gray-500">No students yet.</p>}
      </div>
    </div>
  );
}

function StudentDetail({ id }) {
  const [data, setData] = useState(null);

  const load = () => api.get(`/admin/students/${id}`).then((r) => setData(r.data)).catch(() => {});
  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [id]);

  if (!data) return <p className="text-gray-500 text-sm mt-5 pt-5 border-t border-line">Loading…</p>;

  const sp = data.student.studentProfile || {};
  const c = data.counts;
  const t = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
  const badge = (st) =>
    st === "confirmed" ? "text-green-400 border-green-500/40 bg-green-500/10"
    : st === "cancelled" ? "text-red-400 border-red-500/40 bg-red-500/10"
    : st === "completed" ? "text-brand-400 border-brand-500/40 bg-brand-500/10"
    : "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";

  return (
    <div className="mt-5 pt-5 border-t border-line space-y-6">
      <div>
        <p className="text-xs tracking-widest text-brand-400 uppercase mb-3">Profile</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <Detail label="College" value={sp.college} />
          <Detail label="Year" value={sp.year} />
          <Detail label="Field of interest" value={sp.fieldOfInterest} />
          <Detail label="Career goal" value={sp.careerGoal} />
          <Detail label="Email verified" value={data.student.isVerified ? "Yes" : "No"} />
          <Detail label="Joined" value={new Date(data.student.createdAt).toLocaleDateString("en-IN")} />
        </div>
        {sp.about && (
          <div className="mt-4">
            <p className="text-xs tracking-widest text-gray-500 mb-1">ABOUT</p>
            <p className="text-gray-300 text-sm">{sp.about}</p>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs tracking-widest text-brand-400 uppercase mb-3">Activity</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Mini label="Confirmed" value={c.confirmed} />
          <Mini label="Completed" value={c.completed} />
          <Mini label="Cancelled" value={c.cancelled} />
          <Mini label="Not attended" value={c.missed} />
          <Mini label="Total spent" value={`₹${c.spent}`} />
        </div>
      </div>

      <div>
        <p className="text-xs tracking-widest text-brand-400 uppercase mb-3">
          Bookings ({data.bookings.length}) · live
        </p>
        {data.bookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No bookings yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.bookings.map((b) => (
              <div key={b._id} className="bg-card2 border border-line rounded-xl px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-white font-semibold">{b.mentor?.name || "—"}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">₹{b.amount}</span>
                    <span className={`text-[10px] tracking-widest uppercase rounded-full px-2.5 py-0.5 border ${badge(b.status)}`}>
                      {b.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 mt-1">
                  {b.mentor?.mentorProfile?.company || "—"} · {b.slot?.date || "—"} · {t(b.slot?.startTime)} · {b.slot?.durationMinutes || "—"} min
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
/* ───────────── BOOKINGS ───────────── */
function Bookings() {
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);
  useEffect(() => { api.get("/admin/bookings").then((r) => setRows(r.data)).catch(() => {}); }, []);
  const badge = (st) =>
    st === "confirmed" ? "text-green-400 border-green-500/40 bg-green-500/10"
    : st === "cancelled" ? "text-red-400 border-red-500/40 bg-red-500/10"
    : st === "completed" ? "text-brand-400 border-brand-500/40 bg-brand-500/10"
    : "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
  const t = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
  return (
    <div>
      <Head title="Bookings" sub={`${rows.length} most recent bookings.`} />
      <div className="space-y-3">
        {rows.map((b) => (
          <div key={b._id} className="glass rounded-2xl p-5">
            <div onClick={() => setOpenId(openId === b._id ? null : b._id)}
              className="flex items-start justify-between gap-3 flex-wrap cursor-pointer">
              <div>
                <p className="font-bold text-white">
                  {b.student?.name || "—"} <span className="text-gray-500 font-normal">→</span> {b.mentor?.name || "—"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {b.slot?.date || "—"} · {t(b.slot?.startTime)} · {b.slot?.durationMinutes || "—"} min
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-white">₹{b.amount}</span>
                <span className={`text-[10px] tracking-widest uppercase rounded-full px-2.5 py-0.5 border ${badge(b.status)}`}>
                  {b.status}
                </span>
                <ChevronDown size={18}
                  className={`text-gray-500 shrink-0 transition-transform ${openId === b._id ? "rotate-180" : ""}`} />
              </div>
            </div>
            {openId === b._id && (
              <div className="mt-5 pt-5 border-t border-line grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <Detail label="Student" value={b.student?.name} />
                <Detail label="Student email" value={b.student?.email} />
                <Detail label="Mentor" value={b.mentor?.name} />
                <Detail label="Mentor email" value={b.mentor?.email} />
                <Detail label="Date" value={b.slot?.date} />
                <Detail label="Time" value={t(b.slot?.startTime)} />
                <Detail label="Duration" value={b.slot?.durationMinutes ? `${b.slot.durationMinutes} min` : ""} />
                <Detail label="Amount" value={`₹${b.amount}`} />
                <Detail label="Status" value={b.status} />
                <Detail label="Payment ID" value={b.razorpayPaymentId} />
                <Detail label="Order ID" value={b.razorpayOrderId} />
                <Detail label="Booked on" value={b.createdAt ? new Date(b.createdAt).toLocaleString("en-IN") : ""} />
                <Detail label="Meeting link" value={b.meetingLink} link />
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="text-gray-500">No bookings yet.</p>}
      </div>
    </div>
  );
}

/* ───────────── APPROVAL QUEUE (unchanged logic) ───────────── */
function Queue() {
  const [pending, setPending] = useState([]);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(null);

  const load = () => api.get("/admin/mentors/pending").then((r) => setPending(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const review = async (id, action) => {
    setMsg("");
    try {
      const r = await api.patch(`/admin/mentors/${id}`, { action });
      setMsg(r.data.message);
      load();
    } catch (e) { setMsg(e.response?.data?.message || "Failed"); }
  };

  return (
    <div>
      <Head title="Approvals" sub="Review mentor applications and approve accounts." />
      {msg && <p className="text-green-400 text-sm mb-4">{msg}</p>}

      <div className="space-y-4">
        {pending.length === 0 && <p className="text-gray-500">No mentors pending review. 🎉</p>}
        {pending.map((m, i) => (
          <motion.div key={m._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }} className="glass rounded-2xl p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {m.mentorProfile?.photo ? (
                  <img src={m.mentorProfile.photo} alt={m.name} className="w-[52px] h-[52px] rounded-2xl object-cover" />
                ) : (
                  <div className="w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                    {m.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white">{m.name}</p>
                  <p className="text-sm text-gray-400 break-all">{m.email}</p>
                  {m.mentorProfile?.verificationDoc ? (
                    <a href={m.mentorProfile.verificationDoc} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-brand-400 mt-1 hover:underline">
                      <FileText size={12} /> View verification document
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">No document uploaded</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <button onClick={() => setOpen(open === m._id ? null : m._id)}
                  className="px-3 py-2.5 rounded-xl border border-line text-gray-400 text-sm flex items-center gap-1.5 hover:text-white">
                  <ChevronDown size={15} className={`transition-transform ${open === m._id ? "rotate-180" : ""}`} />
                  Details
                </button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => review(m._id, "reject")}
                  className="px-4 py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold flex items-center gap-1.5">
                  <X size={15} /> Reject
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => review(m._id, "approve")}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-brand-600 to-brand-400 glow flex items-center gap-1.5">
                  <ShieldCheck size={15} /> Approve
                </motion.button>
              </div>
            </div>

            {open === m._id && (
              <div className="mt-5 pt-5 border-t border-line grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <Detail label="Phone" value={m.mentorProfile?.phone} />
                <Detail label="Location" value={m.mentorProfile?.location} />
                <Detail label="LinkedIn" value={m.mentorProfile?.linkedIn} link />
                <Detail label="College" value={m.mentorProfile?.college} />
                <Detail label="Degree" value={m.mentorProfile?.degree} />
                <Detail label="Branch" value={m.mentorProfile?.branch} />
                <Detail label="Graduation Year" value={m.mentorProfile?.graduationYear} />
                <Detail label="Company" value={m.mentorProfile?.company} />
                <Detail label="Designation" value={m.mentorProfile?.designation} />
                <Detail label="Experience" value={m.mentorProfile?.experience != null ? `${m.mentorProfile.experience} yrs` : ""} />
                <Detail label="Price/hour" value={m.mentorProfile?.pricePerHour ? `₹${m.mentorProfile.pricePerHour}` : ""} />
                <Detail label="Skills" value={(m.mentorProfile?.skills || []).join(", ")} />
                <div className="col-span-1 sm:col-span-2 md:col-span-3">
                  <p className="text-xs tracking-widest text-gray-500 mb-1">BIO</p>
                  <p className="text-gray-300">{m.mentorProfile?.bio || "—"}</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── shared bits ───────────── */
function Mini({ label, value }) {
  return (
    <div>
      <p className="text-[10px] tracking-widest text-gray-500">{label.toUpperCase()}</p>
      <p className="text-white font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function Detail({ label, value, link }) {
  return (
    <div>
      <p className="text-xs tracking-widest text-gray-500 mb-0.5">{label.toUpperCase()}</p>
      {link && value ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline break-all">{value}</a>
      ) : (
        <p className="text-gray-300 break-all">{value || "—"}</p>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, highlight }) {
  return (
    <motion.div whileHover={{ y: -4 }}
      className={`glass rounded-2xl p-5 md:p-6 ${highlight ? "glow border-brand-500/50" : ""}`}>
      <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-brand-500/20 flex items-center justify-center mb-3 md:mb-4">
        <Icon className="text-brand-400" size={20} />
      </div>
      <p className="text-[10px] md:text-xs tracking-widest text-gray-400">{label}</p>
      <p className="text-2xl md:text-4xl font-bold text-white mt-1">{value}</p>
    </motion.div>
  );
}