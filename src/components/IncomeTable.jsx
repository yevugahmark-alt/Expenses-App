import { useFetcher } from "react-router-dom";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  formatCurrency,
  formatDateToLocaleString,
  getIncomeAllocations,
} from "../helpers";

const IncomeRow = ({ income }) => {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== "idle";

  return (
    <tr>
      <td>{income.name}</td>
      <td className="amount income">+{formatCurrency(income.amount)}</td>
      <td className="date">{formatDateToLocaleString(income.createdAt)}</td>
      <td>
        <div className="cell-stack">
          <span>{formatCurrency(income.allocated)}</span>
          <small className={income.available < 0 ? "warning-text" : "muted"}>
            {formatCurrency(Math.abs(income.available))}{" "}
            {income.available < 0 ? "over" : "left"}
          </small>
        </div>
      </td>
      <td>
        <fetcher.Form
          method="post"
          onSubmit={(e) => {
            if (!confirm(`Delete income “${income.name}”?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="_action" value="deleteIncome" />
          <input type="hidden" name="incomeId" value={income.id} />
          <button
            type="submit"
            className="btn btn--warning btn--icon"
            aria-label={`Delete ${income.name} income`}
            disabled={isDeleting}
          >
            <TrashIcon width={18} />
          </button>
        </fetcher.Form>
      </td>
    </tr>
  );
};

const IncomeTable = ({ incomes, budgets = [] }) => (
  <div className="table">
    <table>
      <thead>
        <tr>
          <th>Source</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Budgeted</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {getIncomeAllocations(incomes, budgets).map((income) => (
          <IncomeRow key={income.id} income={income} />
        ))}
      </tbody>
    </table>
  </div>
);

export default IncomeTable;
