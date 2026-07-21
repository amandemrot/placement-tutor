import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck, ArrowLeft, Briefcase, GraduationCap, Link2, MapPin,
  Home, MessageSquare, Phone, Mail, Video, Lock, Star,
} from "lucide-react";
import api from "../api";
import { BookingModal } from "../components/BrowseTutors";

export default function MentorProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const [m, setM] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [booking, setBooking] = useState(false);
  const [tab, setTab] = useState("intro");

  useEffect(() => {
    api.get(`/mentors/${id}`).then((r) => setM(r.data)).catch(() => setNotFound(true));
  }, [id]);

  if (notFound)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400">
        <p className="mb-4">Mentor not found.</p>
        <button onClick={() => nav(-1)} className="text-brand-400 hover:text-white">← Go back</button>
      </div>
    );

  if (!m)
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;

  const p = m.mentorProfile || {};
  const hints = m.contactHints || {};

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 max-w-6xl mx-auto">
      <button onClick={() => nav(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
        <ArrowLeft size={16} /> Back to mentors
      </button>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* ── LEFT COLUMN (main) ── */}
        <div className="md:col-span-2 space-y-6">
          {/* Header card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 md:p-8 glow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <img
                src={p.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`}
                alt={m.name}
                className="w-28 h-28 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 object-cover"
              />
              <div className="flex-1">
                <p className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 flex-wrap">
                  {m.name}
                  <span className="flex items-center gap-1 text-[11px] bg-brand-500/20 text-brand-400 border border-brand-500/40 rounded-full px-2 py-0.5">
                    <BadgeCheck size={12} /> Verified
                  </span>
                </p>
                <p className="text-gray-400 mt-1">
                  {p.designation ? `${p.designation} · ` : ""}{p.company || p.college || "Independent Mentor"}
                </p>
                {p.location && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin size={13} /> {p.location}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  New mentor · Reviews coming soon
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex border-b border-line">
              {[
                { key: "intro", label: "Introduction", icon: Home },
                { key: "reviews", label: "Reviews", icon: MessageSquare },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                    tab === key
                      ? "text-white border-brand-500"
                      : "text-gray-500 border-transparent hover:text-gray-300"}`}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            <div className="p-6 md:p-8">
              {tab === "intro" ? (
                <div className="space-y-8">
                  {p.bio && (
                    <section>
                      <h2 className="text-lg font-bold text-white mb-3">A brief introduction</h2>
                      <p className="text-gray-300 leading-relaxed">{p.bio}</p>
                      {p.linkedIn && (
                        <a href={p.linkedIn} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-2 text-brand-400 hover:text-white text-sm mt-3">
                          <Link2 size={15} /> LinkedIn profile
                        </a>
                      )}
                    </section>
                  )}

                  {(p.company || p.designation || p.experience) && (
                    <section>
                      <h2 className="text-lg font-bold text-white mb-3">Experience</h2>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-lg bg-card2 border border-line flex items-center justify-center">
                          <Briefcase size={17} className="text-brand-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{p.designation || "Professional"}</p>
                          <p className="text-gray-400 text-sm">{p.company}</p>
                          {p.experience && <p className="text-gray-500 text-sm mt-1">{p.experience} years of experience</p>}
                        </div>
                      </div>
                    </section>
                  )}

                  {(p.college || p.degree) && (
                    <section>
                      <h2 className="text-lg font-bold text-white mb-3">Education</h2>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-lg bg-card2 border border-line flex items-center justify-center">
                          <GraduationCap size={17} className="text-brand-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{p.degree || "Graduate"}{p.branch ? ` — ${p.branch}` : ""}</p>
                          <p className="text-gray-400 text-sm">{p.college}</p>
                          {p.graduationYear && <p className="text-gray-500 text-sm mt-1">Class of {p.graduationYear}</p>}
                        </div>
                      </div>
                    </section>
                  )}

                  {(p.skills || []).length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold text-white mb-3">Skills</h2>
                      <div className="flex flex-wrap gap-2">
                        {p.skills.map((s) => (
                          <span key={s} className="text-sm bg-card2 border border-line rounded-full px-4 py-1.5 text-gray-300">{s}</span>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <MessageSquare size={36} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">No reviews yet.</p>
                  <p className="text-gray-600 text-sm mt-1">Be the first to book a session with {m.name.split(" ")[0]}.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-6 md:sticky md:top-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 glow">
            <p className="text-sm text-gray-400">Starting from</p>
            <p className="text-4xl font-bold text-white mt-1">₹{p.pricePerHour}<span className="text-base text-gray-400">/hr</span></p>
            <div className="flex items-center gap-2 mt-3 text-sm text-green-400">
              <Video size={15} /> Online 1:1 session
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setBooking(true)}
              className="w-full mt-5 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow">
              Book Mentorship
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Contact details</h3>
            <div className="space-y-3">
              {hints.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-card2 border border-line flex items-center justify-center">
                    <Phone size={15} className="text-brand-400" />
                  </div>
                  <span className="text-gray-300 text-sm font-mono">{hints.phone}</span>
                </div>
              )}
              {hints.email && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-card2 border border-line flex items-center justify-center">
                    <Mail size={15} className="text-brand-400" />
                  </div>
                  <span className="text-gray-300 text-sm font-mono break-all">{hints.email}</span>
                </div>
              )}
              {!hints.phone && !hints.email && (
                <p className="text-gray-500 text-sm">Shared after booking.</p>
              )}
            </div>
            <div className="mt-5 pt-4 border-t border-line">
              <p className="text-xs text-gray-500 flex items-start gap-2">
                <Lock size={13} className="shrink-0 mt-0.5" />
                Full contact details and the meeting link are shared once you book a session.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {booking && <BookingModal mentor={m} onClose={() => setBooking(false)} />}
      </AnimatePresence>
    </div>
  );
}