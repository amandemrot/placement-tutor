import { useState } from "react";
import { GraduationCap, LogOut, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../AuthContext";

export default function Sidebar({ items, active, onSelect }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const pick = (key) => {
    onSelect(key);
    setOpen(false); // close drawer after choosing on mobile
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center gap-3 px-4 py-3 glass border-b border-line">
        <button onClick={() => setOpen(true)} className="text-gray-300 hover:text-white">
          <Menu size={22} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
          <GraduationCap className="text-white" size={16} />
        </div>
        <p className="font-bold text-white text-sm">PlacementTutor</p>
      </div>

      {/* Backdrop on mobile when drawer open */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar / drawer */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 min-h-screen glass border-r border-line p-5 flex flex-col
        transform transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center glow">
            <GraduationCap className="text-white" size={22} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white leading-tight">PlacementTutor</p>
            <p className="text-[10px] tracking-widest text-gray-400">MENTORSHIP BOOKING</p>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="bg-card2 border border-line rounded-xl p-4 mb-6 flex items-center gap-3">
          {user?.mentorProfile?.photo && (
            <img src={user.mentorProfile.photo} alt={user?.name}
              className="w-11 h-11 rounded-xl object-cover shrink-0" />
          )}
          <div>
            <p className="text-xs text-gray-400">Signed in as</p>
            <p className="font-semibold text-white">{user?.name}</p>
            <span className="inline-block mt-1 text-[10px] tracking-widest bg-brand-500/20 text-brand-400 border border-brand-500/40 rounded px-2 py-0.5 uppercase">
              {user?.role}
            </span>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          {items.map((it) => (
            <motion.button key={it.key} whileTap={{ scale: 0.97 }} onClick={() => pick(it.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                active === it.key
                  ? "bg-brand-500/20 text-white border border-brand-500/50 glow"
                  : "text-gray-400 hover:text-white"}`}>
              <it.icon size={18} /> {it.label}
            </motion.button>
          ))}
        </nav>
        <button onClick={logout}
          className="flex items-center gap-2 justify-center py-3 rounded-xl border border-line text-gray-400 hover:text-white transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </aside>
    </>
  );
}