import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, BadgeCheck, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getFavorites, toggleFavorite } from "../favorites";

export default function SavedMentors() {
  const [mentors, setMentors] = useState([]);
  const [favIds, setFavIds] = useState(getFavorites());
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/mentors").then((r) => setMentors(r.data)).catch(() => {}).finally(() => setLoading(false));
    const sync = () => setFavIds(getFavorites());
    window.addEventListener("pt_favorites_changed", sync);
    return () => window.removeEventListener("pt_favorites_changed", sync);
  }, []);

  const remove = (e, id) => {
    e.stopPropagation();
    toggleFavorite(id);
    setFavIds(getFavorites());
  };

  const saved = mentors.filter((m) => favIds.includes(m._id));

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Saved Mentors</h1>
      <p className="text-gray-400 text-sm md:text-base mb-6 md:mb-8">Mentors you've hearted for later.</p>

      {saved.length === 0 ? (
        <div className="bg-card2 border border-line rounded-2xl p-10 text-center text-gray-400">
          <Heart size={32} className="mx-auto text-gray-600 mb-3" />
          <p>No saved mentors yet.</p>
          <p className="text-gray-600 text-sm mt-1">Tap the heart on any mentor to save them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {saved.map((m) => {
            const p = m.mentorProfile || {};
            const photo = p.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`;
            return (
              <motion.div key={m._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">

                <div onClick={() => nav(`/mentors/${m._id}`)}
                  className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer group">
                  <img src={photo} alt={m.name}
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span className="truncate group-hover:text-brand-400 transition-colors">{m.name}</span>
                      <BadgeCheck size={15} className="text-brand-400 shrink-0" />
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5 truncate">
                      <Briefcase size={13} className="text-brand-400 shrink-0" />
                      {p.designation || "Mentor"}{p.company ? ` · ${p.company}` : ""}
                    </p>
                    <p className="text-sm font-bold text-white mt-1">₹{p.pricePerHour}<span className="text-xs text-gray-500 font-normal"> / session</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 sm:flex-col sm:items-end">
                  <button onClick={() => nav(`/mentors/${m._id}`)}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow text-center">
                    View profile
                  </button>
                  <button onClick={(e) => remove(e, m._id)} title="Remove from saved"
                    className="w-11 h-11 sm:w-9 sm:h-9 shrink-0 rounded-lg border border-line flex items-center justify-center hover:border-brand-500 transition-colors">
                    <Heart size={17} className="text-brand-400 fill-brand-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}