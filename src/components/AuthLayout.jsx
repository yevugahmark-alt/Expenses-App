import { useState } from "react";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import logomark from "../assets/logomark.svg";
import { ThemeButton } from "./ThemeToggle";

const FEATURES = [
  "Record income and see exactly what’s left",
  "Fund every budget from a real income source",
  "Track spending with search, filters and CSV export",
];

// Decorative preview of the app shown on the brand panel.
const PreviewCard = () => (
  <div className="auth-preview" aria-hidden="true">
    <div className="auth-preview-card">
      <small>Available balance</small>
      <strong>GHS 2,804.50</strong>
      <div className="auth-preview-bar">
        <span style={{ width: "51%" }} />
        <span style={{ width: "12%" }} />
      </div>
    </div>
    <div className="auth-preview-row">
      <span className="flow-icon flow-icon--in">
        <ArrowDownLeftIcon width={14} />
      </span>
      <div>
        <b>Salary</b>
        <small>Income</small>
      </div>
      <em className="in">+GHS 4,500.00</em>
    </div>
    <div className="auth-preview-row">
      <span className="flow-icon flow-icon--out">
        <ArrowUpRightIcon width={14} />
      </span>
      <div>
        <b>Groceries</b>
        <small>Shoprite run</small>
      </div>
      <em>−GHS 320.50</em>
    </div>
  </div>
);

export const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="auth">
    <aside className="auth-brand">
      <div className="auth-brand-top">
        <span className="brand-mark brand-mark--light">
          <img src={logomark} alt="" width={20} height={20} />
        </span>
        <span>HomeBudget</span>
      </div>

      <div className="auth-brand-body">
        <h2>
          Your money,
          <br />
          beautifully organised.
        </h2>
        <ul>
          {FEATURES.map((f) => (
            <li key={f}>
              <CheckCircleIcon width={18} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <PreviewCard />
      </div>

      <small className="auth-brand-foot">
        <ShieldCheckIcon width={16} />
        Your data stays on this device. Nothing is uploaded.
      </small>
    </aside>

    <main className="auth-main">
      <div className="auth-theme">
        <ThemeButton />
      </div>
      <div className="auth-card">
        <div className="auth-mobile-brand">
          <span className="brand-mark">
            <img src={logomark} alt="" width={20} height={20} />
          </span>
          <span>HomeBudget</span>
        </div>
        <header className="auth-head">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </header>
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </main>
  </div>
);

export const Field = ({ label, error, hint, id, icon: Icon, children, aside }) => (
  <div className={`field${error ? " has-error" : ""}`}>
    <div className="field-label">
      <label htmlFor={id}>{label}</label>
      {aside}
    </div>
    <div className="field-control">
      {Icon && <Icon width={18} className="field-icon" />}
      {children}
    </div>
    {error ? (
      <small className="field-error" id={`${id}-error`} role="alert">
        {error}
      </small>
    ) : (
      hint && <small className="field-hint">{hint}</small>
    )}
  </div>
);

export const PasswordInput = ({ id, name, onChange, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        onChange={onChange}
        {...props}
      />
      <button
        type="button"
        className="field-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-controls={id}
      >
        {visible ? <EyeSlashIcon width={18} /> : <EyeIcon width={18} />}
      </button>
    </>
  );
};
