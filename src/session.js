// Local accounts for a browser-only app.
// NOTE: there is no server, so accounts live in this browser's storage.
// Passwords are never stored in plain text: they're hashed with PBKDF2
// (Web Crypto), but this protects against casual snooping on this device,
// not against someone with full access to it.

const USERS = "users";
const SESSION = "session";
export const DATA_KEYS = ["incomes", "budgets", "expenses", "loans"];

const hasSessionStorage = () => typeof sessionStorage !== "undefined";

const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

export const getUsers = () => readJSON(USERS) ?? [];
const saveUsers = (users) => localStorage.setItem(USERS, JSON.stringify(users));

const publicUser = ({ passwordHash, salt, ...rest }) => rest;

// ---------- session ----------

export const getSessionUserId = () => {
  try {
    return (
      (hasSessionStorage() && sessionStorage.getItem(SESSION)) ||
      localStorage.getItem(SESSION)
    );
  } catch {
    return null;
  }
};

export const getCurrentUser = () => {
  const id = getSessionUserId();
  if (!id) return null;
  const user = getUsers().find((u) => u.id === id);
  return user ? publicUser(user) : null;
};

// "remember me" keeps you signed in across browser restarts;
// otherwise the session ends when the tab/browser closes.
const startSession = (userId, remember) => {
  endSession();
  if (remember || !hasSessionStorage()) localStorage.setItem(SESSION, userId);
  else sessionStorage.setItem(SESSION, userId);
};

export const endSession = () => {
  localStorage.removeItem(SESSION);
  if (hasSessionStorage()) sessionStorage.removeItem(SESSION);
};

// Each account's data lives under its own prefix.
export const scopedKey = (key) => {
  if (!DATA_KEYS.includes(key)) return key;
  const id = getSessionUserId();
  return id ? `u:${id}:${key}` : key;
};

// ---------- password hashing ----------

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

const hashPassword = async (password, salt) => {
  if (!crypto?.subtle)
    throw new Error("Secure sign-in needs HTTPS or localhost.");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" },
    key,
    256
  );
  return toB64(bits);
};

// compare without bailing early on the first differing character
const safeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

// ---------- validation ----------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const passwordStrength = (pw = "") => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const capped = Math.min(score, 4);
  return {
    score: capped,
    label: ["Too weak", "Weak", "Fair", "Good", "Strong"][capped],
  };
};

export const validateSignUp = ({ name, email, password, confirm }) => {
  const errors = {};
  const cleanName = String(name ?? "").trim();
  const cleanEmail = String(email ?? "").trim().toLowerCase();

  if (!cleanName) errors.name = "Enter your name.";
  else if (cleanName.length > 40) errors.name = "Keep it under 40 characters.";

  if (!EMAIL_RE.test(cleanEmail)) errors.email = "Enter a valid email address.";
  else if (getUsers().some((u) => u.email === cleanEmail))
    errors.email = "An account with this email already exists.";

  if (!password || password.length < 8)
    errors.password = "Use at least 8 characters.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    errors.password = "Include at least one letter and one number.";

  if (password !== confirm) errors.confirm = "Passwords don’t match.";

  return { errors, cleanName, cleanEmail };
};

// ---------- account actions ----------

// The first account adopts data saved before accounts existed.
const migrateLegacyData = (userId) => {
  DATA_KEYS.forEach((key) => {
    const legacy = localStorage.getItem(key);
    if (legacy !== null) {
      localStorage.setItem(`u:${userId}:${key}`, legacy);
      localStorage.removeItem(key);
    }
  });
  localStorage.removeItem("userName");
};

export const signUp = async ({ name, email, password, remember = true }) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: Date.now(),
    salt: toB64(salt),
    passwordHash: await hashPassword(password, salt),
  };
  const users = getUsers();
  if (users.length === 0) migrateLegacyData(user.id);
  saveUsers([...users, user]);
  startSession(user.id, remember);
  return publicUser(user);
};

export const signIn = async ({ email, password, remember }) => {
  const cleanEmail = String(email ?? "").trim().toLowerCase();
  const user = getUsers().find((u) => u.email === cleanEmail);
  // hash even when the user doesn't exist so timing doesn't reveal which emails are registered
  const salt = user ? fromB64(user.salt) : new Uint8Array(16);
  const hash = await hashPassword(String(password ?? ""), salt);
  if (!user || !safeEqual(hash, user.passwordHash))
    throw new Error("Email or password is incorrect.");
  startSession(user.id, remember);
  return publicUser(user);
};

export const deleteCurrentAccount = () => {
  const id = getSessionUserId();
  if (!id) return;
  DATA_KEYS.forEach((key) => localStorage.removeItem(`u:${id}:${key}`));
  saveUsers(getUsers().filter((u) => u.id !== id));
  endSession();
};

// Is there pre-accounts data waiting to be claimed?
export const hasLegacyData = () =>
  getUsers().length === 0 &&
  (localStorage.getItem("userName") !== null ||
    DATA_KEYS.some((k) => localStorage.getItem(k) !== null));
