import { useState } from "react";
import { motion } from "framer-motion";
import { User, Save } from "lucide-react";
import api from "../api";
import { useAuth } from "../AuthContext";
import { FIELDS, YEARS, GOALS, Field, Select } from "../pages/Onboarding";

export default function MyProfile() {
  const { user, setUser } = useAuth();
  const sp = user?.studentProfile || {};
  const [form, setForm] = useState({
    name: user?.name || "",
    about: sp.about || "",
    fieldOfInterest: sp.fieldOfInterest || "",
    college: sp.college || "",
    year: sp.year || "",
    careerGoal: sp.careerGoal || "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setMsg(""); setErr("");
    if (!form.name || !form.fieldOfInterest) {
      setErr("Name and field of interest are required.");
      return;
    }
    setSaving(true);
    try {
      const r = await api.put("/auth/profile", form);
      const updated = { ...user, ...r.data.user };
      localStorage.setItem("pt_user", JSON.stringify(updated));
      setUser(updated);
      setMsg("Profile updated!");
    } catch (e) {
      setErr(e.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-bold text-white">My Profile</motion.h1>
      <p className="text-gray-400 mt-2 mb-8">View and edit your details.</p>

      <div className="glass rounded-2xl p-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <User className="text-white" size={26} />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{form.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="FULL NAME" value={form.name} onChange={set("name")} />
          <Select label="FIELD OF INTEREST" value={form.fieldOfInterest} onChange={set("fieldOfInterest")}
            options={FIELDS} placeholder="Select a field" />
          <div>
            <label className="text-xs tracking-widest text-gray-400">ABOUT YOU</label>
            <textarea value={form.about} onChange={set("about")} rows={3}
              className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 resize-none" />
          </div>
          <Field label="COLLEGE" value={form.college} onChange={set("college")} />
          <Select label="YEAR" value={form.year} onChange={set("year")} options={YEARS} placeholder="Select year" />
          <Select label="CAREER GOAL" value={form.careerGoal} onChange={set("careerGoal")}
            options={GOALS} placeholder="Select your goal" />
        </div>

        {err && <p className="text-red-400 text-sm mt-4">{err}</p>}
        {msg && <p className="text-green-400 text-sm mt-4">{msg}</p>}

        <motion.button whileTap={{ scale: 0.97 }} onClick={save} disabled={saving}
          className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-50">
          <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
        </motion.button>
      </div>
    </div>
  );
}