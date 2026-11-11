import { useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router-dom";
import FormError, { INLINE } from "./FormError";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { formatCurrency, getIncomeAllocations } from "../helpers";

const EditBudgetForm = ({ budget, incomes = [], budgets = [] }) => {
  const fetcher = useFetcher();

  // availability per income, ignoring this budget's own allocation
  const allocations = useMemo(
    () =>
      getIncomeAllocations(
        incomes,
        budgets.filter((b) => b.id !== budget.id)
      ),
    [incomes, budgets, budget.id]
  );
  const [open, setOpen] = useState(false);
  const isSubmitting = fetcher.state !== "idle";

  // close the editor once a save succeeds
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) setOpen(false);
  }, [fetcher.state, fetcher.data]);

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => setOpen(true)}
      >
        <PencilSquareIcon width={18} />
        <span>Edit budget</span>
      </button>
    );
  }

  return (
    <div className="form-wrapper">
      <h2 className="h3">Edit budget</h2>
      <fetcher.Form method="post" className="grid-sm">
        <div className="expense-inputs">
          <div className="grid-xs">
            <label htmlFor="budgetName">Name</label>
            <input
              type="text"
              name="budgetName"
              id="budgetName"
              defaultValue={budget.name}
              maxLength={60}
              required
              autoFocus
            />
          </div>
          <div className="grid-xs">
            <label htmlFor="budgetAmount">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              name="budgetAmount"
              id="budgetAmount"
              defaultValue={budget.amount}
              required
            />
          </div>
        </div>
        <div className="grid-xs">
          <label htmlFor="budgetIncome">Funded from</label>
          <select
            name="budgetIncome"
            id="budgetIncome"
            defaultValue={budget.incomeId ?? ""}
            required
          >
            {!budget.incomeId && (
              <option value="" disabled>
                Choose an income…
              </option>
            )}
            {allocations.map((income) => (
              <option key={income.id} value={income.id}>
                {income.name} ({formatCurrency(income.available)} available)
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" name="budgetId" value={budget.id} />
        <FormError fetcher={fetcher} />
        {INLINE}
        <input type="hidden" name="_action" value="updateBudget" />
        <div className="form-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn--dark" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </fetcher.Form>
    </div>
  );
};

export default EditBudgetForm;
