import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";

export default function AuthPage() {
  const [tab, setTab] = useState("signin");
  const [mode, setMode] = useState("password"); // password | otp
  const [step, setStep] = useState("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const upgradeIfMentor = async (token, user) => {
    if (tab === "signup" && role === "mentor" && user.role === "student") {
      localStorage.setItem("pt_token", token);
      const up = await api.post("/mentors/become", {});
      login(token, up.data.user);
    }
  };

  const submitPassword = async () => {
    setErr(""); setLoading(true);
    try {
      const url = tab === "signup" ? "/auth/register" : "/auth/login";
      const body = tab === "signup" ? { name, email, password, role } : { email, password };
      const res = await api.post(url, body);
      const { token, user } = res.data;
      if (tab === "signin" && user.role !== role && user.role !== "admin") {
        setErr(`This account is registered as a ${user.role}. Switch the toggle.`);
        setLoading(false);
        return;
      }
      login(token, user);
      await upgradeIfMentor(token, user);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const requestOtp = async () => {
    setErr(""); setLoading(true);
    try {
      const body = tab === "signup" ? { email, name } : { email };
      const res = await api.post("/auth/request-otp", body);
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
      setStep("otp");
    } catch (e) {
      setErr(e.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setErr(""); setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      const { token, user } = res.data;
      login(token, user);
      await upgradeIfMentor(token, user);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.message || "Invalid OTP");
    } finally { setLoading(false); }
  };

  const canSubmit = mode === "password"
    ? email && password && (tab === "signin" || name)
    : email && (tab === "signin" || name);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }} className="flex items-center gap-4 mb-8">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center glow">
          <GraduationCap className="text-white" size={28} />
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold text-white">PlacementTutor</h1>
          <p className="text-sm text-gray-400">1:1 College Mentorship</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="glass rounded-2xl p-8 w-full max-w-md glow">
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div key="form" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.25 }}>
              <div className="flex bg-card2 rounded-xl p-1 mb-6">
                {["signin", "signup"].map((t) => (
                  <button key={t} onClick={() => { setTab(t); setErr(""); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      tab === t ? "bg-brand-500 text-white glow" : "text-gray-400"}`}>
                    {t === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              {tab === "signup" && (
                <div className="mb-4">
                  <label className="text-xs tracking-widest text-gray-400">FULL NAME</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe"
                    className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 transition-colors" />
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs tracking-widest text-gray-400">EMAIL</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@demo.io"
                  className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 transition-colors" />
              </div>

              {mode === "password" && (
                <div className="mb-4">
                  <label className="text-xs tracking-widest text-gray-400">PASSWORD</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && canSubmit && submitPassword()}
                    className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 transition-colors" />
                  {tab === "signup" && <p className="text-[11px] text-gray-500 mt-1">Minimum 6 characters</p>}
                </div>
              )}

              {(
                <div className="mb-4">
                  <label className="text-xs tracking-widest text-gray-400">I AM A</label>
                  <div className="flex gap-2 mt-1">
                    {["student", "mentor"].map((r) => (
                      <button key={r} onClick={() => setRole(r)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                          role === r ? "bg-brand-500 text-white glow" : "bg-card2 text-gray-400 border border-line"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {err && <p className="text-red-400 text-sm mb-3">{err}</p>}

              <motion.button whileTap={{ scale: 0.97 }}
                onClick={mode === "password" ? submitPassword : requestOtp}
                disabled={loading || !canSubmit}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-50">
                {loading
                  ? "Please wait..."
                  : mode === "password"
                  ? (tab === "signin" ? "Sign In" : "Create Account")
                  : "Request OTP"}
              </motion.button>

              <button
                onClick={() => { setMode(mode === "password" ? "otp" : "password"); setErr(""); }}
                className="w-full mt-4 text-sm text-gray-400 hover:text-white transition-colors">
                {mode === "password" ? "Use OTP instead" : "Use password instead"}
              </button>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="text-center">
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
                className="w-16 h-16 mx-auto rounded-full bg-card2 flex items-center justify-center mb-4">
                <Smartphone className="text-brand-400" size={28} />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-1">Verify with OTP</h2>
              <p className="text-sm text-gray-400 mb-5">Enter the 6-digit code sent to {email}</p>

              {devOtp && (
                <div className="bg-card2 border border-brand-500/40 rounded-xl p-4 mb-5 text-left">
                  <p className="text-xs tracking-widest text-brand-400 mb-1">✦ DEV MODE</p>
                  <p className="text-gray-300 text-sm">Your verification code is</p>
                  <p className="text-3xl font-mono font-bold text-white tracking-[0.4em]">{devOtp}</p>
                </div>
              )}

              <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                className="w-full text-center text-2xl tracking-[0.5em] bg-card2 border border-brand-500 rounded-xl px-4 py-4 outline-none mb-4" />

              {err && <p className="text-red-400 text-sm mb-3">{err}</p>}

              <motion.button whileTap={{ scale: 0.97 }} onClick={verifyOtp} disabled={loading || otp.length !== 6}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-50 mb-3">
                {loading ? "Verifying..." : "Verify & Sign In"}
              </motion.button>
              <button onClick={() => { setStep("form"); setOtp(""); setErr(""); }}
                className="text-gray-400 text-sm hover:text-white">Back</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}