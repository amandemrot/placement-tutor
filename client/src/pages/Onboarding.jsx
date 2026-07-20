import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import api from "../api";
import { useAuth } from "../AuthContext";

export const FIELDS = [
  "DSA & Problem Solving", "System Design", "Web Development", "Mobile Development",
  "Machine Learning / AI", "Data Science & Analytics", "DevOps & Cloud",
  "Cybersecurity", "Placement Preparation", "Resume & Interview Prep",
  "Competitive Programming", "Higher Studies / GATE",
];

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export const GOALS = [
  "Software Development Engineer (SDE)", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "Data Scientist", "Machine Learning Engineer",
  "AI Engineer", "Data Analyst", "DevOps Engineer", "Cloud Engineer",
  "Cybersecurity Analyst", "Mobile App Developer", "QA / SDET",
  "Product Manager", "UI/UX Designer", "Research / Higher Studies",
  "Government Job / PSU", "Entrepreneurship / Startup",
];

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "", about: "", fieldOfInterest: "",
    college: "", year: "", careerGoal: "",
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setErr("");
    if (!form.name || !form.fieldOfInterest) {
      setErr("Please fill in your name and field of interest.");
      return;
    }
    setSaving(true);
    try {
      const r = await api.put("/auth/profile", form);
      const updated = { ...user, ...r.data.user };
      localStorage.setItem("pt_user", JSON.stringify(updated));
      setUser(updated);
      navigate("/student", { replace: true });
    } catch (e) {
      setErr(e.response?.data?.message || "Could not save profile");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 w-full max-w-lg glow">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <GraduationCap className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Complete your profile</h1>
            <p className="text-sm text-gray-400">Tell us about yourself to get started.</p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <Field label="FULL NAME" value={form.name} onChange={set("name")} placeholder="Your name" />
          <Select label="FIELD OF INTEREST" value={form.fieldOfInterest} onChange={set("fieldOfInterest")}
            options={FIELDS} placeholder="Select a field" />
          <div>
            <label className="text-xs tracking-widest text-gray-400">ABOUT YOU</label>
            <textarea value={form.about} onChange={set("about")} rows={3}
              placeholder="A few words about yourself..."
              className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 resize-none" />
          </div>
          <Field label="COLLEGE" value={form.college} onChange={set("college")} placeholder="e.g. MIT Jaipur" />
          <Select label="YEAR" value={form.year} onChange={set("year")} options={YEARS} placeholder="Select year" />
          <Select label="CAREER GOAL" value={form.careerGoal} onChange={set("careerGoal")}
            options={GOALS} placeholder="Select your goal" />
        </div>

        {err && <p className="text-red-400 text-sm mt-4">{err}</p>}

        <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={saving}
          className="w-full mt-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-50">
          {saving ? "Saving..." : "Save & Continue"}
        </motion.button>
      </motion.div>
    </div>
  );
}

export function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs tracking-widest text-gray-400">{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder}
        className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500" />
    </div>
  );
}

export function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="text-xs tracking-widest text-gray-400">{label}</label>
      <select value={value} onChange={onChange}
        className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 [color-scheme:dark]">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}