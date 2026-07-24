import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Star, BadgeCheck, X, Clock, ChevronDown, GraduationCap,
  Briefcase, Languages, MapPin, MessageSquare, Send, SlidersHorizontal, Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import api from "../api";

const PRICE_MAX = 3000;
const SORTS = ["Our top picks", "Price: low to high", "Price: high to low", "Most experienced"];
const EXP_LEVELS = [
  { label: "Any experience", value: 0 },
  { label: "1+ years", value: 1 },
  { label: "3+ years", value: 3 },
  { label: "5+ years", value: 5 },
];

const skillLabel = (skills) =>
  skills.length === 0 ? "All focus areas"
  : skills.length === 1 ? skills[0]
  : `${skills.length} focus areas`;

/* ---------- single-select dropdown ---------- */
function Dropdown({ label, value, options, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-line bg-card2 text-sm text-gray-200 hover:border-brand-500/50 transition-colors">
        <span className="text-gray-500 text-xs">{label}</span>
        <span className="font-medium truncate max-w-[140px]">{value}</span>
        <ChevronDown size={15} className={`text-brand-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-2 w-56 rounded-xl border border-line bg-card shadow-xl overflow-hidden">
            {options.map((o) => (
              <button key={o} onClick={() => { onPick(o); setOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  o === value ? "bg-brand-500/15 text-white" : "text-gray-300 hover:bg-card2"}`}>
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- multi-select dropdown ---------- */
function MultiDropdown({ label, selected, options, onToggle, onClear }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl border bg-card2 text-sm transition-colors ${
          selected.length ? "border-brand-500/60 text-white" : "border-line text-gray-200 hover:border-brand-500/50"}`}>
        <span className="text-gray-500 text-xs">{label}</span>
        <span className="font-medium truncate max-w-[140px]">{skillLabel(selected)}</span>
        <ChevronDown size={15} className={`text-brand-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-2 w-64 rounded-xl border border-line bg-card shadow-xl overflow-hidden">
            <div className="max-h-72 overflow-y-auto">
              {options.map((o) => {
                const on = selected.includes(o);
                return (
                  <button key={o} onClick={() => onToggle(o)}
                    className="w-full flex items-center justify-between gap-3 text-left px-4 py-3 text-sm text-gray-300 hover:bg-card2 transition-colors">
                    <span className={on ? "text-white" : ""}>{o}</span>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      on ? "border-brand-400 bg-brand-500" : "border-gray-600"}`}>
                      {on && <Check size={11} className="text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {selected.length > 0 && (
              <button onClick={onClear}
                className="w-full px-4 py-3 text-sm text-brand-400 border-t border-line hover:bg-card2">
                Clear focus areas
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- mobile filter sheet ---------- */
function FilterSheet({ skillOptions, state, setState, count, onClose }) {
  const { skills, priceMax, minExp, sort } = state;
  const toggleSkill = (s) =>
    setState({ ...state, skills: skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s] });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-bg flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-line shrink-0">
        <button onClick={() => setState({ skills: [], priceMax: PRICE_MAX, minExp: 0, sort: "Our top picks" })}
          className="text-sm text-brand-400 underline">Clear all</button>
        <h2 className="text-lg font-bold text-white">Filters</h2>
        <button onClick={onClose} className="text-gray-400"><X size={22} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        <div>
          <h3 className="font-bold text-white mb-1">Price per session</h3>
          <p className="text-center text-xl font-bold text-white mt-4">
            {priceMax >= PRICE_MAX ? `₹200 – ₹${PRICE_MAX}+` : `Up to ₹${priceMax}`}
          </p>
          <input type="range" min="200" max={PRICE_MAX} step="100" value={priceMax}
            onChange={(e) => setState({ ...state, priceMax: Number(e.target.value) })}
            className="w-full mt-5 accent-brand-500" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>₹200</span><span>₹{PRICE_MAX}+</span>
          </div>
        </div>

        <div className="border-t border-line pt-7">
          <h3 className="font-bold text-white mb-4">Mentor experience</h3>
          <div className="space-y-2.5">
            {EXP_LEVELS.map((e) => (
              <button key={e.value} onClick={() => setState({ ...state, minExp: e.value })}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-colors ${
                  minExp === e.value ? "border-brand-500 bg-brand-500/10 text-white" : "border-line bg-card2 text-gray-300"}`}>
                <span className="text-sm font-medium">{e.label}</span>
                {minExp === e.value && <Check size={16} className="text-brand-400" />}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-line pt-7">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-white">Focus areas</h3>
            {skills.length > 0 && (
              <button onClick={() => setState({ ...state, skills: [] })}
                className="text-xs text-brand-400 underline">Clear</button>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">Pick as many as you like.</p>
          <div className="flex flex-wrap gap-2">
            {skillOptions.map((s) => {
              const on = skills.includes(s);
              return (
                <button key={s} onClick={() => toggleSkill(s)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs transition-colors ${
                    on ? "border-brand-500 bg-brand-500/15 text-white" : "border-line bg-card2 text-gray-300"}`}>
                  {on && <Check size={12} className="text-brand-400" />}
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-line pt-7 pb-4">
          <h3 className="font-bold text-white mb-4">Sort mentors by</h3>
          <div className="space-y-1">
            {SORTS.map((s) => (
              <button key={s} onClick={() => setState({ ...state, sort: s })}
                className="w-full flex items-center justify-between py-3 text-left">
                <span className={`text-sm ${sort === s ? "text-white font-medium" : "text-gray-400"}`}>{s}</span>
                {sort === s && <Check size={16} className="text-brand-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-line shrink-0">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
          className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow">
          Show {count} {count === 1 ? "mentor" : "mentors"}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ---------- ask a question ---------- */
export function AskModal({ mentor, onClose }) {
  const [text, setText] = useState("");
  const [state, setState] = useState("write");
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    setState("sending");
    try {
      await api.post(`/mentors/${mentor._id}/ask`, { question: text.trim() });
      setState("done");
    } catch (e) {
      setErr(e.response?.data?.message || "Could not send your question.");
      setState("write");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-7 w-full max-w-lg glow">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-white">Ask {mentor.name.split(" ")[0]} a question</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>

        {state === "done" ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">📨</div>
            <h3 className="text-xl font-bold text-white mb-2">Question sent</h3>
            <p className="text-gray-400 text-sm mb-6">
              {mentor.name.split(" ")[0]} will reply straight to your email.
            </p>
            <button onClick={onClose}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow">
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">
              This goes to their inbox — they'll reply to your email directly.
            </p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} maxLength={1000}
              placeholder="e.g. I'm targeting SDE roles at product companies but keep failing DSA rounds. Where should I start?"
              className="w-full bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 resize-none text-sm text-white" />
            <p className="text-xs text-gray-500 mt-1.5">{text.trim().length}/1000</p>
            {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
            <motion.button whileTap={{ scale: 0.97 }}
              disabled={text.trim().length < 10 || state === "sending"}
              onClick={submit}
              className="w-full mt-5 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Send size={16} /> {state === "sending" ? "Sending…" : "Send question"}
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function BrowseTutors() {
  const [mentors, setMentors] = useState([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [ask, setAsk] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const nav = useNavigate();

  const [f, setF] = useState({
    skills: [], priceMax: PRICE_MAX, minExp: 0, sort: "Our top picks",
  });

  useEffect(() => {
    api.get("/mentors").then((r) => setMentors(r.data)).catch(() => {});
  }, []);

  const skillOptions = useMemo(() => {
    const all = new Set();
    mentors.forEach((m) => (m.mentorProfile?.skills || []).forEach((s) => all.add(s)));
    return [...all].sort();
  }, [mentors]);

  const toggleSkill = (s) =>
    setF((p) => ({ ...p, skills: p.skills.includes(s) ? p.skills.filter((x) => x !== s) : [...p.skills, s] }));

  const activeCount =
    f.skills.length +
    (f.priceMax < PRICE_MAX ? 1 : 0) +
    (f.minExp > 0 ? 1 : 0) +
    (f.sort !== "Our top picks" ? 1 : 0);

  const list = useMemo(() => {
    const s = q.toLowerCase();
    let out = mentors.filter((m) => {
      const p = m.mentorProfile || {};
      const matchesQ =
        !s ||
        m.name.toLowerCase().includes(s) ||
        (p.company || "").toLowerCase().includes(s) ||
        (p.designation || "").toLowerCase().includes(s) ||
        (p.skills || []).some((k) => k.toLowerCase().includes(s));

      const matchesSkill =
        f.skills.length === 0 || (p.skills || []).some((k) => f.skills.includes(k));
      const matchesPrice = f.priceMax >= PRICE_MAX || (p.pricePerHour || 0) <= f.priceMax;
      const matchesExp = (p.experience || 0) >= f.minExp;
      return matchesQ && matchesSkill && matchesPrice && matchesExp;
    });

    if (f.sort === "Price: low to high")
      out = [...out].sort((a, b) => (a.mentorProfile?.pricePerHour || 0) - (b.mentorProfile?.pricePerHour || 0));
    if (f.sort === "Price: high to low")
      out = [...out].sort((a, b) => (b.mentorProfile?.pricePerHour || 0) - (a.mentorProfile?.pricePerHour || 0));
    if (f.sort === "Most experienced")
      out = [...out].sort((a, b) => (b.mentorProfile?.experience || 0) - (a.mentorProfile?.experience || 0));

    return out;
  }, [mentors, q, f]);

  return (
    <div>
      <h1 className="text-2xl md:text-4xl font-bold text-white">
        Online placement mentors for 1:1 sessions
      </h1>
      <p className="text-sm md:text-base text-gray-400 mt-2 max-w-3xl">
        Looking for placement guidance? Every mentor here is verified and has cleared the
        interviews you're preparing for. Pick a slot, meet 1:1, get a concrete plan.
      </p>

      {/* ── MOBILE FILTER ROW ── */}
      <div className="md:hidden mt-5">
        <div className="flex gap-2.5">
          <button onClick={() => setShowFilters(true)}
            className={`flex-1 min-w-0 flex items-center justify-between gap-2 rounded-xl border bg-card2 px-4 py-3 text-sm ${
              f.skills.length ? "border-brand-500/60 text-white" : "border-line text-gray-200"}`}>
            <span className="truncate">{skillLabel(f.skills)}</span>
            <ChevronDown size={15} className="text-brand-400 shrink-0" />
          </button>

          <button onClick={() => setShowFilters(true)}
            className="relative w-14 shrink-0 rounded-xl border border-line bg-card2 flex items-center justify-center text-gray-200">
            <SlidersHorizontal size={18} />
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          <button onClick={() => setShowSearch((v) => !v)}
            className={`w-14 shrink-0 rounded-xl border flex items-center justify-center transition-colors ${
              showSearch ? "border-brand-500 text-brand-400" : "border-line bg-card2 text-gray-200"}`}>
            <Search size={18} />
          </button>
        </div>

        {showSearch && (
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or keyword"
            className="w-full mt-2.5 bg-card2 border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-500" />
        )}

        {f.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {f.skills.map((s) => (
              <button key={s} onClick={() => toggleSkill(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-500/50 bg-brand-500/15 text-xs text-white">
                {s} <X size={12} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP FILTER BAR ── */}
      <div className="hidden md:flex flex-wrap gap-3 mt-7 max-w-5xl">
        <MultiDropdown label="Focus area" selected={f.skills} options={skillOptions}
          onToggle={toggleSkill} onClear={() => setF({ ...f, skills: [] })} />
        <Dropdown label="Experience" value={EXP_LEVELS.find((e) => e.value === f.minExp)?.label || "Any experience"}
          options={EXP_LEVELS.map((e) => e.label)}
          onPick={(v) => setF({ ...f, minExp: EXP_LEVELS.find((e) => e.label === v).value })} />
        <Dropdown label="Sort by" value={f.sort} options={SORTS} onPick={(v) => setF({ ...f, sort: v })} />

        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or keyword"
            className="w-full bg-card2 border border-line rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-brand-500 transition-colors" />
        </div>
      </div>

      <h2 className="text-lg md:text-2xl font-bold text-white mt-8 md:mt-10 mb-4 md:mb-5">
        Mentors ideal for your goals and schedule
      </h2>

      {list.length === 0 && (
        <p className="text-gray-500">
          {mentors.length === 0
            ? "No approved mentors yet. (Admin must approve mentors first.)"
            : "No mentors match these filters."}
        </p>
      )}

      <div className="space-y-4 md:space-y-5 max-w-5xl">
        {list.map((m, i) => {
          const p = m.mentorProfile || {};
          const open = expanded[m._id];
          const photo = p.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`;

          return (
            <motion.div key={m._id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.06, 0.4) }}
              className="glass rounded-2xl p-4 md:p-6 hover:glow transition-shadow">

              {/* ══════ MOBILE ══════ */}
              <div className="md:hidden">
                <div className="flex gap-3.5">
                  <img src={photo} alt={m.name} onClick={() => nav(`/mentors/${m._id}`)}
                    className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 object-cover shrink-0 cursor-pointer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-white flex items-center gap-1.5">
                      <span onClick={() => nav(`/mentors/${m._id}`)} className="truncate cursor-pointer">{m.name}</span>
                      <BadgeCheck size={16} className="text-brand-400 shrink-0" />
                    </p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-1">
                          <Star size={13} className="text-yellow-400 fill-yellow-400" /> New
                        </p>
                        <p className="text-[11px] text-gray-500">no reviews</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">₹{p.pricePerHour}</p>
                        <p className="text-[11px] text-gray-500">60-min session</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Briefcase size={12} className="text-brand-400" />{p.designation || "Mentor"}</span>
                  {p.company && <><span>·</span><span>{p.company}</span></>}
                  {p.experience >= 3 && (
                    <span className="text-[10px] bg-brand-500/20 text-brand-400 border border-brand-500/40 rounded-full px-2 py-0.5">
                      Senior Mentor
                    </span>
                  )}
                </div>

                {p.bio && (
                  <>
                    <p className={`text-sm text-gray-300 mt-2.5 leading-relaxed ${open ? "" : "line-clamp-2"}`}>{p.bio}</p>
                    <button onClick={() => setExpanded((e) => ({ ...e, [m._id]: !open }))}
                      className="text-sm text-brand-400 underline mt-1">
                      {open ? "Show less" : "Learn more"}
                    </button>
                  </>
                )}

                <p className="text-xs text-gray-500 mt-3">
                  {p.experience ? `${p.experience} yrs experience` : "New mentor"} · {(p.skills || []).length} focus areas
                  {p.college ? ` · ${p.college}` : ""}
                </p>

                <div className="flex gap-2.5 mt-3.5">
                  <button onClick={() => setAsk(m)}
                    className="w-12 shrink-0 rounded-xl border border-line flex items-center justify-center text-gray-300 active:border-brand-500">
                    <MessageSquare size={17} />
                  </button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSel(m)}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow">
                    Book a session
                  </motion.button>
                </div>
              </div>

              {/* ══════ DESKTOP ══════ */}
              <div className="hidden md:flex gap-5">
                <img src={photo} alt={m.name} onClick={() => nav(`/mentors/${m._id}`)}
                  className="w-36 h-36 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 object-cover shrink-0 cursor-pointer" />

                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                    <span onClick={() => nav(`/mentors/${m._id}`)} className="cursor-pointer hover:text-brand-400 transition-colors">
                      {m.name}
                    </span>
                    <BadgeCheck size={17} className="text-brand-400" />
                    {p.experience >= 3 && (
                      <span className="text-[10px] bg-brand-500/20 text-brand-400 border border-brand-500/40 rounded-full px-2 py-0.5">
                        Senior Mentor
                      </span>
                    )}
                  </p>

                  <p className="text-sm text-gray-300 mt-1.5 flex items-center gap-2 flex-wrap">
                    <Briefcase size={14} className="text-brand-400" />
                    {p.designation || "Mentor"}{p.company ? ` · ${p.company}` : ""}
                  </p>

                  {p.college && (
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                      <GraduationCap size={14} className="text-brand-400" /> {p.college}
                    </p>
                  )}

                  {p.location && (
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                      <MapPin size={14} className="text-brand-400" /> {p.location}
                    </p>
                  )}

                  {(p.skills || []).length > 0 && (
                    <p className="text-sm text-gray-400 mt-1 flex items-start gap-2">
                      <Languages size={14} className="text-brand-400 mt-0.5 shrink-0" />
                      <span>{p.skills.slice(0, 4).join(", ")}
                        {p.skills.length > 4 ? ` +${p.skills.length - 4}` : ""}</span>
                    </p>
                  )}

                  {p.bio && (
                    <>
                      <p className={`text-sm text-gray-300 mt-3 leading-relaxed ${open ? "" : "line-clamp-2"}`}>{p.bio}</p>
                      <button onClick={() => setExpanded((e) => ({ ...e, [m._id]: !open }))}
                        className="text-sm text-brand-400 hover:text-white underline mt-1">
                        {open ? "Show less" : "Learn more"}
                      </button>
                    </>
                  )}

                  <button onClick={() => nav(`/mentors/${m._id}`)}
                    className="block text-sm text-gray-400 hover:text-white underline mt-3">
                    View full profile
                  </button>
                </div>

                <div className="w-60 shrink-0 border-l border-line pl-6 flex flex-col">
                  <p className="text-3xl font-bold text-white leading-none">₹{p.pricePerHour}</p>
                  <p className="text-xs text-gray-500 mt-1.5">60-min 1:1 session</p>

                  <div className="mt-5 space-y-2">
                    <p className="text-sm text-gray-400 flex items-center gap-1.5">
                      <Star size={13} className="text-yellow-400 fill-yellow-400 shrink-0" />
                      <span className="text-white font-medium">New</span> · no reviews yet
                    </p>
                    <p className="text-sm text-gray-400">
                      <span className="text-white font-medium">{p.experience || "—"}</span> years of experience
                    </p>
                    <p className="text-sm text-gray-400">
                      <span className="text-white font-medium">{(p.skills || []).length}</span> focus areas
                    </p>
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSel(m)}
                    className="w-full mt-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow">
                    Book a session
                  </motion.button>
                  <button onClick={() => setAsk(m)}
                    className="w-full mt-2.5 py-3 rounded-xl font-semibold text-gray-200 border border-line hover:border-brand-500/60 transition-colors flex items-center justify-center gap-2">
                    <MessageSquare size={15} /> Ask a question
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showFilters && (
          <FilterSheet skillOptions={skillOptions} state={f} setState={setF}
            count={list.length} onClose={() => setShowFilters(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>{sel && <BookingModal mentor={sel} onClose={() => setSel(null)} />}</AnimatePresence>
      <AnimatePresence>{ask && <AskModal mentor={ask} onClose={() => setAsk(null)} />}</AnimatePresence>
    </div>
  );
}

export function BookingModal({ mentor, onClose }) {
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);
  const [stage, setStage] = useState("pick");
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
      if (order?.devMode) {
        await finishBooking(null);
        return;
      }
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
      rzp.on("payment.failed", (r) => setErr(r.error?.description || "Payment failed"));
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