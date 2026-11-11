import { Link, useFetcher } from "react-router-dom";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  formatCurrency,
  formatDateToLocaleString,
  getAllMatchingItems,
} from "../helpers";

const ExpenseItem = ({ expense, showBudget }) => {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== "idle";

  const budget = getAllMatchingItems({
    category: "budgets",
    key: "id",
    value: expense.budgetId,
  })[0];

  return (
    <>
      <td>{expense.name}</td>
      <td className="amount">{formatCurrency(expense.amount)}</td>
      <td className="date">{formatDateToLocaleString(expense.createdAt)}</td>
      {showBudget && (
        <td>
          {budget ? (
            <Link
              to={`/budget/${budget.id}`}
              className="budget-tag"
              style={{ "--accent": budget.color }}
            >
              {budget.name}
            </Link>
          ) : (
            <span className="budget-tag budget-tag--none">No budget</span>
          )}
        </td>
      )}
      <td>
        <fetcher.Form
          method="post"
          onSubmit={(e) => {
            if (!confirm(`Delete expense “${expense.name}”?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="_action" value="deleteExpense" />
          <input type="hidden" name="expenseId" value={expense.id} />
          <button
            type="submit"
            className="btn btn--warning btn--icon"
            aria-label={`Delete ${expense.name} expense`}
            disabled={isDeleting}
          >
            <TrashIcon width={18} />
          </button>
        </fetcher.Form>
      </td>
    </>
  );
};
export default ExpenseItem;
