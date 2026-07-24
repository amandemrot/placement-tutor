import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck, ArrowLeft, GraduationCap, Link2, MapPin,
  MessageSquare, Phone, Mail, Video, Lock, Star, ChevronDown,
  ChevronLeft, ChevronRight, Share2, Heart, Award,
} from "lucide-react";
import api from "../api";
import { BookingModal, AskModal } from "../components/BrowseTutors";

// placeholder intro video — swap this ID, or set mentorProfile.introVideo per mentor
const PLACEHOLDER_VIDEO = "ScMzIvxBSi4";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Section({ title, children, sub }) {
  return (
    <section className="border-t border-line pt-7 md:pt-8">
      <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
      {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function MentorProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const [m, setM] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [booking, setBooking] = useState(false);
  const [ask, setAsk] = useState(false);
  const [others, setOthers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [pickedDate, setPickedDate] = useState(null);
  const [showBio, setShowBio] = useState(false);
  const [resumeTab, setResumeTab] = useState("education");
  const [openSpec, setOpenSpec] = useState(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const othersRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setM(null); setSlots([]); setMonthOffset(0); setPickedDate(null); setShowBio(false);
    api.get(`/mentors/${id}`).then((r) => setM(r.data)).catch(() => setNotFound(true));
    api.get(`/mentors/${id}/slots`).then((r) => setSlots(r.data)).catch(() => {});
    api.get("/mentors")
      .then((r) => setOthers(r.data.filter((x) => x._id !== id).slice(0, 6)))
      .catch(() => {});
  }, [id]);

  const month = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const y = base.getFullYear(), mo = base.getMonth();
    const firstDow = new Date(y, mo, 1).getDay();
    const total = new Date(y, mo + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      const key = `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        key,
        day: d,
        isToday: new Date(y, mo, d).getTime() === today.getTime(),
        past: new Date(y, mo, d) < today,
        times: slots.filter((s) => s.date === key)
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
      });
    }
    return { cells, label: base.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) };
  }, [slots, monthOffset]);

  const pickedTimes = useMemo(
    () => month.cells.find((c) => c && c.key === pickedDate)?.times || [],
    [month, pickedDate]
  );

  if (notFound)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400">
        <p className="mb-4">Mentor not found.</p>
        <button onClick={() => nav("/student")} className="text-brand-400 hover:text-white">← Go back</button>
      </div>
    );

  if (!m)
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;

  const p = m.mentorProfile || {};
  const hints = m.contactHints || {};
  const first = m.name.split(" ")[0];
  const photo = p.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`;
  const videoId = p.introVideo || PLACEHOLDER_VIDEO;
  const skills = p.skills || [];
  const t = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

  const styleTags = [
    p.experience >= 3 ? "Experienced" : "Fresh perspective",
    skills.some((s) => /dsa|problem|competitive/i.test(s)) ? "Problem-solving focused" : null,
    skills.some((s) => /system design|architecture/i.test(s)) ? "Depth over templates" : null,
    skills.some((s) => /interview|hr|mock|resume/i.test(s)) ? "Interview-focused" : null,
    p.company ? `${p.company} insider` : null,
    "Honest feedback",
  ].filter(Boolean);

  const share = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  /* ── shared blocks ── */

  const VideoCard = (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden">
      <div className="aspect-video bg-black">
        <iframe className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={`${m.name} — intro`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          allowFullScreen />
      </div>
      <div className="p-5 md:p-6 border-t border-line">
        <h3 className="text-lg font-bold text-white">{first}'s mentoring style</h3>
        <p className="text-sm text-gray-500 mt-1">Based on this mentor's background and focus areas</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {styleTags.map((tag) => (
            <span key={tag}
              className="text-sm bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded-lg px-3 py-1.5">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const Badges = (
    <div className="space-y-4">
      <div className="flex gap-3">
        <BadgeCheck size={20} className="text-brand-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-brand-400">Verified Mentor</p>
          <p className="text-sm text-gray-400 mt-0.5">
            {first}'s profile and workplace were reviewed by our team before approval.
          </p>
        </div>
      </div>
      {p.experience >= 3 && (
        <div className="flex gap-3">
          <Award size={20} className="text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-400">Senior Mentor</p>
            <p className="text-sm text-gray-400 mt-0.5">{p.experience}+ years of industry experience.</p>
          </div>
        </div>
      )}
      {skills.length > 0 && (
        <div className="flex gap-3">
          <GraduationCap size={20} className="text-brand-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Mentors in</p>
            <p className="text-sm text-gray-300 mt-0.5">{skills.join(", ")}</p>
          </div>
        </div>
      )}
    </div>
  );

  const Schedule = (
    <Section title="Schedule" sub="Times shown in your local timezone.">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setMonthOffset((v) => Math.max(0, v - 1))}
          disabled={monthOffset === 0}
          className="w-9 h-9 rounded-lg border border-line flex items-center justify-center text-gray-300 disabled:opacity-30">
          <ChevronLeft size={17} />
        </button>
        <button onClick={() => setMonthOffset((v) => v + 1)}
          className="w-9 h-9 rounded-lg border border-line flex items-center justify-center text-gray-300">
          <ChevronRight size={17} />
        </button>
        <p className="font-semibold text-white text-sm md:text-base">{month.label}</p>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" /> available
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
        {DAY_NAMES.map((d) => (
          <p key={d} className="text-center text-[11px] md:text-xs font-medium text-gray-300 pb-1">{d}</p>
        ))}
        {month.cells.map((c, i) =>
          c === null ? (
            <div key={`e${i}`} />
          ) : (
            <button key={c.key}
              disabled={c.past || c.times.length === 0}
              onClick={() => setPickedDate(c.key)}
              className={`aspect-square rounded-xl border text-sm flex flex-col items-center justify-center gap-1 transition-colors ${
                pickedDate === c.key
                  ? "border-brand-500 bg-brand-500/20 text-white"
                  : c.times.length && !c.past
                  ? "border-green-500/50 bg-green-500/10 text-green-300 hover:border-green-400"
                  : "border-line text-gray-300"
              } ${c.past ? "opacity-50" : ""} ${c.isToday ? "ring-1 ring-brand-400/60" : ""}`}>
              <span className={c.times.length && !c.past ? "font-bold text-base" : "font-medium"}>{c.day}</span>
              {c.times.length > 0 && !c.past && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              )}
            </button>
          )
        )}
      </div>

      {pickedDate && (
        <div className="mt-6 pt-5 border-t border-line">
          <p className="font-semibold text-white mb-3">
            {new Date(pickedDate + "T00:00:00").toLocaleDateString("en-IN",
              { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="flex flex-wrap gap-2">
            {pickedTimes.map((s) => (
              <button key={s._id} onClick={() => setBooking(true)}
                className="px-4 py-2.5 rounded-xl bg-card2 border border-line text-sm text-gray-200 hover:border-brand-500 transition-colors">
                {t(s.startTime)} <span className="text-gray-500 text-xs">· {s.durationMinutes}m · ₹{s.price}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {slots.length === 0 && (
        <p className="text-gray-500 text-sm mt-5">
          {first} hasn't published any slots yet. Send a question and they'll get back to you.
        </p>
      )}
    </Section>
  );

  const Resume = (
    <Section title="Resume">
      <div className="flex gap-6 border-b border-line -mt-1 overflow-x-auto">
        {[{ key: "education", label: "Education" }, { key: "work", label: "Work experience" }].map((tb) => (
          <button key={tb.key} onClick={() => setResumeTab(tb.key)}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
              resumeTab === tb.key ? "text-white border-brand-500" : "text-gray-500 border-transparent"}`}>
            {tb.label}
          </button>
        ))}
      </div>
      <div className="pt-5">
        {resumeTab === "education" ? (
          p.college || p.degree ? (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-8">
              {p.graduationYear && <p className="text-gray-500 text-sm sm:w-28 shrink-0">{p.graduationYear}</p>}
              <div>
                <p className="text-white font-semibold">{p.college || "College"}</p>
                <p className="text-gray-400 text-sm mt-0.5">
                  {p.degree || "Bachelor of Technology"}{p.branch ? ` — ${p.branch}` : ""}
                </p>
                <p className="text-xs text-brand-400 mt-1.5 flex items-center gap-1">
                  <BadgeCheck size={13} /> Verified by PlacementTutor
                </p>
              </div>
            </div>
          ) : <p className="text-gray-500 text-sm">Not added yet.</p>
        ) : (
          p.company || p.designation ? (
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-8">
              {p.experience && <p className="text-gray-500 text-sm sm:w-28 shrink-0">{p.experience} yrs</p>}
              <div>
                <p className="text-white font-semibold">{p.company || "Company"}</p>
                <p className="text-gray-400 text-sm mt-0.5">{p.designation || "Professional"}</p>
              </div>
            </div>
          ) : <p className="text-gray-500 text-sm">Not added yet.</p>
        )}
      </div>
    </Section>
  );

  const Specialties = skills.length > 0 && (
    <Section title="My specialties">
      <div className="divide-y divide-line border-y border-line">
        {skills.map((s) => (
          <div key={s}>
            <button onClick={() => setOpenSpec(openSpec === s ? null : s)}
              className="w-full flex items-center justify-between py-4 text-left gap-3">
              <span className="text-white font-medium">{s}</span>
              <ChevronDown size={18}
                className={`text-gray-500 shrink-0 transition-transform ${openSpec === s ? "rotate-180" : ""}`} />
            </button>
            {openSpec === s && (
              <p className="text-sm text-gray-400 pb-4 leading-relaxed">
                {first} mentors students on {s} — expect focused 1:1 sessions with honest
                feedback and a concrete plan for what to work on next.
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );

  const About = p.bio && (
    <Section title="About me">
      <p className={`text-gray-300 leading-relaxed whitespace-pre-line ${showBio ? "" : "line-clamp-5"}`}>
        {p.bio}
      </p>
      <button onClick={() => setShowBio((v) => !v)}
        className="text-sm text-brand-400 hover:text-white underline mt-3">
        {showBio ? "Show less" : "Show more"}
      </button>
      {p.linkedIn && (
        <a href={p.linkedIn} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 text-brand-400 hover:text-white text-sm mt-4">
          <Link2 size={15} /> LinkedIn profile
        </a>
      )}
    </Section>
  );

  const Reviews = (
    <Section title="What my students say">
      <div className="rounded-xl bg-card2 border border-line py-10 text-center">
        <MessageSquare size={32} className="mx-auto text-gray-600 mb-3" />
        <p className="text-gray-300">No reviews yet</p>
        <p className="text-gray-500 text-sm mt-1">
          Reviews appear here after students complete a session with {first}.
        </p>
      </div>
    </Section>
  );

  const Others = others.length > 0 && (
    <Section title="You might also like">
      <div className="relative">
      <button
        onClick={() => othersRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
        aria-label="Scroll right"
        className="md:hidden absolute right-0 top-14 z-10 w-9 h-9 rounded-full bg-card border border-line shadow-lg flex items-center justify-center text-gray-200 active:border-brand-500">
        <ChevronRight size={18} />
      </button>
      <div ref={othersRef} className="flex gap-4 overflow-x-auto pb-2">
        {others.map((o) => {
          const op = o.mentorProfile || {};
          return (
            <div key={o._id} onClick={() => nav(`/mentors/${o._id}`)}
              className="w-40 md:w-44 shrink-0 cursor-pointer group">
              <img
                src={op.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(o.name)}`}
                alt={o.name}
                className="w-full h-32 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 object-cover" />
              <p className="font-semibold text-white text-sm mt-2 truncate group-hover:text-brand-400 transition-colors">
                {o.name}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Star size={11} className="text-yellow-400 fill-yellow-400" /> New mentor
              </p>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {op.designation || "Mentor"}{op.company ? ` · ${op.company}` : ""}
              </p>
              <p className="text-sm font-bold text-white mt-1.5">
                ₹{op.pricePerHour}<span className="text-xs text-gray-500 font-normal"> / session</span>
              </p>
            </div>
          );
        })}
      </div>
      </div>
    </Section>
  );

  const Contact = (
    <div className="glass rounded-2xl p-5 md:p-6">
      <h3 className="font-bold text-white mb-4">Contact details</h3>
      <div className="space-y-3">
        {hints.phone && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-card2 border border-line flex items-center justify-center shrink-0">
              <Phone size={15} className="text-brand-400" />
            </div>
            <span className="text-gray-300 text-sm font-mono">{hints.phone}</span>
          </div>
        )}
        {hints.email && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-card2 border border-line flex items-center justify-center shrink-0">
              <Mail size={15} className="text-brand-400" />
            </div>
            <span className="text-gray-300 text-sm font-mono break-all">{hints.email}</span>
          </div>
        )}
        {!hints.phone && !hints.email && <p className="text-gray-500 text-sm">Shared after booking.</p>}
      </div>
      <div className="mt-5 pt-4 border-t border-line">
        {m.unlocked ? (
          <p className="text-xs text-green-400 flex items-start gap-2">
            <BadgeCheck size={13} className="shrink-0 mt-0.5" />
            Unlocked — you have a session booked with {first}.
          </p>
        ) : (
          <p className="text-xs text-gray-500 flex items-start gap-2">
            <Lock size={13} className="shrink-0 mt-0.5" />
            Full contact details and the meeting link are shared once you book a session.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-5 md:py-10 max-w-6xl mx-auto pb-28 md:pb-10">
      <button onClick={() => nav("/student")}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 md:mb-5 text-sm">
        <ArrowLeft size={16} /> Back to mentors
      </button>

      {/* ══════════ MOBILE ══════════ */}
      <div className="md:hidden space-y-7">
        {VideoCard}

        <div>
          <div className="flex items-center gap-4">
            <img src={photo} alt={m.name}
              className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 object-cover shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">{m.name}</h1>
              {p.location && (
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                  <MapPin size={13} /> {p.location}
                </p>
              )}
            </div>
          </div>

          <p className="font-semibold text-white mt-4">
            {p.designation || "Placement mentor"}{p.company ? ` at ${p.company}` : ""}
          </p>
          {skills.length > 0 && (
            <p className="text-sm text-gray-400 mt-1">{skills.slice(0, 4).join(", ")}</p>
          )}

          <div className="flex gap-2.5 mt-4">
            <button onClick={() => setAsk(true)}
              className="flex-1 py-3 rounded-xl border border-line flex items-center justify-center gap-2 text-gray-200 text-sm font-semibold">
              <MessageSquare size={16} /> Ask a question
            </button>
            <button onClick={share}
              className="w-12 shrink-0 rounded-xl border border-line flex items-center justify-center text-gray-300">
              <Share2 size={16} />
            </button>
          </div>
          {copied && <p className="text-xs text-brand-400 mt-2">Link copied</p>}

          <div className="flex gap-7 mt-5 pt-5 border-t border-line">
            <div>
              <p className="text-lg font-bold text-white flex items-center gap-1">
                <Star size={14} className="text-yellow-400 fill-yellow-400" /> New
              </p>
              <p className="text-xs text-gray-500">no reviews</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{p.experience || "—"}</p>
              <p className="text-xs text-gray-500">years exp</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">₹{p.pricePerHour}</p>
              <p className="text-xs text-gray-500">60-min session</p>
            </div>
          </div>
        </div>

        {Badges}
        {About}
        {Reviews}
        {Schedule}
        {Resume}
        {Specialties}

        <Section title="Contact">{Contact}</Section>

        {Others}
      </div>

      {/* ══════════ DESKTOP ══════════ */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-8">
          {VideoCard}

          <div className="flex gap-5">
            <img src={photo} alt={m.name}
              className="w-28 h-28 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 object-cover shrink-0" />
            <div className="min-w-0">
              <h1 className="text-4xl font-bold text-white">{m.name}</h1>
              <p className="text-gray-400 mt-1.5 flex items-center gap-2 flex-wrap text-sm">
                <span>Placement mentor</span>
                {p.location && <><span>·</span><span className="flex items-center gap-1"><MapPin size={13} /> {p.location}</span></>}
              </p>
              {p.designation && (
                <p className="text-gray-300 mt-2 text-sm">
                  {p.designation}{p.company ? ` at ${p.company}` : ""}
                </p>
              )}
            </div>
          </div>

          {Badges}
          {About}
          {Reviews}
          {Schedule}
          {Resume}
          {Specialties}
          {Others}
        </div>

        <div className="space-y-5 sticky top-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 glow">
            <p className="text-3xl font-bold text-white">
              ₹{p.pricePerHour}<span className="text-base text-gray-400 font-normal"> 60-min session</span>
            </p>
            <div className="flex gap-8 mt-4">
              <div>
                <p className="text-lg font-bold text-white flex items-center gap-1">
                  <Star size={15} className="text-yellow-400 fill-yellow-400" /> New
                </p>
                <p className="text-xs text-gray-500">no reviews yet</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{p.experience || "—"}</p>
                <p className="text-xs text-gray-500">years exp</p>
              </div>
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setBooking(true)}
              className="w-full mt-5 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow">
              Book a session
            </motion.button>

            <div className="grid grid-cols-3 gap-2.5 mt-3">
              <button onClick={() => setAsk(true)} title="Ask a question"
                className="py-3 rounded-xl border border-line flex items-center justify-center text-gray-300 hover:border-brand-500 transition-colors">
                <MessageSquare size={17} />
              </button>
              <button onClick={() => setSaved((v) => !v)} title="Save"
                className="py-3 rounded-xl border border-line flex items-center justify-center hover:border-brand-500 transition-colors">
                <Heart size={17} className={saved ? "text-brand-400 fill-brand-400" : "text-gray-300"} />
              </button>
              <button onClick={share} title="Share"
                className="py-3 rounded-xl border border-line flex items-center justify-center text-gray-300 hover:border-brand-500 transition-colors">
                <Share2 size={17} />
              </button>
            </div>
            {copied && <p className="text-xs text-brand-400 mt-2 text-center">Link copied</p>}

            <div className="mt-5 pt-4 border-t border-line flex items-start gap-2">
              <Video size={15} className="text-green-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">
                Online 1:1 video session. Cancel free up to 10 minutes before it starts.
              </p>
            </div>
          </motion.div>

          {Contact}
        </div>
      </div>

      {/* ── MOBILE STICKY BAR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg/95 backdrop-blur border-t border-line px-4 py-3 flex items-center gap-3">
        <button onClick={() => setSaved((v) => !v)}
          className="w-12 h-12 shrink-0 rounded-xl border border-line flex items-center justify-center">
          <Heart size={18} className={saved ? "text-brand-400 fill-brand-400" : "text-gray-300"} />
        </button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setBooking(true)}
          className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow">
          Book a session · ₹{p.pricePerHour}
        </motion.button>
      </div>

      <AnimatePresence>
        {booking && <BookingModal mentor={m} onClose={() => setBooking(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {ask && <AskModal mentor={m} onClose={() => setAsk(false)} />}
      </AnimatePresence>
    </div>
  );
}