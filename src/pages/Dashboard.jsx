// rrd imports
import { Link, useLoaderData } from "react-router-dom";
import {
  ArrowRightIcon,
  BanknotesIcon,
  ChartPieIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

// components
import PageHeader from "../components/PageHeader";
import BalanceCard from "../components/BalanceCard";
import BudgetOverview from "../components/BudgetOverview";
import RecentActivity from "../components/RecentActivity";
import GettingStarted from "../components/GettingStarted";
import Insights from "../components/Insights";

// helpers
import { fetchData } from "../helpers";
import { requireUser } from "../auth";

// loader
export function dashboardLoader() {
  const user = requireUser();
  const incomes = fetchData("incomes") ?? [];
  const budgets = fetchData("budgets") ?? [];
  const expenses = fetchData("expenses") ?? [];
  const loans = fetchData("loans") ?? [];
  return { user, incomes, budgets, expenses, loans };
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const Dashboard = () => {
  const { user, incomes, budgets, expenses, loans } = useLoaderData();
  const firstName = user.name.split(" ")[0];

  const isSetUp = incomes.length > 0 && budgets.length > 0 && expenses.length > 0;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="page">
      <PageHeader
        eyebrow={today}
        title={
          <>
            {greeting()}, <span className="accent">{firstName}</span>
          </>
        }
        subtitle="Here’s where your money stands today."
        actions={
          <>
            <Link to="/income" className="btn btn--ghost">
              <BanknotesIcon width={18} />
              <span>Add income</span>
            </Link>
            <Link to="/expenses" className="btn btn--dark">
              <PlusIcon width={18} />
              <span>New expense</span>
            </Link>
          </>
        }
      />

      {!isSetUp && (
        <GettingStarted
          hasIncome={incomes.length > 0}
          hasBudget={budgets.length > 0}
          hasExpense={expenses.length > 0}
        />
      )}

      <BalanceCard
        incomes={incomes}
        budgets={budgets}
        expenses={expenses}
        loans={loans}
      />

      {incomes.length + expenses.length + loans.length > 0 && (
        <Insights
          incomes={incomes}
          budgets={budgets}
          expenses={expenses}
          loans={loans}
        />
      )}

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Budgets</h2>
              <small className="muted">Most used first</small>
            </div>
            <Link to="/budgets" className="panel-link">
              Manage <ArrowRightIcon width={14} />
            </Link>
          </div>
          {budgets.length > 0 ? (
            <BudgetOverview budgets={budgets} expenses={expenses} />
          ) : (
            <div className="panel-empty">
              <ChartPieIcon width={28} />
              <p>No budgets yet.</p>
              <Link to="/budgets" className="btn btn--ghost btn--sm">
                Create a budget
              </Link>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Recent activity</h2>
              <small className="muted">Income and expenses</small>
            </div>
            <Link to="/expenses" className="panel-link">
              View all <ArrowRightIcon width={14} />
            </Link>
          </div>
          {incomes.length + expenses.length > 0 ? (
            <RecentActivity
              incomes={incomes}
              expenses={expenses}
              budgets={budgets}
            />
          ) : (
            <div className="panel-empty">
              <BanknotesIcon width={28} />
              <p>Nothing recorded yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
export default Dashboard;
