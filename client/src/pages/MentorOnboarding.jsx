import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import { Country, State, City } from "country-state-city";

const STEPS = ["Personal", "Education", "Experience", "Verification"];
const YEARS = Array.from({ length: 31 }, (_, i) => String(2000 + i));
const DEGREES = ["B.Tech", "B.E.", "B.Sc", "BCA", "M.Tech", "M.E.", "M.Sc", "MCA", "MBA", "PhD", "Other"];
const DESIGNATIONS = [
  "Software Engineer", "Senior Software Engineer", "SDE-1", "SDE-2", "SDE-3",
  "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Analyst", "Data Scientist", "ML Engineer", "DevOps Engineer",
  "Product Manager", "UI/UX Designer", "QA Engineer", "Tech Lead",
  "Engineering Manager", "Consultant", "Analyst", "Other",
];
const SKILLS = [
  "DSA", "System Design", "React", "Node.js", "JavaScript", "Python", "Java", "C++",
  "SQL", "MongoDB", "AWS", "DevOps", "Machine Learning", "Data Science",
  "Resume Review", "Interview Prep", "Aptitude", "HR Interview", "Career Guidance",
];

function Field({ label, error, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-slate-300 mb-1">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-400 mt-1">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg bg-slate-800/60 border border-slate-600 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const errCls =
  "w-full rounded-lg bg-slate-800/60 border border-red-500 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500";

// ---------- validators ----------
const nameLike = (v) => /^[A-Za-z][A-Za-z .,'&()-]{1,79}$/.test(v.trim());

const VALIDATORS = {
firstName: (v) => (/^[A-Za-z][A-Za-z .'-]{0,39}$/.test(v.trim()) ? "" : "Enter a valid first name (letters only)."),
  lastName: (v) => (v.trim() === "" || /^[A-Za-z][A-Za-z .'-]{0,39}$/.test(v.trim()) ? "" : "Enter a valid last name (letters only)."),
  phone: (v) => {
    const s = v.replace(/[\s-]/g, "");
    if (!/^\d{6,12}$/.test(s)) return "Enter a valid phone number (digits only, 6–12 digits).";
    return "";
  },
  location: (v) => (v.trim() ? "" : "Select your country, state and city."),
  bio: (v) => (v.trim().length >= 20 ? "" : "Bio must be at least 20 characters."),
  linkedIn: (v) =>
    /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[A-Za-z0-9_%-]+\/?$/.test(v.trim())
      ? "" : "Enter a valid LinkedIn profile URL (https://linkedin.com/in/your-name).",
  college: (v) => (nameLike(v) ? "" : "Enter a valid college name (letters only)."),
  degree: (v) => (v ? "" : "Select your degree."),
  branch: (v) => (nameLike(v) ? "" : "Enter a valid branch (letters only, e.g. Computer Science)."),
  graduationYear: (v) => (v ? "" : "Select your graduation year."),
  company: (v) => (nameLike(v) ? "" : "Enter a valid company name."),
  designation: (v) => (v ? "" : "Select your designation."),
  experience: (v) => {
    const n = Number(v);
    if (v === "" || Number.isNaN(n)) return "Enter years of experience as a number.";
    if (n < 0 || n > 50) return "Experience must be between 0 and 50 years.";
    return "";
  },
  skills: (v) => (v.split(",").map((s) => s.trim()).filter(Boolean).length >= 1 ? "" : "Select at least one skill."),
  pricePerHour: (v) => {
    const n = Number(v);
    if (v === "" || Number.isNaN(n)) return "Enter your price as a number.";
    if (n < 50 || n > 10000) return "Price must be between ₹50 and ₹10,000 per hour.";
    return "";
  },
};

const STEP_FIELDS = {
 1: ["firstName", "lastName", "phone", "location", "bio", "linkedIn"],
  2: ["college", "degree", "branch", "graduationYear"],
  3: ["company", "designation", "experience", "skills", "pricePerHour"],
  4: [],
};

export default function MentorOnboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: (user?.name || "").split(" ")[0] || "",
    lastName: (user?.name || "").split(" ").slice(1).join(" ") || "",
    phone: "", location: "", bio: "", linkedIn: "",
    college: "", degree: "", branch: "", graduationYear: "",
    company: "", designation: "", experience: "", skills: "", pricePerHour: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoStatus, setPhotoStatus] = useState("");   // "", "uploading", "done", "error:<msg>"
  const [docName, setDocName] = useState("");
  const [docStatus, setDocStatus] = useState("");

  const uploadFile = async (file, kind) => {
    const setStatus = kind === "photo" ? setPhotoStatus : setDocStatus;
    setStatus("uploading");
    try {
      const fd = new FormData();
      fd.append(kind === "photo" ? "photo" : "doc", file);
      const url = kind === "photo" ? "/upload/photo" : "/upload/verification";
      await api.post(url, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setStatus("done");
    } catch (err) {
      setStatus("error:" + (err.response?.data?.message || "Upload failed"));
    }
  };
const [loc, setLoc] = useState({ country: "", state: "", city: "" });
const [phoneCode, setPhoneCode] = useState("91");

  useEffect(() => {
    api.get("/mentors/onboarding")
      .then((res) => {
        const p = res.data.mentorProfile || {};
        if (p.onboardingSubmitted) { navigate("/mentor", { replace: true }); return; }
        setForm((f) => {
          const next = { ...f };
          Object.keys(next).forEach((k) => {
            if (p[k] !== undefined && p[k] !== null) {
              next[k] = Array.isArray(p[k]) ? p[k].join(", ") : String(p[k]);
            }
          });
          return next;
        });
        if (p.onboardingStep) setStep(Math.min(p.onboardingStep, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);
const setLocPart = (part) => (e) => {
    const v = e.target.value;
    const next =
      part === "country" ? { country: v, state: "", city: "" }
      : part === "state" ? { ...loc, state: v, city: "" }
      : { ...loc, city: v };
    setLoc(next);
    const cn = Country.getCountryByCode(next.country)?.name || "";
    const sn = State.getStateByCodeAndCountry(next.state, next.country)?.name || "";
    const parts = [next.city, sn, cn].filter(Boolean);
    setForm((f) => ({ ...f, location: parts.join(", ") }));
    if (errors.location) setErrors({ ...errors, location: "" });
  };
  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: "" });
  };
const toggleSkill = (s) => {
    const arr = form.skills.split(",").map((x) => x.trim()).filter(Boolean);
    const next = arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s];
    setForm({ ...form, skills: next.join(", ") });
    if (errors.skills) setErrors({ ...errors, skills: "" });
  };
  const validateStep = () => {
    const errs = {};
    STEP_FIELDS[step].forEach((k) => {
      const msg = VALIDATORS[k](form[k] || "");
      if (msg) errs[k] = msg;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const stepData = () => {
    if (step === 1)
      return {
        phone: `+${phoneCode} ${form.phone.replace(/[\s-]/g, "")}`,
        location: form.location.trim(),
        bio: form.bio.trim(),
        linkedIn: form.linkedIn.trim(),
      };
    if (step === 2)
      return {
        college: form.college.trim(), degree: form.degree,
        branch: form.branch.trim(), graduationYear: form.graduationYear,
      };
    if (step === 3)
      return {
        company: form.company.trim(), designation: form.designation.trim(),
        experience: Number(form.experience),
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        pricePerHour: Number(form.pricePerHour),
      };
    return {};
  };

  const save = async (submit = false) => {
    if (!validateStep()) return;
    if (submit && (photoStatus === "uploading" || docStatus === "uploading")) {
      setError("Please wait for uploads to finish.");
      return;
    }
    setSaving(true); setError("");
    try {
      const res = await api.put("/mentors/onboarding", {
        step: submit ? 4 : step + 1,
        data: stepData(),
        submit,
        ...(step === 1 && { name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim() }),
      });
      if (submit) {
        const u = res.data.user;
        const merged = { ...user, ...u, mentorProfile: u.mentorProfile };
        localStorage.setItem("pt_user", JSON.stringify(merged));
        setUser(merged);
        navigate("/mentor", { replace: true });
      } else {
        setStep((s) => Math.min(s + 1, 4));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-300">Loading…</div>;

  const cls = (k) => (errors[k] ? errCls : inputCls);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900/70 backdrop-blur rounded-2xl border border-slate-700 p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Mentor Onboarding</h1>
        <p className="text-slate-400 text-sm mb-6">Step {step} of 4 — {STEPS[step - 1]}</p>

        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-indigo-500" : "bg-slate-700"}`} />
          ))}
        </div>

        {error && <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}

        {step === 1 && (
          <>
<div className="grid grid-cols-2 gap-3">
              <Field label="First Name" error={errors.firstName}>
                <input className={cls("firstName")} value={form.firstName} onChange={set("firstName")} placeholder="Aman" />
              </Field>
              <Field label="Last Name" error={errors.lastName}>
                <input className={cls("lastName")} value={form.lastName} onChange={set("lastName")} placeholder="Demrot" />
              </Field>
            </div>
            <Field label="Phone" error={errors.phone}>
              <div className="flex gap-2">
                <select style={{ width: "110px", flex: "none" }} className={cls("phone")} value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}>
                  {Country.getAllCountries().map((c) => (
                    <option key={c.isoCode} value={c.phonecode}>
                      {c.flag} +{c.phonecode}
                    </option>
                  ))}
                </select>
                <input className={cls("phone")} value={form.phone}
                  onChange={(e) => set("phone")({ target: { value: e.target.value.replace(/[^\d\s-]/g, "") } })}
                  inputMode="tel" maxLength={14} placeholder="9876543210" />
              </div>
            </Field>
            <Field label="Location" error={errors.location}>
              <div className="grid grid-cols-3 gap-2">
                <select className={cls("location")} value={loc.country} onChange={setLocPart("country")}>
                  <option value="">Country</option>
                  {Country.getAllCountries().map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                  ))}
                </select>
                <select className={cls("location")} value={loc.state} onChange={setLocPart("state")} disabled={!loc.country}>
                  <option value="">State</option>
                  {State.getStatesOfCountry(loc.country).map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
                <select className={cls("location")} value={loc.city} onChange={setLocPart("city")} disabled={!loc.state}>
                  <option value="">City</option>
                  {City.getCitiesOfState(loc.country, loc.state).map((ci) => (
                    <option key={ci.name} value={ci.name}>{ci.name}</option>
                  ))}
                </select>
              </div>
              {form.location && <p className="text-xs text-slate-400 mt-1">{form.location}</p>}
            </Field>
            <Field label="Bio" error={errors.bio}>
              <textarea className={cls("bio")} rows="3" value={form.bio} onChange={set("bio")}
                placeholder="Tell students about yourself (min 20 characters)…" />
            </Field>
            <Field label="LinkedIn URL" error={errors.linkedIn}>
              <input className={cls("linkedIn")} value={form.linkedIn} onChange={set("linkedIn")} placeholder="https://linkedin.com/in/your-name" />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="College" error={errors.college}>
              <input className={cls("college")} value={form.college} onChange={set("college")} placeholder="Your college / university" />
            </Field>
            <Field label="Degree" error={errors.degree}>
              <select className={cls("degree")} value={form.degree} onChange={set("degree")}>
                <option value="">Select degree</option>
                {DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Branch" error={errors.branch}>
              <input className={cls("branch")} value={form.branch} onChange={set("branch")} placeholder="e.g. Computer Science" />
            </Field>
            <Field label="Graduation Year" error={errors.graduationYear}>
              <select className={cls("graduationYear")} value={form.graduationYear} onChange={set("graduationYear")}>
                <option value="">Select year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Current Company" error={errors.company}>
              <input className={cls("company")} value={form.company} onChange={set("company")} placeholder="e.g. Infosys" />
            </Field>
            <Field label="Designation" error={errors.designation}>
              <select className={cls("designation")} value={form.designation} onChange={set("designation")}>
                <option value="">Select designation</option>
                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Years of Experience" error={errors.experience}>
              <input className={cls("experience")} type="number" min="0" max="50" value={form.experience} onChange={set("experience")} placeholder="2" />
            </Field>
            <Field label="Skills (tap to select)" error={errors.skills}>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((s) => {
                  const selected = form.skills.split(",").map((x) => x.trim()).includes(s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSkill(s)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selected
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-800/60 border-slate-600 text-slate-300 hover:border-slate-400"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Price per hour (₹)" error={errors.pricePerHour}>
              <input className={cls("pricePerHour")} type="number" min="50" max="10000" value={form.pricePerHour} onChange={set("pricePerHour")} placeholder="500" />
            </Field>
          </>
        )}

        {step === 4 && (
          <>
            <Field label="Profile Photo">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" className="w-24 h-24 rounded-full object-cover mx-auto mb-3" />
                ) : (
                  <p className="text-slate-400 text-sm mb-3">Choose a clear photo of your face</p>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setPhotoPreview(URL.createObjectURL(f)); uploadFile(f, "photo"); }
                  }}
                  className="block mx-auto text-sm text-slate-300 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer"
                />
                {photoStatus === "uploading" && <p className="text-xs text-indigo-400 mt-2">Uploading…</p>}
                {photoStatus === "done" && <p className="text-xs text-emerald-400 mt-2">✓ Photo uploaded</p>}
                {photoStatus.startsWith("error:") && <p className="text-xs text-red-400 mt-2">{photoStatus.slice(6)}</p>}
              </div>
            </Field>
            <Field label="Verification Document (ID / offer letter)">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                {docName
                  ? <p className="text-slate-300 text-sm mb-3">{docName}</p>
                  : <p className="text-slate-400 text-sm mb-3">Upload your college/company ID or offer letter (image or PDF)</p>}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setDocName(f.name); uploadFile(f, "doc"); }
                  }}
                  className="block mx-auto text-sm text-slate-300 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer"
                />
                {docStatus === "uploading" && <p className="text-xs text-indigo-400 mt-2">Uploading…</p>}
                {docStatus === "done" && <p className="text-xs text-emerald-400 mt-2">✓ Document uploaded</p>}
                {docStatus.startsWith("error:") && <p className="text-xs text-red-400 mt-2">{docStatus.slice(6)}</p>}
              </div>
            </Field>
          </>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep((s) => Math.max(s - 1, 1))}
            disabled={step === 1 || saving}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 disabled:opacity-40"
          >
            Back
          </button>
          {step < 4 ? (
            <button onClick={() => save(false)} disabled={saving}
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-60">
              {saving ? "Saving…" : "Save & Continue"}
            </button>
          ) : (
            <button onClick={() => save(true)} disabled={saving}
              className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-60">
              {saving ? "Submitting…" : "Submit for Approval"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}