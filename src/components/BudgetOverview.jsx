import { Link } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { formatCurrency, formatPercentage } from "../helpers";

// Compact budget list for the dashboard: most-used budgets first.
const BudgetOverview = ({ budgets = [], expenses = [], limit = 5 }) => {
  const rows = budgets
    .map((b) => {
      const spent = expenses
        .filter((e) => e.budgetId === b.id)
        .reduce((acc, e) => acc + e.amount, 0);
      return { ...b, spent, ratio: b.amount ? spent / b.amount : 0 };
    })
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, limit);

  return (
    <ul className="mini-budgets">
      {rows.map((b) => (
        <li key={b.id}>
          <Link
            to={`/budget/${b.id}`}
            className={`mini-budget${b.ratio > 1 ? " is-over" : ""}`}
            style={{ "--accent": b.color }}
          >
            <span className="mini-dot" />
            <div className="mini-body">
              <div className="mini-row">
                <strong>{b.name}</strong>
                <span className="mini-pct">{formatPercentage(b.ratio)}</span>
              </div>
              <div className="mini-track">
                <span style={{ width: `${Math.min(b.ratio, 1) * 100}%` }} />
              </div>
              <small>
                {formatCurrency(b.spent)} of {formatCurrency(b.amount)}
              </small>
            </div>
            <ChevronRightIcon width={16} className="mini-chevron" />
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default BudgetOverview;
