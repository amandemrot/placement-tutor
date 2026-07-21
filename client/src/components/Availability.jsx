import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, IndianRupee, CalendarDays, Layers, Trash2, ChevronDown } from "lucide-react";
import api from "../api";
import { useAuth } from "../AuthContext";

export default function Availability() {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("20:00");
  const [dur, setDur] = useState(30);
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = () => api.get("/mentors/my/slots").then((r) => setSlots(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const createSlots = async () => {
    setErr(""); setMsg("");
    try {
      const r = await api.post("/mentors/availability", {
        date, startTime: start, endTime: end, durationMinutes: dur,
      });
      setMsg(`${r.data.message} — see "My Slots" below`);
      setShowSlots(true);
      load();
    } catch (e) { setErr(e.response?.data?.message || "Failed"); }
  };
const [confirmId, setConfirmId] = useState(null);
  const [showSlots, setShowSlots] = useState(false);

  const deleteSlot = async (id) => {
    setErr(""); setMsg("");
    try {
      await api.delete(`/mentors/slots/${id}`);
      setMsg("Slot deleted");
      setConfirmId(null);
      load();
    } catch (e) {
      setErr(e.response?.data?.message || "Could not delete slot");
      setConfirmId(null);
      load();
    }
  };

  const t = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const active = slots.filter((s) => s.status === "available").length;
  const booked = slots.filter((s) => s.status === "booked").length;

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-bold text-white">Split Availability</motion.h1>
      <p className="text-gray-400 mt-2 mb-6">Define a window, divide it into precise bookable slots.</p>

      <div className="flex gap-6 flex-col xl:flex-row">
        <div className="glass rounded-2xl p-6 flex-1">
          <div className="mb-4">
            <label className="text-xs tracking-widest text-gray-400">DATE</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 [color-scheme:dark]" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs tracking-widest text-gray-400">START TIME</label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
                className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-xs tracking-widest text-gray-400">END TIME</label>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
                className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 [color-scheme:dark]" />
            </div>
          </div>
          <label className="text-xs tracking-widest text-gray-400">SLOT DURATION</label>
          <div className="flex gap-3 mt-1 mb-6">
            {[15, 30, 60].map((d) => (
              <button key={d} onClick={() => setDur(d)}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  dur === d ? "bg-brand-500 text-white glow" : "bg-card2 text-gray-400 border border-line"}`}>
                {d} min
              </button>
            ))}
          </div>
          {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
          {msg && <p className="text-green-400 text-sm mb-3">{msg}</p>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={createSlots} disabled={!date}
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-40 flex items-center justify-center gap-2">
            <Layers size={18} /> Split & Create Slots
          </motion.button>

          <button onClick={() => setShowSlots(!showSlots)}
            className="md:hidden w-full mt-4 flex items-center justify-between px-4 py-3 rounded-xl bg-card2 border border-line text-sm font-semibold text-gray-300">
            <span>My Slots ({slots.length})</span>
            <ChevronDown size={16} className={`transition-transform ${showSlots ? "rotate-180" : ""}`} />
          </button>

          <div className={`mt-4 md:mt-6 space-y-2 md:max-h-56 md:overflow-y-auto ${showSlots ? "block" : "hidden"} md:block`}>
            {slots.map((s) => (
              <div key={s._id} className="flex items-center justify-between gap-2 bg-card2 border border-line rounded-xl px-4 py-2.5 text-sm">
                <span className="text-gray-300">{s.date} · {t(s.startTime)} · {s.durationMinutes}min · ₹{s.price}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] tracking-widest uppercase rounded-full px-2.5 py-0.5 border ${
                    s.status === "available" ? "text-green-400 border-green-500/40 bg-green-500/10"
                    : s.status === "booked" ? "text-brand-400 border-brand-500/40 bg-brand-500/10"
                    : "text-yellow-400 border-yellow-500/40 bg-yellow-500/10"}`}>{s.status}</span>
                  {s.status === "available" && (
                    confirmId === s._id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteSlot(s._id)}
                          className="text-[10px] font-semibold text-red-400 border border-red-500/40 bg-red-500/10 rounded-full px-2 py-0.5">
                          Delete
                        </button>
                        <button onClick={() => setConfirmId(null)}
                          className="text-[10px] text-gray-500 hover:text-gray-300 px-1">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(s._id)} title="Delete slot"
                        className="text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full xl:w-80 space-y-5">
          <StatCard icon={IndianRupee} label="VERIFIED EARNINGS" value={`₹${user?.mentorProfile?.earnings ?? 0}`} highlight />
          <StatCard icon={CalendarDays} label="ACTIVE SLOTS" value={active} />
          <StatCard icon={Layers} label="SESSIONS BOOKED" value={booked} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }) {
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