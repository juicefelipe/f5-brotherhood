// ── DEPENDENCIES ─────────────────────────────────────────────────────────
// No extra packages needed — uses native fetch for Supabase REST API
// Run in your project: npm install (no supabase-js required)
import { useState, useEffect } from "react";

// ── DISCIPLINE DATA ────────────────────────────────────────────────────────
// gate: rep target to clear. gateLabel: display string. timed: true if hold-based not reps.
const DISCIPLINES = [
  {
    letter: "A", title: "Hand Placement", color: "#C0392B",
    baseline: "Standard grip — max unbroken reps",
    levels: [
      { num: 1, name: "Standard Grip",   gate: 20, gateLabel: "20 reps" },
      { num: 2, name: "Wide Grip",       gate: 18, gateLabel: "18 reps" },
      { num: 3, name: "Close Grip",      gate: 15, gateLabel: "15 reps" },
      { num: 4, name: "Diamond",         gate: 12, gateLabel: "12 reps" },
      { num: 5, name: "Sphinx",          gate: 10, gateLabel: "10 reps" },
      { num: 6, name: "Single Arm",      gate: 5,  gateLabel: "5 reps each side" },
    ],
  },
  {
    letter: "B", title: "Tempo & Control", color: "#1A3A5C",
    baseline: "Slow push-ups (3s down, 3s up) — max reps",
    levels: [
      { num: 1, name: "Steady & Controlled", gate: 20, gateLabel: "20 reps" },
      { num: 2, name: "Plank Hold at Top",   gate: 15, gateLabel: "15 reps" },
      { num: 3, name: "Slow Down (3s)",      gate: 15, gateLabel: "15 reps" },
      { num: 4, name: "As Fast as Possible", gate: 20, gateLabel: "20 reps" },
      { num: 5, name: "Bottom Hold (2s)",    gate: 12, gateLabel: "12 reps" },
      { num: 6, name: "Slow Down, Slow Up",  gate: 10, gateLabel: "10 reps" },
    ],
  },
  {
    letter: "C", title: "Range of Motion", color: "#C0392B",
    baseline: "Hands-on-chairs push-ups — max reps",
    levels: [
      { num: 1, name: "Scapular Push-Up",          gate: 20, gateLabel: "20 reps" },
      { num: 2, name: "Hands on Chairs (20in)",    gate: 15, gateLabel: "15 reps" },
      { num: 3, name: "Hands on Books (6in)",      gate: 15, gateLabel: "15 reps" },
      { num: 4, name: "Books + Scapular",          gate: 12, gateLabel: "12 reps" },
      { num: 5, name: "Books + Scapular + Slow 3s",gate: 8,  gateLabel: "8 reps" },
    ],
  },
  {
    letter: "D", title: "Angle & Elevation", color: "#1A3A5C",
    baseline: "Feet-elevated push-ups (low surface) — max reps",
    levels: [
      { num: 1, name: "Feet Elevated (Low)",  gate: 20, gateLabel: "20 reps" },
      { num: 2, name: "Feet Elevated (High)", gate: 15, gateLabel: "15 reps" },
      { num: 3, name: "Pike Push-Up",         gate: 12, gateLabel: "12 reps" },
      { num: 4, name: "Pike + Slow 3s",       gate: 8,  gateLabel: "8 reps" },
      { num: 5, name: "Handstand Hold",       gate: 30, gateLabel: "30 sec hold", timed: true },
      { num: 6, name: "Handstand Push-Up",    gate: 5,  gateLabel: "5 reps" },
    ],
  },
  {
    letter: "E", title: "Rotation & Movement", color: "#C0392B",
    baseline: "Spider push-ups — max reps",
    levels: [
      { num: 1, name: "Left-Right Walking Push-Up",      gate: 10, gateLabel: "10 reps each direction" },
      { num: 2, name: "Push-Up to Side Plank",           gate: 10, gateLabel: "10 reps each side" },
      { num: 3, name: "Thread the Needle",               gate: 10, gateLabel: "10 reps each side" },
      { num: 4, name: "Push-Up to Mountain Climber",     gate: 12, gateLabel: "12 reps" },
      { num: 5, name: "Spider Push-Up",                  gate: 15, gateLabel: "15 reps" },
      { num: 6, name: "Step-Through Push-Up",            gate: 8,  gateLabel: "8 reps each side" },
    ],
  },
  {
    letter: "F", title: "Explosiveness", color: "#1A3A5C",
    baseline: "Slow down / fast up — max reps",
    levels: [
      { num: 1, name: "Hand Release",              gate: 15, gateLabel: "15 reps" },
      { num: 2, name: "Slow Down, Fast Up",        gate: 15, gateLabel: "15 reps" },
      { num: 3, name: "Chest Tap",                 gate: 10, gateLabel: "10 reps" },
      { num: 4, name: "Hand Clap",                 gate: 10, gateLabel: "10 reps" },
      { num: 5, name: "Stay-Low Walking Explosion",gate: 8,  gateLabel: "8 reps each direction" },
      { num: 6, name: "Superman",                  gate: 8,  gateLabel: "8 reps" },
    ],
  },
  {
    letter: "G", title: "Loaded", color: "#C0392B",
    baseline: "Resistance band push-ups — max reps",
    levels: [
      { num: 1, name: "Band Over Shoulders",              gate: 15, gateLabel: "15 reps" },
      { num: 2, name: "Weight Plate on Back",             gate: 12, gateLabel: "12 reps" },
      { num: 3, name: "Plate Turn Push-Up",               gate: 8,  gateLabel: "8 reps each side" },
      { num: 4, name: "Band + Thread the Needle to Plank",gate: 6,  gateLabel: "6 reps each side" },
      { num: 5, name: "Weight Plate + Slow 3s",           gate: 8,  gateLabel: "8 reps" },
      { num: 6, name: "Piggyback",                        gate: 5,  gateLabel: "5 reps" },
    ],
  },
];

const calcGate = (level) => level.gate;

const isSunday = () => new Date().getDay() === 0;

const today = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ── SUPABASE CONFIG ───────────────────────────────────────────────────────
const SUPABASE_URL = "https://plcijuytwvmhchiesxyq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsY2lqdXl0d3ZtaGNoaWVzeHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5OTI5NzEsImV4cCI6MjA5MzU2ODk3MX0.8vdioR0Nu8akkd8qn5QUpMrVQ84_bIs_vNugE39X0z0";

const sbFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error ${res.status}: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const rowToUser = (row) => ({
  name:          row.name,
  firstName:     row.first_name,
  lastName:      row.last_name,
  email:         row.email,
  discIndex:     row.disc_index,
  levelIndex:    row.level_index,
  baseline:      row.baseline,
  baselineMode:  row.baseline_mode,
  log:           row.log || [],
  clearedLevels: row.cleared_levels || [],
});

const userToRow = (u) => ({
  name:           u.name,
  first_name:     u.firstName,
  last_name:      u.lastName,
  email:          u.email,
  disc_index:     u.discIndex,
  level_index:    u.levelIndex,
  baseline:       u.baseline,
  baseline_mode:  u.baselineMode,
  log:            u.log || [],
  cleared_levels: u.clearedLevels || [],
  updated_at:     new Date().toISOString(),
});

// ── STORAGE HELPERS ───────────────────────────────────────────────────────
const loadUser = async (name) => {
  try {
    const rows = await sbFetch(`users?name=eq.${encodeURIComponent(name)}&limit=1`);
    return rows && rows.length > 0 ? rowToUser(rows[0]) : null;
  } catch (e) { console.error("loadUser:", e); return null; }
};

const saveUser = async (_name, data) => {
  try {
    await sbFetch("users", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(userToRow(data)),
    });
  } catch (e) { console.error("saveUser:", e); }
};

const loadAllUsers = async () => {
  try {
    const rows = await sbFetch("users?order=updated_at.desc");
    return rows ? rows.map(rowToUser) : [];
  } catch (e) { console.error("loadAllUsers:", e); return []; }
};

// ── STYLES ────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0D1B2A;
    --steel: #1A3A5C;
    --red: #C0392B;
    --gold: #D4A017;
    --white: #FFFFFF;
    --offwhite: #F0F4F8;
    --gray: #8A9BB0;
    --light: #E8EEF4;
  }

  body { background: var(--navy); font-family: 'Barlow', sans-serif; color: var(--white); min-height: 100vh; }

  .app { max-width: 480px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }

  /* HEADER */
  .header { background: var(--steel); padding: 16px 20px 14px; border-bottom: 3px solid var(--red); }
  .header-top { display: flex; align-items: center; justify-content: space-between; }
  .logo-mark { width: 38px; height: 38px; background: var(--navy); border-radius: 50%; border: 2px solid var(--white); display: flex; align-items: center; justify-content: center; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 14px; letter-spacing: -1px; }
  .header-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 20px; letter-spacing: 1px; text-transform: uppercase; }
  .header-sub { font-size: 11px; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; margin-top: 1px; }
  .sunday-badge { background: var(--red); color: white; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 3px; letter-spacing: 1px; }

  /* TABS */
  .tabs { display: flex; background: var(--navy); border-bottom: 1px solid #1E3A5C; }
  .tab { flex: 1; padding: 12px 4px; text-align: center; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--gray); cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; }
  .tab.active { color: var(--white); border-bottom-color: var(--red); }

  /* CONTENT */
  .content { flex: 1; padding: 16px; overflow-y: auto; }

  /* USER SELECT */
  .user-screen { display: flex; flex-direction: column; gap: 20px; padding-top: 8px; }
  .screen-label { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
  .input-row { display: flex; gap: 8px; }
  .text-input { flex: 1; background: #0D1B2A; border: 1.5px solid var(--steel); border-radius: 6px; color: var(--white); font-family: 'Barlow', sans-serif; font-size: 15px; padding: 10px 14px; outline: none; }
  .text-input:focus { border-color: var(--red); }
  .btn { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
  .btn-red { background: var(--red); color: white; }
  .btn-red:hover { background: #a93226; }
  .btn-steel { background: var(--steel); color: white; }
  .btn-steel:hover { background: #254d70; }
  .btn-outline { background: transparent; border: 1.5px solid var(--steel); color: var(--gray); }
  .btn-outline:hover { border-color: var(--red); color: var(--white); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-gold { background: var(--gold); color: var(--navy); }

  /* MEMBER CARDS */
  .member-list { display: flex; flex-direction: column; gap: 8px; }
  .member-card { background: #0D1B2A; border: 1.5px solid var(--steel); border-radius: 8px; padding: 12px 14px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: space-between; }
  .member-card:hover { border-color: var(--red); background: #121f2e; }
  .member-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 17px; text-transform: uppercase; letter-spacing: 0.5px; }
  .member-status { font-size: 12px; color: var(--gray); margin-top: 2px; }
  .disc-badge { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 22px; color: var(--red); min-width: 36px; text-align: right; }

  /* DASHBOARD */
  .dash { display: flex; flex-direction: column; gap: 14px; }
  .user-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .user-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 26px; text-transform: uppercase; letter-spacing: 1px; }
  .card { background: #0D1B2A; border-radius: 10px; padding: 16px; border: 1.5px solid #1E3A5C; }
  .card-label { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
  .disc-header { display: flex; align-items: flex-start; gap: 14px; }
  .disc-letter-big { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 64px; line-height: 1; color: var(--red); }
  .disc-info { flex: 1; }
  .disc-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
  .level-name { font-size: 13px; color: var(--gray); margin-top: 2px; }
  .level-tag { display: inline-block; background: var(--steel); color: var(--white); font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px; padding: 3px 10px; border-radius: 4px; margin-top: 6px; letter-spacing: 1px; }

  /* GATE PROGRESS */
  .gate-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px; }
  .gate-num { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; color: var(--gray); }
  .gate-num span { font-size: 28px; font-weight: 900; color: var(--white); }
  .gate-num.target span { color: var(--gold); }
  .gate-arrow { font-size: 18px; color: var(--steel); padding-bottom: 4px; }
  .progress-bar { height: 8px; background: #1E3A5C; border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--steel), var(--red)); transition: width 0.4s ease; }
  .progress-fill.done { background: linear-gradient(90deg, #27ae60, #2ecc71); }
  .gate-status { margin-top: 8px; font-size: 12px; color: var(--gray); text-align: right; }
  .gate-cleared { color: #2ecc71; font-weight: 700; font-size: 13px; }

  /* BASELINE CARD */
  .baseline-card { background: #1a2e1a; border: 1.5px solid #2ecc71; border-radius: 10px; padding: 14px 16px; }
  .baseline-card .card-label { color: #2ecc71; }
  .baseline-val { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 42px; color: #2ecc71; line-height: 1; }
  .baseline-sub { font-size: 12px; color: #6aab6a; margin-top: 2px; }

  /* LOG REPS */
  .log-card { background: #0D1B2A; border: 1.5px solid var(--red); border-radius: 10px; padding: 16px; }
  .rep-input-row { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
  .rep-input { width: 90px; background: #121f2e; border: 2px solid var(--steel); border-radius: 6px; color: var(--white); font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: 900; padding: 8px 12px; text-align: center; outline: none; }
  .rep-input:focus { border-color: var(--red); }
  .log-btn { flex: 1; padding: 14px; font-size: 16px; border-radius: 6px; }

  /* BASELINE MODE */
  .baseline-mode { background: #1a1a00; border: 1.5px solid var(--gold); border-radius: 10px; padding: 16px; }
  .baseline-mode .card-label { color: var(--gold); }
  .baseline-instruct { font-size: 13px; color: #b8960c; margin-bottom: 12px; line-height: 1.5; }

  /* HISTORY */
  .history-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
  .history-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #121f2e; border-radius: 6px; border-left: 3px solid var(--steel); }
  .history-row.gate-hit { border-left-color: #2ecc71; }
  .history-date { font-size: 11px; color: var(--gray); }
  .history-info { font-size: 12px; color: var(--gray); }
  .history-reps { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 20px; color: var(--white); }

  /* LEADERBOARD */
  .lb-list { display: flex; flex-direction: column; gap: 8px; }
  .lb-row { display: flex; align-items: center; gap: 12px; background: #0D1B2A; border-radius: 8px; padding: 12px 14px; border: 1.5px solid #1E3A5C; }
  .lb-rank { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 22px; color: var(--steel); min-width: 28px; }
  .lb-rank.top { color: var(--gold); }
  .lb-info { flex: 1; }
  .lb-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 16px; text-transform: uppercase; }
  .lb-detail { font-size: 11px; color: var(--gray); margin-top: 2px; }
  .lb-score { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 24px; color: var(--red); }

  /* REFERENCE */
  .ref-disc { background: #0D1B2A; border-radius: 10px; border: 1.5px solid #1E3A5C; overflow: hidden; margin-bottom: 10px; }
  .ref-disc-header { background: var(--steel); padding: 12px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; }
  .ref-disc-letter { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 30px; color: var(--red); min-width: 28px; }
  .ref-disc-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
  .ref-disc-baseline { font-size: 11px; color: var(--gold); margin-top: 2px; }
  .ref-levels { padding: 8px 0; }
  .ref-level { display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-bottom: 1px solid #1E3A5C; }
  .ref-level:last-child { border-bottom: none; }
  .ref-lv-tag { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 12px; background: var(--red); color: white; padding: 2px 7px; border-radius: 3px; min-width: 34px; text-align: center; }
  .ref-lv-name { font-size: 13px; color: var(--offwhite); }
  .chevron { font-size: 12px; color: var(--gray); margin-left: auto; transition: transform 0.2s; }
  .chevron.open { transform: rotate(180deg); }

  /* TOAST */
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #2ecc71; color: #0a1f0a; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 15px; padding: 10px 24px; border-radius: 8px; letter-spacing: 1px; z-index: 999; animation: toastIn 0.3s ease; }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

  .divider { height: 1px; background: #1E3A5C; margin: 4px 0; }
  .empty-state { text-align: center; color: var(--gray); font-size: 13px; padding: 24px 0; }
  .email-note { font-size: 11px; color: var(--gray); margin-top: 5px; }

`;

// ── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [view, setView] = useState("select"); // select | dash
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [repInput, setRepInput] = useState("");
  const [toast, setToast] = useState(null);
  const [expandedDisc, setExpandedDisc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllUsers().then(u => { setAllUsers(u); setLoading(false); });
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const selectUser = async (name) => {
    const data = await loadUser(name);
    if (data) {
      setCurrentUser(data);
      setView("dash");
    }
  };

  const submitToBeehiiv = async (firstName, lastName, email) => {
    if (!email) return;
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, first_name: firstName, last_name: lastName }),
      });
      const data = await res.json();
      console.log("Beehiiv:", data);
    } catch (e) { console.log("Beehiiv error:", e); }
  };

  const createUser = async () => {
    const firstName = firstNameInput.trim();
    const lastName = lastNameInput.trim();
    const email = emailInput.trim();
    if (!firstName || !lastName || !email) return;
    const fullName = `${firstName} ${lastName}`;
    const existing = await loadUser(fullName);
    if (existing) {
      selectUser(fullName);
      setFirstNameInput(""); setLastNameInput(""); setEmailInput("");
      return;
    }
    const newUser = {
      name: fullName, firstName, lastName, email,
      discIndex: 0, levelIndex: 0,
      baseline: null, baselineMode: true,
      log: [], clearedLevels: [],
    };
    await saveUser(fullName, newUser);
    await submitToBeehiiv(firstName, lastName, email, "");
    setCurrentUser(newUser);
    setAllUsers(prev => [...prev.filter(u => u.name !== fullName), newUser]);
    setFirstNameInput(""); setLastNameInput(""); setEmailInput("");
    setView("dash");
  };

  const disc = currentUser ? DISCIPLINES[currentUser.discIndex] : null;
  const level = currentUser && disc ? disc.levels[currentUser.levelIndex] : null;
  const gate = level ? calcGate(level) : null;
  const lastRep = currentUser?.log?.filter(l => !l.isBaseline).slice(-1)[0]?.reps ?? null;

  const logReps = async () => {
    const reps = parseInt(repInput);
    if (!reps || reps < 1 || !currentUser) return;

    let updated = { ...currentUser };

    if (updated.baselineMode) {
      // Setting baseline
      const entry = { date: today(), reps, isBaseline: true, disc: disc.letter, level: 0 };
      updated.baseline = reps;
      updated.baselineMode = false;
      updated.log = [...(updated.log || []), entry];
      showToast(`Baseline set: ${reps} reps`);
    } else {
      // Normal log
      const entry = {
        date: today(), reps, isBaseline: false,
        disc: disc.letter, levelNum: level.num, levelName: level.name,
      };
      updated.log = [...(updated.log || []), entry];
      const currentLevel = DISCIPLINES[updated.discIndex].levels[updated.levelIndex];
      const g = calcGate(currentLevel);
      if (reps >= g) {
        // Gate cleared — advance
        const levelKey = `${disc.letter}-${level.num}`;
        if (!updated.clearedLevels.includes(levelKey)) {
          updated.clearedLevels = [...updated.clearedLevels, levelKey];
        }
        const nextLevelIdx = updated.levelIndex + 1;
        if (nextLevelIdx < disc.levels.length) {
          updated.levelIndex = nextLevelIdx;
          showToast(`🔓 Gate cleared! Now on ${disc.letter}-${disc.levels[nextLevelIdx].num}`);
        } else {
          // Advance discipline
          const nextDiscIdx = updated.discIndex + 1;
          if (nextDiscIdx < DISCIPLINES.length) {
            updated.discIndex = nextDiscIdx;
            updated.levelIndex = 0;
            updated.baseline = null;
            updated.baselineMode = true;
            showToast(`⚡ Discipline ${disc.letter} complete! Starting ${DISCIPLINES[nextDiscIdx].letter}`);
          } else {
            showToast("🏆 CHALLENGE COMPLETE!");
          }
        }
      } else {
        showToast(`${reps} reps logged. Gate: ${reps}/${g}`);
      }
    }

    await saveUser(updated.name, updated);
    setCurrentUser(updated);
    setAllUsers(prev => prev.map(u => u.name === updated.name ? updated : u));
    setRepInput("");
  };

  const resetBaseline = async () => {
    if (!currentUser) return;
    const updated = { ...currentUser, baselineMode: true, baseline: null };
    await saveUser(updated.name, updated);
    setCurrentUser(updated);
  };

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* HEADER */}
        <div className="header">
          <div className="header-top">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="logo-mark">F5</div>
              <div>
                <div className="header-title">Push-Up Challenge</div>
                <div className="header-sub">The F5 Brotherhood</div>
              </div>
            </div>
            {isSunday() && <div className="sunday-badge">REST DAY</div>}
            {view === "dash" && (
              <button className="btn btn-outline btn-sm" onClick={() => setView("select")}>
                ← Back
              </button>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          {[["home", "Today"], ["board", "Board"], ["ref", "Guide"]].map(([key, label]) => (
            <div key={key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              {label}
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div className="content">
          {tab === "home" && (
            view === "select" ? (
              <SelectScreen
                firstNameInput={firstNameInput} setFirstNameInput={setFirstNameInput}
                lastNameInput={lastNameInput} setLastNameInput={setLastNameInput}
                emailInput={emailInput} setEmailInput={setEmailInput}
                createUser={createUser} allUsers={allUsers}
                selectUser={selectUser} loading={loading}
              />
            ) : currentUser ? (
              <Dashboard
                user={currentUser} disc={disc} level={level} gate={gate} lastRep={lastRep}
                repInput={repInput} setRepInput={setRepInput}
                logReps={logReps} resetBaseline={resetBaseline}
              />
            ) : null
          )}

          {tab === "board" && <Leaderboard allUsers={allUsers} loading={loading} />}

          {tab === "ref" && (
            <RefGuide expandedDisc={expandedDisc} setExpandedDisc={setExpandedDisc} />
          )}
        </div>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}

// ── SELECT SCREEN ─────────────────────────────────────────────────────────
function SelectScreen({
  firstNameInput, setFirstNameInput, lastNameInput, setLastNameInput,
  emailInput, setEmailInput, createUser, allUsers, selectUser, loading
}) {
  const fullName = `${firstNameInput.trim()} ${lastNameInput.trim()}`.trim();
  const isReturning = allUsers.some(u => u.name.toLowerCase() === fullName.toLowerCase());
  const canSubmit = firstNameInput.trim() && lastNameInput.trim() && emailInput.trim();

  return (
    <div className="user-screen">
      <div>
        <div className="screen-label">Join the Challenge</div>

        <div className="input-row" style={{ marginBottom: 10 }}>
          <input
            className="text-input" placeholder="First name"
            value={firstNameInput} onChange={e => setFirstNameInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && canSubmit && createUser()}
          />
          <input
            className="text-input" placeholder="Last name"
            value={lastNameInput} onChange={e => setLastNameInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && canSubmit && createUser()}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <input
            className="text-input" style={{ width: "100%" }} placeholder="Email address" type="email"
            value={emailInput} onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && canSubmit && createUser()}
          />
        </div>

        <button
          className="btn btn-red"
          style={{ width: "100%", padding: "13px", opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? "pointer" : "default" }}
          onClick={canSubmit ? createUser : undefined}
        >
          {isReturning ? "Continue" : "Let's Go"}
        </button>
      </div>

      {!loading && allUsers.length > 0 && (
        <div>
          <div className="screen-label">Brotherhood</div>
          <div className="member-list">
            {allUsers.map(u => {
              const d = DISCIPLINES[u.discIndex];
              const lv = d?.levels[u.levelIndex];
              return (
                <div key={u.name} className="member-card" onClick={() => selectUser(u.name)}>
                  <div>
                    <div className="member-name">{u.name}</div>
                    <div className="member-status">
                      {u.baselineMode
                        ? `Disc ${d?.letter} — Baseline needed`
                        : `Disc ${d?.letter}-${lv?.num} · Gate: ${lv?.gateLabel ?? lv?.gate ?? "—"}`}
                    </div>
                  </div>
                  <div className="disc-badge">{d?.letter}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && <div className="empty-state">Loading brotherhood...</div>}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────
function Dashboard({ user, disc, level, gate, lastRep, repInput, setRepInput, logReps, resetBaseline }) {
  const numGate = gate;
  const pct = numGate && lastRep ? Math.min(100, Math.round((lastRep / numGate) * 100)) : 0;
  const cleared = lastRep && gate && lastRep >= gate;
  const recentLog = [...(user.log || [])].reverse().slice(0, 5);

  return (
    <div className="dash">
      <div className="user-bar">
        <div className="user-name">{user.name}</div>
      </div>

      {/* CURRENT POSITION */}
      <div className="card">
        <div className="card-label">Current Discipline</div>
        <div className="disc-header">
          <div className="disc-letter-big">{disc?.letter}</div>
          <div className="disc-info">
            <div className="disc-name">{disc?.title}</div>
            {!user.baselineMode && (
              <>
                <div className="level-name">{level?.name}</div>
                <div className="level-tag">{disc?.letter}-{level?.num}</div>
              </>
            )}
            {user.baselineMode && (
              <div className="level-name" style={{ color: "#D4A017", marginTop: 4 }}>
                ★ Baseline Test Required
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BASELINE */}
      {user.baseline && (
        <div className="baseline-card">
          <div className="card-label">Baseline</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
            <div>
              <div className="baseline-val">{user.baseline}</div>
              <div className="baseline-sub">reps recorded</div>
            </div>
            <button className="btn btn-outline btn-sm" style={{ marginBottom: 4 }} onClick={resetBaseline}>
              Reset
            </button>
          </div>
        </div>
      )}

      {/* GATE PROGRESS */}
      {!user.baselineMode && gate && (
        <div className="card">
          <div className="card-label">Gate Progress</div>
          <div className="gate-row">
            <div className="gate-num">
              Last effort<br /><span>{lastRep ?? "—"}</span>
            </div>
            <div className="gate-arrow">→</div>
            <div className="gate-num target">
              Gate target<br /><span>{level?.gateLabel ?? gate}</span>
            </div>
          </div>
          <div className="progress-bar">
            <div className={`progress-fill ${cleared ? "done" : ""}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="gate-status">
            {cleared
              ? <span className="gate-cleared">✓ Gate cleared — log to advance</span>
              : (
                <>
                  <span>{lastRep ? Math.max(0, numGate - lastRep) : numGate} reps to gate</span>
                  <span style={{display:"block", fontSize:10, color:"var(--gold)", marginTop:3, fontStyle:"italic"}}>
                    Can't hit the gate? Rest 2 minutes and try again.
                  </span>
                </>
              )}
          </div>
        </div>
      )}

      {/* LOG REPS */}
      <div className="log-card">
        <div className="card-label">
          {user.baselineMode ? "Log Baseline Test" : "Log Today's Set"}
        </div>
        {!user.baselineMode && (
          <div style={{fontSize:11, color:"var(--gray)", marginBottom:6, fontStyle:"italic"}}>
            One set is intentional. Show up every day and the reps will come.
          </div>
        )}
        {user.baselineMode && (
          <div style={{ fontSize: 12, color: "#b8960c", marginBottom: 8, lineHeight: 1.5 }}>
            {disc?.baseline}
          </div>
        )}
        <div className="rep-input-row">
          <input
            className="rep-input" type="number" min="1" max="999"
            placeholder="0" value={repInput}
            onChange={e => setRepInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && logReps()}
          />
          <button className="btn btn-red log-btn" onClick={logReps}>
            {user.baselineMode ? "Set Baseline" : "Log Reps"}
          </button>
        </div>
      </div>

      {/* RECENT LOG */}
      {recentLog.length > 0 && (
        <div className="card">
          <div className="card-label">Recent Sessions</div>
          <div className="history-list">
            {recentLog.map((entry, i) => (
              <div key={i} className={`history-row ${!entry.isBaseline && gate && entry.reps >= gate ? "gate-hit" : ""}`}>
                <div>
                  <div className="history-date">{entry.date}</div>
                  <div className="history-info">
                    {entry.isBaseline ? "Baseline Test" : `${entry.disc}-${entry.levelNum} · ${entry.levelName}`}
                  </div>
                </div>
                <div className="history-reps">{entry.reps}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── LEADERBOARD ───────────────────────────────────────────────────────────
function Leaderboard({ allUsers, loading }) {
  const scored = allUsers
    .map(u => ({
      name: u.name,
      discIndex: u.discIndex,
      levelIndex: u.levelIndex,
      score: u.discIndex * 10 + u.levelIndex,
      disc: DISCIPLINES[u.discIndex],
      level: DISCIPLINES[u.discIndex]?.levels[u.levelIndex],
      totalReps: (u.log || []).reduce((s, e) => s + (e.isBaseline ? 0 : e.reps), 0),
      sessions: (u.log || []).filter(e => !e.isBaseline).length,
    }))
    .sort((a, b) => b.score - a.score || b.totalReps - a.totalReps);

  if (loading) return <div className="empty-state">Loading...</div>;
  if (scored.length === 0) return <div className="empty-state">No members yet. Be the first.</div>;

  return (
    <div>
      <div className="screen-label" style={{ marginBottom: 12 }}>Brotherhood Board</div>
      <div className="lb-list">
        {scored.map((u, i) => (
          <div key={u.name} className="lb-row">
            <div className={`lb-rank ${i === 0 ? "top" : ""}`}>
              {i === 0 ? "★" : `${i + 1}`}
            </div>
            <div className="lb-info">
              <div className="lb-name">{u.name}</div>
              <div className="lb-detail">
                Disc {u.disc?.letter}-{u.level?.num} · {u.sessions} sessions · {u.totalReps} total reps
              </div>
            </div>
            <div className="lb-score">{u.disc?.letter}{u.level?.num}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── REFERENCE GUIDE ───────────────────────────────────────────────────────
function RefGuide({ expandedDisc, setExpandedDisc }) {
  return (
    <div>
      <div className="screen-label" style={{ marginBottom: 12 }}>Discipline Guide</div>
      {DISCIPLINES.map(d => (
        <div key={d.letter} className="ref-disc">
          <div className="ref-disc-header" onClick={() => setExpandedDisc(expandedDisc === d.letter ? null : d.letter)}>
            <div className="ref-disc-letter">{d.letter}</div>
            <div style={{ flex: 1 }}>
              <div className="ref-disc-title">{d.title}</div>
              <div className="ref-disc-baseline">{d.baseline}</div>
            </div>
            <div className={`chevron ${expandedDisc === d.letter ? "open" : ""}`}>▼</div>
          </div>
          {expandedDisc === d.letter && (
            <div className="ref-levels">
              {d.levels.map(lv => (
                <div key={lv.num} className="ref-level">
                  <div className="ref-lv-tag">{d.letter}-{lv.num}</div>
                  <div className="ref-lv-name">{lv.name}</div>
                  <div style={{fontSize:10, color:"var(--gold)", marginLeft:"auto"}}>{lv.gateLabel}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
