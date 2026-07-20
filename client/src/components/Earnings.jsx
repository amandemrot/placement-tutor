import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { IndianRupee, CalendarDays, Star } from "lucide-react";
import api from "../api";
import { useAuth } from "../AuthContext";

export default function Earnings() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api.get("/bookings/mentor").then((r) => setSessions(r.data)).catch(() => {});
  }, []);

  const thisMonth = sessions
    .filter((b) => new Date(b.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, b) => sum + b.amount, 0);

  const t = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold text-white">Earnings</motion.h1>
      <p className="text-gray-400 mt-2 mb-8">Your verified payouts and session history.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card icon={IndianRupee} label="LIFETIME EARNINGS" value={`₹${user?.mentorProfile?.earnings ?? 0}`} highlight />
        <Card icon={CalendarDays} label="THIS MONTH" value={`₹${thisMonth}`} />
        <Card icon={Star} label="TOTAL SESSIONS" value={sessions.length} />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="grid grid-cols-4 px-6 py-4 text-xs tracking-widest text-gray-400 border-b border-line">
          <span>STUDENT</span><span>DATE</span><span>TIME</span><span className="text-right">AMOUNT</span>
        </div>
        {sessions.length === 0 && (
          <p className="text-center text-gray-500 py-14">No sessions booked yet.</p>
        )}
        {sessions.map((b, i) => (
          <motion.div key={b._id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="grid grid-cols-4 px-6 py-4 items-center border-b border-line/50 text-sm">
            <span className="text-white font-semibold">{b.student?.name}</span>
            <span className="text-gray-300">{b.slot?.date}</span>
            <span className="text-gray-300">{b.slot ? t(b.slot.startTime) : "—"}</span>
            <span className="text-right font-bold text-white">₹{b.amount}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value, highlight }) {
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