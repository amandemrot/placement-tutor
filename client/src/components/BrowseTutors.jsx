import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, BadgeCheck, X, Clock } from "lucide-react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function BrowseTutors() {
  const [mentors, setMentors] = useState([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null); // mentor being booked
  const nav = useNavigate();

  useEffect(() => {
    api.get("/mentors").then((r) => setMentors(r.data)).catch(() => {});
  }, []);

  const filtered = mentors.filter((m) => {
    const s = q.toLowerCase();
    return (
      m.name.toLowerCase().includes(s) ||
      (m.mentorProfile?.company || "").toLowerCase().includes(s) ||
      (m.mentorProfile?.skills || []).some((k) => k.toLowerCase().includes(s))
    );
  });

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-bold text-white">Welcome, student</motion.h1>
      <p className="text-gray-400 mt-2 mb-8">Browse verified mentors from top tech companies and campuses.</p>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, company (Amazon, Microsoft), or skill..."
          className="w-full bg-card border border-line rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-brand-500 transition-colors" />
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500">No approved mentors yet. (Admin must approve mentors first.)</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
        {filtered.map((m, i) => (
          <motion.div key={m._id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }}
            onClick={() => nav(`/mentors/${m._id}`)}
            className="glass rounded-2xl p-6 hover:glow transition-shadow flex flex-col h-full cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={m.mentorProfile?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`}
                alt={m.name}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 object-cover"
              />
              <div>
                <p className="font-bold text-white flex items-center gap-2">
                  {m.name}
                  <span className="flex items-center gap-1 text-[10px] bg-brand-500/20 text-brand-400 border border-brand-500/40 rounded-full px-2 py-0.5">
                    <BadgeCheck size={11} /> Verified
                  </span>
                </p>
                <p className="text-sm text-gray-400">{m.mentorProfile?.company || m.mentorProfile?.college || "Independent Mentor"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-5 min-h-[32px]">
              {(m.mentorProfile?.skills || []).slice(0, 3).map((s) => (
                <span key={s} className="text-xs bg-card2 border border-line rounded-full px-3 py-1 text-gray-300">{s}</span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-auto">
              <p className="text-2xl font-bold text-white">₹{m.mentorProfile?.pricePerHour}<span className="text-sm text-gray-400">/hr</span></p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); setSel(m); }}
                className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow">
                Book Mentorship
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>{sel && <BookingModal mentor={sel} onClose={() => setSel(null)} />}</AnimatePresence>
    </div>
  );
}

export function BookingModal({ mentor, onClose }) {
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);
  const [stage, setStage] = useState("pick"); // pick | pay | done
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/mentors/${mentor._id}/slots`).then((r) => setSlots(r.data)).catch(() => {});
  }, [mentor]);

  const lock = async () => {
    setErr("");
    try {
      const r = await api.post("/bookings/lock", { slotId: slot._id });
      setOrder({ ...r.data.order, keyId: r.data.keyId });
      setStage("pay");
    } catch (e) { setErr(e.response?.data?.message || "Could not lock slot"); }
  };

  const finishBooking = async (payment) => {
    await api.post("/bookings/confirm", {
      slotId: slot._id,
      razorpayOrderId: payment?.razorpay_order_id,
      razorpayPaymentId: payment?.razorpay_payment_id,
      razorpaySignature: payment?.razorpay_signature,
    });
    setStage("done");
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
  };

  const confirm = async () => {
    setErr("");
    try {
      // Dev mode (no keys): skip popup, confirm directly
      if (order?.devMode) {
        await finishBooking(null);
        return;
      }
     // Real Razorpay checkout
      
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "PT-Tutor",
        description: `Session with ${mentor.name}`,
        order_id: order.id,
        handler: async (resp) => {
          try {
            await finishBooking(resp);
          } catch (e) {
            setErr(e.response?.data?.message || "Verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            api.post("/bookings/release", { slotId: slot._id }).catch(() => {});
            setStage("pick");
            setErr("Payment cancelled — slot released.");
          },
        },
        theme: { color: "#7c3aed" },
      });
      rzp.on("payment.failed", (r) =>
        setErr(r.error?.description || "Payment failed")
      );
      rzp.open();
    } catch (e) {
      setErr(e.response?.data?.message || "Payment failed");
    }
  };

  const t = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-7 w-full max-w-lg glow">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white">Book {mentor.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>

        {stage === "pick" && (
          <>
            <p className="text-sm text-gray-400 mb-3">Choose an available slot:</p>
            <div className="max-h-64 overflow-y-auto space-y-2 mb-5">
              {slots.length === 0 && <p className="text-gray-500 text-sm">No available slots.</p>}
              {slots.map((s) => (
                <button key={s._id} onClick={() => setSlot(s)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    slot?._id === s._id ? "border-brand-500 bg-brand-500/15 glow" : "border-line bg-card2"}`}>
                  <span className="flex items-center gap-2 text-sm text-gray-200">
                    <Clock size={15} className="text-brand-400" />
                    {s.date} · {t(s.startTime)} – {t(s.endTime)} · {s.durationMinutes} min
                  </span>
                  <span className="font-bold text-white">₹{s.price}</span>
                </button>
              ))}
            </div>
            {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
            <motion.button whileTap={{ scale: 0.97 }} disabled={!slot} onClick={lock}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-40">
              Continue → Lock Slot
            </motion.button>
          </>
        )}

        {stage === "pay" && (
          <>
            <div className="bg-card2 border border-brand-500/40 rounded-xl p-4 mb-4">
              <p className="text-xs tracking-widest text-brand-400 mb-1">🔒 SLOT LOCKED FOR 7 MINUTES</p>
              <p className="text-gray-300 text-sm">{slot.date} · {t(slot.startTime)} · {slot.durationMinutes} min</p>
              <p className="text-2xl font-bold text-white mt-1">₹{slot.price}</p>
            </div>
            {order?.devMode && (
              <p className="text-xs text-gray-500 mb-3">Dev mode: Razorpay keys not set — payment will be simulated.</p>
            )}
            {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
            <motion.button whileTap={{ scale: 0.97 }} onClick={confirm}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow">
              Pay ₹{slot.price} & Confirm
            </motion.button>
          </>
        )}

        {stage === "done" && (
          <div className="text-center py-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
              className="text-6xl mb-4">🎉</motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h3>
            <p className="text-gray-400 text-sm mb-5">Your meeting link is in My Bookings.</p>
            <button onClick={onClose}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow">Done</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}