import { Form, NavLink } from "react-router-dom";
import {
  ArrowsRightLeftIcon,
  BanknotesIcon,
  ChartPieIcon,
  ReceiptPercentIcon,
  Squares2X2Icon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import logomark from "../assets/logomark.svg";
import { ThemeButton, ThemeSwitch } from "./ThemeToggle";

const LINKS = [
  { to: "/", label: "Dashboard", icon: Squares2X2Icon, end: true },
  { to: "/income", label: "Income", icon: BanknotesIcon },
  { to: "/budgets", label: "Budgets", icon: ChartPieIcon },
  { to: "/expenses", label: "Expenses", icon: ReceiptPercentIcon },
  { to: "/loans", label: "Loans", icon: ArrowsRightLeftIcon },
];

const Brand = () => (
  <NavLink to="/" className="brand" aria-label="Go to dashboard">
    <span className="brand-mark" aria-hidden="true">
      <img src={logomark} alt="" height={20} width={20} />
    </span>
    <span>HomeBudget</span>
  </NavLink>
);

const SignOut = ({ compact = false }) => (
  <Form method="post" action="/logout">
    <button
      type="submit"
      className={compact ? "icon-btn" : "side-action"}
      aria-label="Sign out"
      title="Sign out"
    >
      <ArrowRightOnRectangleIcon width={18} />
      {!compact && <span>Sign out</span>}
    </button>
  </Form>
);

const DeleteAccount = () => (
  <Form
    method="post"
    action="/delete-account"
    onSubmit={(event) => {
      if (
        !confirm(
          "Delete your account and all of its income, budgets, expenses and loans? This can’t be undone."
        )
      ) {
        event.preventDefault();
      }
    }}
  >
    <button type="submit" className="side-action side-action--danger">
      <TrashIcon width={18} />
      <span>Delete account</span>
    </button>
  </Form>
);

const Sidebar = ({ user }) => {
  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      {/* desktop */}
      <aside className="sidebar">
        <Brand />
        <nav className="side-nav" aria-label="Main">
          <span className="side-label">Menu</span>
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              <Icon width={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-footer">
          <ThemeSwitch />
          <div className="side-user">
            <span className="avatar">{initial}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>
          <SignOut />
          <DeleteAccount />
        </div>
      </aside>

      {/* mobile */}
      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          <ThemeButton />
          <SignOut compact />
        </div>
      </header>
      <nav className="tabbar" aria-label="Main">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tab">
            <Icon width={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
