import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Smartphone, Lock, Zap, ShieldCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import { GoogleLogin } from "@react-oauth/google";
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
    setErr("");
    // SIGNUP: verify email via OTP before creating the account
    if (tab === "signup") {
      if (password.length < 6) { setErr("Password must be at least 6 characters"); return; }
      return requestOtp();
    }
    // SIGNIN: normal password login
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;
      if (user.role !== role && user.role !== "admin") {
        setErr(`This account is registered as a ${user.role}. Switch the toggle.`);
        setLoading(false);
        return;
      }
      login(token, user);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };
const loginWithGoogle = async (credential) => {
    setErr(""); setLoading(true);
    try {
      const res = await api.post("/auth/google", { credential });
      const { token, user } = res.data;
      login(token, user);
      await upgradeIfMentor(token, user);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.message || "Google sign-in failed");
    } finally { setLoading(false); }
  };
  const requestOtp = async () => {
    setErr(""); setLoading(true);
    try {
      const body = tab === "signup" ? { email, name, isSignup: true } : { email };
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
      let { token, user } = res.data;
      // SIGNUP: email is now verified — set the chosen password / create the account
      if (tab === "signup" && password) {
        const reg = await api.post("/auth/register", { name, email, password, role });
        token = reg.data.token;
        user = reg.data.user;
      }
      if (tab === "signin" && user.role !== role && user.role !== "admin") {
        setErr(`This account is registered as a ${user.role}. Switch the toggle.`);
        setLoading(false);
        return;
      }
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
  const features = [
    { icon: Lock, text: "Atomic slot locking — no double bookings, ever", short: "No double bookings, ever" },
    { icon: ShieldCheck, text: "Secure Razorpay payments with signature verification", short: "Secure Razorpay payments" },
    { icon: Zap, text: "OTP or password login. Your choice.", short: "OTP or password login" },
  ];
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* ── LEFT: HERO ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }} className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-card2 border border-line rounded-full px-4 py-1.5 mb-6">
            <Users size={13} className="text-brand-400" />
            <span className="text-xs text-gray-300 tracking-wide">1:1 mentorship for campus placements</span>
          </div>
          <h1 style={{ fontFamily: "'Unbounded', sans-serif", letterSpacing: "-0.02em" }}
            className="text-[2rem] leading-[1.1] md:text-6xl md:leading-[1.05] font-black text-white mb-4 md:mb-6">
            Crack your dream{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-brand-500 bg-clip-text text-transparent">
              placement
            </span>{" "}
            with 1:1 mentors.
          </h1>
          <p className="text-gray-400 text-sm md:text-lg mb-5 md:mb-8 max-w-xs md:max-w-md mx-auto md:mx-0">
            Book verified mentors from top companies.
            <span className="hidden md:inline"> Pick a slot, pay securely, get a meeting link. That's it.</span>
          </p>
          <div className="space-y-2 md:space-y-3 w-fit mx-auto md:w-auto md:mx-0">
            {features.map(({ icon: Icon, text, short }, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.12 }}
                className="flex items-center gap-2.5 md:gap-3 text-left">
                <div className="w-7 h-7 md:w-9 md:h-9 shrink-0 rounded-lg bg-card2 border border-line flex items-center justify-center">
                  <Icon size={14} className="text-brand-400" />
                </div>
                <span className="text-xs md:text-sm text-gray-300">
                  <span className="md:hidden">{short}</span>
                  <span className="hidden md:inline">{text}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        {/* ── RIGHT: AUTH CARD ── */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="glass rounded-2xl p-8 w-full max-w-md mx-auto glow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center glow">
              <GraduationCap className="text-white" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">PlacementTutor</h2>
              <p className="text-xs text-gray-400">Sign in to get started</p>
            </div>
          </div>
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
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu"
                    onKeyDown={(e) => e.key === "Enter" && canSubmit && !loading && (mode === "password" ? submitPassword() : requestOtp())}
                    className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 transition-colors" />
                </div>
                {mode === "password" && (
                  <div className="mb-4">
                    <label className="text-xs tracking-widest text-gray-400">PASSWORD</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      onKeyDown={(e) => e.key === "Enter" && canSubmit && submitPassword()}
                      className="w-full mt-1 bg-card2 border border-line rounded-xl px-4 py-3 outline-none focus:border-brand-500 transition-colors" />
                    {tab === "signup" && <p className="text-[11px] text-gray-500 mt-1">Minimum 6 characters · we'll email you a code to verify</p>}
                  </div>
                )}
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
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    Admins are detected automatically — any toggle works.
                  </p>
                </div>
                {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={mode === "password" ? submitPassword : requestOtp}
                  disabled={loading || !canSubmit}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-50">
                  {loading
                    ? "Please wait..."
                    : mode === "password"
                    ? (tab === "signin" ? "Sign In" : "Create Account →")
                    : "Request OTP →"}
                </motion.button>
                <button
                  onClick={() => { setMode(mode === "password" ? "otp" : "password"); setErr(""); }}
                  className="w-full mt-4 text-sm text-gray-400 hover:text-white transition-colors">
                  {mode === "password" ? "Use OTP instead" : "Use password instead"}
                </button>
               {role !== "mentor" && (
                  <>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-line" />
                      <span className="text-xs text-gray-500">or</span>
                      <div className="flex-1 h-px bg-line" />
                    </div>
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={(cred) => loginWithGoogle(cred.credential)}
                        onError={() => setErr("Google sign-in failed")}
                        theme="filled_black"
                        shape="pill"
                        text="continue_with"
                      />
                    </div>
                  </>
                )}
               <p className="text-[11px] text-gray-500 text-center mt-5 leading-relaxed font-mono">
                  Demo accounts:{" "}
                  <span className="text-gray-400">student@demo.com / student123</span>
                  <br />
                  <span className="text-gray-400">mentor@test.com / mentor123</span>
                  {" · "}
                  <span className="text-gray-400">admin@pttutor.com / admin123</span>
                </p>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="text-center">
                <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
                  className="w-16 h-16 mx-auto rounded-full bg-card2 flex items-center justify-center mb-4">
                  <Smartphone className="text-brand-400" size={28} />
                </motion.div>
                <h2 className="text-xl font-bold text-white mb-1">Verify your email</h2>
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
                  onKeyDown={(e) => e.key === "Enter" && otp.length === 6 && !loading && verifyOtp()}
                  className="w-full text-center text-2xl tracking-[0.5em] bg-card2 border border-brand-500 rounded-xl px-4 py-4 outline-none mb-4" />
                {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
                <motion.button whileTap={{ scale: 0.97 }} onClick={verifyOtp} disabled={loading || otp.length !== 6}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-400 glow disabled:opacity-50 mb-3">
                  {loading ? "Verifying..." : (tab === "signup" ? "Verify & Create Account" : "Verify & Sign In")}
                </motion.button>
                <button onClick={() => { setStep("form"); setOtp(""); setErr(""); }}
                  className="text-gray-400 text-sm hover:text-white">Back</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}