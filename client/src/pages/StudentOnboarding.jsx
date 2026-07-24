import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import api from "../api";
import { useAuth } from "../AuthContext";
import { FIELDS, YEARS, GOALS } from "./Onboarding";

const COMPANIES = ["Product-based (FAANG, etc.)", "Service-based (TCS, Infosys)", "Core / PSU", "Startups", "Finance / Quant"];
const OBJECTIVES = ["Campus placements", "Off-campus roles", "Internships", "Higher studies / GATE"];
const TIMELINES = ["1-4 weeks", "1-3 months", "3-6 months", "Just exploring"];
const LEVELS = ["I'm just starting", "I know the basics", "I can solve mediums", "I'm interview ready"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIMES = ["Morning", "Afternoon", "Evening", "Night"];

/* ---------- illustrations ---------- */
const Art = ({ step }) => {
  const P = "#7c3aed", L = "#a78bfa", D = "#4c1d95", Y = "#fbbf24";
  const art = [
    // 0 goal — target
    <g key="0">
      <circle cx="100" cy="100" r="62" fill={L} opacity=".25" />
      <circle cx="100" cy="100" r="42" fill={P} opacity=".5" />
      <circle cx="100" cy="100" r="20" fill={P} />
      <path d="M60 150 L140 55" stroke={Y} strokeWidth="7" strokeLinecap="round" />
      <path d="M140 55 l-16 3 l6 14 z" fill={Y} />
    </g>,
    // 1 timeline — bars
    <g key="1">
      <rect x="45" y="120" width="24" height="46" rx="5" fill={L} opacity=".5" />
      <rect x="80" y="92" width="24" height="74" rx="5" fill={P} opacity=".7" />
      <rect x="115" y="64" width="24" height="102" rx="5" fill={P} />
      <path d="M38 168 h124" stroke={D} strokeWidth="5" strokeLinecap="round" />
      <circle cx="127" cy="48" r="9" fill={Y} />
    </g>,
    // 2 companies — buildings
    <g key="2">
      <rect x="42" y="86" width="46" height="82" rx="6" fill={L} opacity=".45" />
      <rect x="96" y="56" width="52" height="112" rx="6" fill={P} opacity=".75" />
      {[70, 92, 114, 136].map((y) => (
        <g key={y}>
          <rect x="52" y={y} width="10" height="10" rx="2" fill="#fff" opacity=".55" />
          <rect x="70" y={y} width="10" height="10" rx="2" fill="#fff" opacity=".35" />
          <rect x="106" y={y - 12} width="11" height="11" rx="2" fill="#fff" opacity=".6" />
          <rect x="127" y={y - 12} width="11" height="11" rx="2" fill="#fff" opacity=".4" />
        </g>
      ))}
    </g>,
    // 3 year — graduation cap
    <g key="3">
      <path d="M100 58 L172 92 L100 126 L28 92 Z" fill={P} />
      <path d="M100 126 L100 152" stroke={Y} strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="156" r="8" fill={Y} />
      <path d="M62 106 v30 c0 14 76 14 76 0 v-30" fill={L} opacity=".55" />
    </g>,
    // 4 skills — arrow up
    <g key="4">
      <circle cx="100" cy="108" r="60" fill={L} opacity=".2" />
      <path d="M64 132 L100 78 L136 132" stroke={P} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M100 78 v66" stroke={Y} strokeWidth="10" strokeLinecap="round" />
    </g>,
    // 5 level — books
    <g key="5">
      <rect x="48" y="128" width="108" height="20" rx="4" fill={D} />
      <rect x="54" y="106" width="96" height="22" rx="4" fill={P} />
      <rect x="60" y="84" width="84" height="22" rx="4" fill={L} opacity=".7" />
      <rect x="92" y="84" width="12" height="22" fill={Y} />
    </g>,
    // 6 availability — calendar
    <g key="6">
      <rect x="46" y="60" width="108" height="104" rx="10" fill={L} opacity=".3" />
      <rect x="46" y="60" width="108" height="26" rx="10" fill={P} />
      <circle cx="70" cy="54" r="6" fill={D} />
      <circle cx="130" cy="54" r="6" fill={D} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <circle key={`${r}${c}`} cx={68 + c * 22} cy={106 + r * 22} r="5"
            fill={r === 1 && c === 2 ? Y : P} opacity={r === 1 && c === 2 ? 1 : 0.5} />
        ))
      )}
    </g>,
    // 7 budget — coins
    <g key="7">
      <ellipse cx="100" cy="146" rx="46" ry="14" fill={D} />
      <rect x="54" y="112" width="92" height="34" fill={P} />
      <ellipse cx="100" cy="112" rx="46" ry="14" fill={L} />
      <ellipse cx="100" cy="112" rx="26" ry="8" fill={Y} opacity=".8" />
    </g>,
    // 8 about — id card
    <g key="8">
      <rect x="48" y="72" width="104" height="76" rx="10" fill={L} opacity=".35" />
      <circle cx="80" cy="110" r="16" fill={P} />
      <rect x="104" y="96" width="36" height="8" rx="4" fill={P} opacity=".8" />
      <rect x="104" y="110" width="36" height="8" rx="4" fill={P} opacity=".5" />
      <rect x="104" y="124" width="24" height="8" rx="4" fill={P} opacity=".35" />
      <rect x="94" y="46" width="12" height="26" rx="4" fill={Y} />
    </g>,
  ][step] || null;

  return (
    <svg viewBox="0 0 200 200" className="w-56 h-56 md:w-72 md:h-72">
      {art}
    </svg>
  );
};

/* ---------- shared controls ---------- */
const Option = ({ label, selected, onClick }) => (
  <button onClick={onClick}
    className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-xl border text-left transition-colors ${
      selected ? "border-brand-500 bg-brand-500/10 text-white" : "border-line bg-card2 text-gray-300 hover:border-brand-500/50"}`}>
    <span className="font-medium">{label}</span>
    <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
      selected ? "border-brand-400 bg-brand-500" : "border-gray-600"}`}>
      {selected && <Check size={12} className="text-white" />}
    </span>
  </button>
);

const Chip = ({ label, selected, onClick }) => (
  <button onClick={onClick}
    className={`px-4 py-2.5 rounded-xl border text-sm transition-colors ${
      selected ? "border-brand-500 bg-brand-500/15 text-white" : "border-line bg-card2 text-gray-300 hover:border-brand-500/50"}`}>
    {label}
  </button>
);

export default function StudentOnboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [a, setA] = useState({
    objective: "", timeline: "", companies: [], year: "", skills: [],
    level: "", days: [], times: [], budget: 800,
    name: user?.name || "", college: "", careerGoal: "",
  });

  const set = (k, v) => setA((p) => ({ ...p, [k]: v }));
  const toggle = (k, v) =>
    setA((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));

  const steps = [
    { title: "What's your goal?", sub: "We'll match you with mentors who've done it.",
      ok: !!a.objective,
      body: <div className="space-y-3">{OBJECTIVES.map((o) =>
        <Option key={o} label={o} selected={a.objective === o} onClick={() => set("objective", o)} />)}</div> },

    { title: "By when do you want to achieve this?", sub: null,
      ok: !!a.timeline,
      body: <div className="space-y-3">{TIMELINES.map((o) =>
        <Option key={o} label={o} selected={a.timeline === o} onClick={() => set("timeline", o)} />)}</div> },

    { title: "Which companies are you targeting?", sub: "Pick as many as you like.",
      ok: a.companies.length > 0,
      body: <div className="space-y-3">{COMPANIES.map((o) =>
        <Option key={o} label={o} selected={a.companies.includes(o)} onClick={() => toggle("companies", o)} />)}</div> },

    { title: "Which year are you in?", sub: null,
      ok: !!a.year,
      body: <div className="space-y-3">{YEARS.map((o) =>
        <Option key={o} label={o} selected={a.year === o} onClick={() => set("year", o)} />)}</div> },

    { title: "Which skills do you most want to improve?", sub: "Your first pick becomes your main focus area.",
      ok: a.skills.length > 0,
      body: <div className="flex flex-wrap gap-2.5">{FIELDS.map((o) =>
        <Chip key={o} label={o} selected={a.skills.includes(o)} onClick={() => toggle("skills", o)} />)}</div> },

    { title: "What's your current level?", sub: null,
      ok: !!a.level,
      body: <div className="space-y-3">{LEVELS.map((o) =>
        <Option key={o} label={o} selected={a.level === o} onClick={() => set("level", o)} />)}</div> },

    { title: "When can you take sessions?", sub: null,
      ok: a.days.length > 0 && a.times.length > 0,
      body: (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-400 mb-2.5">Days</p>
            <div className="flex flex-wrap gap-2">{DAYS.map((d) =>
              <Chip key={d} label={d} selected={a.days.includes(d)} onClick={() => toggle("days", d)} />)}</div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2.5">Times</p>
            <div className="flex flex-wrap gap-2">{TIMES.map((t) =>
              <Chip key={t} label={t} selected={a.times.includes(t)} onClick={() => toggle("times", t)} />)}</div>
          </div>
        </div>
      ) },

    { title: "What's your budget?", sub: null,
      ok: true,
      body: (
        <div className="text-center">
          <p className="text-3xl font-bold text-white">₹{a.budget}<span className="text-lg text-gray-400"> / hour</span></p>
          <p className="text-sm text-gray-500 mt-1">per 1:1 session</p>
          <input type="range" min="200" max="3000" step="100" value={a.budget}
            onChange={(e) => set("budget", Number(e.target.value))}
            className="w-full mt-8 accent-brand-500" />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>₹200</span><span>₹3000+</span>
          </div>
        </div>
      ) },

    { title: "Last step — about you", sub: "So mentors know who they're meeting.",
      ok: !!a.name.trim() && !!a.careerGoal,
      body: (
        <div className="space-y-4">
          <div>
            <label className="text-xs tracking-widest text-gray-400">FULL NAME</label>
            <input value={a.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name"
              className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 text-white" />
          </div>
          <div>
            <label className="text-xs tracking-widest text-gray-400">COLLEGE</label>
            <input value={a.college} onChange={(e) => set("college", e.target.value)} placeholder="e.g. MNIT Jaipur"
              className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 text-white" />
          </div>
          <div>
            <label className="text-xs tracking-widest text-gray-400">TARGET ROLE</label>
            <select value={a.careerGoal} onChange={(e) => set("careerGoal", e.target.value)}
              className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 text-white [color-scheme:dark]">
              <option value="">Select your target role</option>
              {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      ) },
  ];

  const total = steps.length;
  const cur = steps[step];

  const finish = async () => {
    setErr("");
    setSaving(true);
    const about = [
      `Goal: ${a.objective}`,
      `Timeline: ${a.timeline}`,
      `Targeting: ${a.companies.join(", ")}`,
      `Level: ${a.level}`,
      `Available: ${a.days.join(", ")} · ${a.times.join(", ")}`,
      `Budget: up to ₹${a.budget}/hr`,
      a.skills.length > 1 ? `Also improving: ${a.skills.slice(1).join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const form = {
      name: a.name.trim(),
      about,
      fieldOfInterest: a.skills[0] || "Placement Preparation",
      college: a.college.trim(),
      year: a.year,
      careerGoal: a.careerGoal,
    };

    try {
      const r = await api.put("/auth/profile", form);
      const updated = { ...user, ...r.data.user };
      localStorage.setItem("pt_user", JSON.stringify(updated));
      setUser(updated);
      setTimeout(() => navigate("/student", { replace: true }), 1400);
    } catch (e) {
      setErr(e.response?.data?.message || "Could not save profile");
      setSaving(false);
    }
  };

  /* ---------- loading screen ---------- */
  if (saving && !err)
    return (
      <div className="fixed inset-0 z-50 bg-brand-600 flex flex-col items-center justify-center px-6">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-14 h-14 rounded-full border-4 border-white/30 border-t-white mb-8" />
        <h1 className="text-3xl md:text-5xl font-bold text-white text-center leading-tight">
          Finding mentors who will<br />support you.
        </h1>
      </div>
    );

  return (
    <div className="fixed inset-0 z-40 bg-bg flex flex-col md:flex-row overflow-y-auto">
      {/* progress */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-card2 z-10">
        <motion.div className="h-full bg-gradient-to-r from-brand-600 to-brand-400"
          animate={{ width: `${((step + 1) / total) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      {/* LEFT — illustration */}
      <div className="md:w-1/2 bg-brand-500/10 flex items-center justify-center py-10 md:py-0 shrink-0">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.25 }}>
            <Art step={step} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* RIGHT — question */}
      <div className="md:w-1/2 flex flex-col justify-center px-6 md:px-14 py-10">
        <button onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
          className="absolute top-6 left-6 text-gray-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>

        <p className="text-xs tracking-widest text-brand-400 mb-3">STEP {step + 1} OF {total}</p>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{cur.title}</h1>
            {cur.sub && <p className="text-gray-400 mt-2">{cur.sub}</p>}
            <div className="mt-8 max-w-lg">{cur.body}</div>
          </motion.div>
        </AnimatePresence>

        {err && <p className="text-red-400 text-sm mt-4">{err}</p>}

        <motion.button whileTap={{ scale: 0.97 }}
          disabled={!cur.ok}
          onClick={() => (step === total - 1 ? finish() : setStep(step + 1))}
          className="mt-8 w-full max-w-lg py-4 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-40 disabled:cursor-not-allowed">
          {step === total - 1 ? "Find my mentors" : "Continue"}
        </motion.button>
      </div>
    </div>
  );
}