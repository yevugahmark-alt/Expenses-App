import { ArrowDownLeftIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "../helpers";

const formatDay = (epoch) =>
  new Date(epoch).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

// Income and expenses merged into one timeline, newest first.
const RecentActivity = ({ incomes = [], expenses = [], budgets = [], limit = 7 }) => {
  const budgetById = Object.fromEntries(budgets.map((b) => [b.id, b]));

  const items = [
    ...incomes.map((i) => ({ ...i, type: "income" })),
    ...expenses.map((e) => ({ ...e, type: "expense" })),
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);

  return (
    <ul className="activity">
      {items.map((item) => {
        const budget = budgetById[item.budgetId];
        const isIncome = item.type === "income";
        return (
          <li key={item.id} className="activity-item">
            <span
              className={`activity-icon ${isIncome ? "is-income" : "is-expense"}`}
              style={budget ? { "--accent": budget.color } : undefined}
            >
              {isIncome ? (
                <ArrowDownLeftIcon width={16} />
              ) : (
                <ArrowUpRightIcon width={16} />
              )}
            </span>
            <div className="activity-body">
              <strong>{item.name}</strong>
              <small>
                {isIncome ? "Income" : budget?.name ?? "No budget"} ·{" "}
                {formatDay(item.createdAt)}
              </small>
            </div>
            <span className={`activity-amount ${isIncome ? "income" : ""}`}>
              {isIncome ? "+" : "−"}
              {formatCurrency(item.amount)}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default RecentActivity;
