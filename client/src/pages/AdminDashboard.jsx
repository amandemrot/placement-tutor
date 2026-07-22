import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Users, AlertTriangle, BadgeCheck, FileText, X, ChevronDown } from "lucide-react";
import Sidebar from "../components/Sidebar";
import api from "../api";

export default function AdminDashboard() {
  const [tab, setTab] = useState("queue");
  const items = [{ key: "queue", label: "Verification Queue", icon: ShieldCheck }];
  return (
    <div className="flex">
      <Sidebar items={items} active={tab} onSelect={setTab} />
      <main className="flex-1 p-4 pt-24 pb-16 md:p-10 md:pt-10 md:h-screen md:overflow-y-auto">
        <Queue />
      </main>
    </div>
  );
}

function Queue() {
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState("");
const [open, setOpen] = useState(null); // mentor _id whose details are expanded
  const load = () => {
    api.get("/admin/mentors/pending").then((r) => setPending(r.data)).catch(() => {});
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
  };
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
      <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold text-white">Verification Queue</motion.h1>
      <p className="text-gray-400 mt-2 mb-8">Review mentor applications and approve accounts.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Stat icon={Users} label="TOTAL MENTORS" value={stats?.mentors ?? "—"} />
        <Stat icon={AlertTriangle} label="PENDING REVIEW" value={pending.length} highlight />
        <Stat icon={BadgeCheck} label="CONFIRMED BOOKINGS" value={stats?.bookings ?? "—"} />
      </div>

      {msg && <p className="text-green-400 text-sm mb-4">{msg}</p>}

      <div className="space-y-4">
        {pending.length === 0 && (
          <p className="text-gray-500">No mentors pending review. 🎉</p>
        )}
        {pending.map((m, i) => (
          <motion.div key={m._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {m.mentorProfile?.photo ? (
                  <img src={m.mentorProfile.photo} alt={m.name}
                    className="w-13 h-13 rounded-2xl object-cover p-0 w-[52px] h-[52px]" />
                ) : (
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold p-3">
                    {m.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white">{m.name}</p>
                  <p className="text-sm text-gray-400">{m.email}</p>
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
              <div className="flex gap-3 items-center">
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
                  <ShieldCheck size={15} /> Verify Mentor Account
                </motion.button>
              </div>
            </div>

            {open === m._id && (
              <div className="mt-5 pt-5 border-t border-line grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
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
                <div className="col-span-2 md:col-span-3">
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
      className={`glass rounded-2xl p-6 ${highlight ? "glow border-brand-500/50" : ""}`}>
      <div className="w-11 h-11 rounded-xl bg-brand-500/20 flex items-center justify-center mb-4">
        <Icon className="text-brand-400" size={20} />
      </div>
      <p className="text-xs tracking-widest text-gray-400">{label}</p>
      <p className="text-4xl font-bold text-white mt-1">{value}</p>
    </motion.div>
  );
}