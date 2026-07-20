import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Video } from "lucide-react";
import api from "../api";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("upcoming"); // upcoming | past

  const load = () => api.get("/bookings/my").then((r) => setBookings(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    setErr("");
    try {
      await api.post("/bookings/cancel", { bookingId: id });
      load();
    } catch (e) { setErr(e.response?.data?.message || "Could not cancel"); }
  };

  const t = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const isPast = (b) => !b.slot || new Date(b.slot.startTime).getTime() < Date.now();
  const canCancel = (b) =>
    b.status === "confirmed" &&
    b.slot &&
    Date.now() < new Date(b.slot.startTime).getTime() - 10 * 60000;

  const upcoming = bookings.filter((b) => !isPast(b));
  const past = bookings.filter((b) => isPast(b));
  const shown = tab === "upcoming" ? upcoming : past;

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-bold text-white">My Bookings</motion.h1>
      <p className="text-gray-400 mt-2 mb-6">Your scheduled mentorship sessions.</p>
      {err && <p className="text-red-400 text-sm mb-4">{err}</p>}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("upcoming")}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
            tab === "upcoming" ? "bg-brand-500 text-white glow" : "bg-card2 text-gray-400 border border-line"}`}>
          Upcoming ({upcoming.length})
        </button>
        <button onClick={() => setTab("past")}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
            tab === "past" ? "bg-brand-500 text-white glow" : "bg-card2 text-gray-400 border border-line"}`}>
          Past ({past.length})
        </button>
      </div>

     <div className="glass rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-5 px-6 py-4 text-xs tracking-widest text-gray-400 border-b border-line">
          <span>MENTOR</span><span>DATE</span><span>TIME</span><span>STATUS</span><span className="text-right">MEETING</span>
        </div>
        {shown.length === 0 && (
          <p className="text-center text-gray-500 py-14">
            {tab === "upcoming" ? "No upcoming sessions." : "No past sessions yet."}
          </p>
        )}
        {shown.map((b, i) => (
          <motion.div key={b._id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="border-b border-line/50 text-sm px-4 py-4 md:px-6 md:grid md:grid-cols-5 md:items-center">
            {/* Mobile: stacked card / Desktop: table row */}
            <div className="flex items-center justify-between md:block">
              <span className="flex items-center gap-2.5">
                <img
                  src={b.mentor?.mentorProfile?.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(b.mentor?.name || "M")}`}
                  alt={b.mentor?.name}
                  className="w-8 h-8 rounded-full object-cover border border-line"
                />
                <span className="text-white font-semibold">{b.mentor?.name}</span>
              </span>
              <span className={`md:hidden text-[10px] tracking-widest rounded-full px-3 py-1 border uppercase ${
                b.status === "confirmed"
                  ? "bg-green-500/15 text-green-400 border-green-500/40"
                  : b.status === "cancelled"
                  ? "bg-red-500/15 text-red-400 border-red-500/40"
                  : "bg-yellow-500/15 text-yellow-400 border-yellow-500/40"}`}>
                {b.status}
              </span>
            </div>
            <span className="block text-gray-300 mt-1 md:mt-0">
              {b.slot?.date}
              <span className="md:hidden"> · {b.slot ? `${t(b.slot.startTime)} · ${b.slot.durationMinutes}min` : "—"}</span>
            </span>
            <span className="hidden md:block text-gray-300">{b.slot ? `${t(b.slot.startTime)} · ${b.slot.durationMinutes}min` : "—"}</span>
            <span className="hidden md:block">
              <span className={`text-[10px] tracking-widest rounded-full px-3 py-1 border uppercase ${
                b.status === "confirmed"
                  ? "bg-green-500/15 text-green-400 border-green-500/40"
                  : b.status === "cancelled"
                  ? "bg-red-500/15 text-red-400 border-red-500/40"
                  : "bg-yellow-500/15 text-yellow-400 border-yellow-500/40"}`}>
                {b.status}
              </span>
            </span>
            {(b.meetingLink && b.status === "confirmed" && !isPast(b)) || canCancel(b) ? (
              <span className="flex items-center gap-4 mt-3 md:mt-0 md:justify-end">
                {b.meetingLink && b.status === "confirmed" && !isPast(b) && (
                  <a href={b.meetingLink} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-brand-400 hover:text-white transition-colors font-semibold">
                    <Video size={15} /> Join
                  </a>
                )}
                {canCancel(b) && (
                  <button onClick={() => cancel(b._id)}
                    className="text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/40 rounded-lg px-3 py-1.5">
                    Cancel
                  </button>
                )}
              </span>
            ) : (
              <span className="hidden md:block" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}