// rrd imports
import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import { useMemo } from "react";

// library
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";

// component imports
import Table from "../components/Table";
import PageHeader from "../components/PageHeader";
import AddExpenseForm from "../components/AddExpenseForm";
import { requireUser } from "../auth";

// helpers
import { exportExpensesToCSV, fetchData, formatCurrency } from "../helpers";
import { handleAction } from "../actions/handleAction";

// loader
export function expensesLoader() {
  requireUser();
  const expenses = fetchData("expenses") ?? [];
  const budgets = fetchData("budgets") ?? [];
  return { expenses, budgets };
}

// action
export async function expensesAction({ request }) {
  return handleAction(request, ["createExpense", "deleteExpense"]);
}

const SORTS = {
  newest: (a, b) => b.createdAt - a.createdAt,
  oldest: (a, b) => a.createdAt - b.createdAt,
  highest: (a, b) => b.amount - a.amount,
  lowest: (a, b) => a.amount - b.amount,
  name: (a, b) => a.name.localeCompare(b.name),
};

const ExpensesPage = () => {
  const { expenses, budgets } = useLoaderData();

  // filters live in the URL so they survive refreshes and deletes
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const budgetId = params.get("budget") ?? "";
  const sort = SORTS[params.get("sort")] ? params.get("sort") : "newest";

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return expenses
      .filter((e) =>
        !budgetId
          ? true
          : budgetId === "none"
          ? !budgets.some((b) => b.id === e.budgetId)
          : e.budgetId === budgetId
      )
      .filter((e) => !term || e.name.toLowerCase().includes(term))
      .sort(SORTS[sort]);
  }, [expenses, budgets, q, budgetId, sort]);

  const total = filtered.reduce((acc, e) => acc + e.amount, 0);
  const isFiltered = Boolean(q || budgetId);

  const sideForm = (
    <aside className="split-side">
      <AddExpenseForm budgets={budgets} />
      {budgets.length === 0 && (
        <p className="muted">
          Expenses without a budget still count against your balance.{" "}
          <Link to="/budgets">Create a budget</Link> to track spending by
          category.
        </p>
      )}
    </aside>
  );

  const header = (
    <PageHeader
      eyebrow="Spend"
      title="Expenses"
      subtitle={
        expenses.length > 0
          ? `${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"} recorded`
          : "Log what you spend and see it come off your budgets."
      }
    />
  );

  if (expenses.length === 0) {
    return (
      <div className="page">
        {header}
        <div className="split">
          <div className="split-main">
            <div className="empty">
              <ReceiptPercentIcon width={40} />
              <h2 className="h3">No expenses yet</h2>
              <p>Your expenses will show up here once you add one.</p>
            </div>
          </div>
          {sideForm}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {header}
      <div className="split">
      <div className="split-main">
      <div className="toolbar">
        <label className="search">
          <MagnifyingGlassIcon width={18} />
          <input
            type="search"
            placeholder="Search expenses…"
            aria-label="Search expenses"
            value={q}
            onChange={(e) => setParam("q", e.target.value)}
          />
        </label>
        <select
          aria-label="Filter by budget"
          value={budgetId}
          onChange={(e) => setParam("budget", e.target.value)}
        >
          <option value="">All budgets</option>
          <option value="none">No budget</option>
          {budgets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort expenses"
          value={sort}
          onChange={(e) =>
            setParam("sort", e.target.value === "newest" ? "" : e.target.value)
          }
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest amount</option>
          <option value="lowest">Lowest amount</option>
          <option value="name">Name (A–Z)</option>
        </select>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => exportExpensesToCSV(filtered)}
          disabled={filtered.length === 0}
        >
          <ArrowDownTrayIcon width={18} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="grid-sm">
        <p className="muted">
          {isFiltered ? "Showing " : ""}
          <strong>{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "expense" : "expenses"} totalling{" "}
          <strong>{formatCurrency(total)}</strong>
          {isFiltered && (
            <>
              {" · "}
              <button
                type="button"
                className="link-btn"
                onClick={() => setParams({}, { replace: true })}
              >
                Clear filters
              </button>
            </>
          )}
        </p>
        {filtered.length > 0 ? (
          <Table expenses={filtered} />
        ) : (
          <div className="empty">
            <h2 className="h3">No matching expenses</h2>
            <p>Try a different search or budget.</p>
          </div>
        )}
      </div>
      </div>
      {sideForm}
      </div>
    </div>
  );
};

export default ExpensesPage;
