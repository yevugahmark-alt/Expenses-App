import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router-dom";
import FormError, { INLINE } from "./FormError"
import { CurrencyDollarIcon } from "@heroicons/react/24/solid"
import { formatCurrency, getIncomeAllocations } from "../helpers"

const AddBudgetForm = ({ incomes = [], budgets = [] }) => {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle"

  const formRef = useRef();
  const focusRef = useRef();

  const allocations = useMemo(
    () => getIncomeAllocations(incomes, budgets),
    [incomes, budgets]
  );
  const withFunds = allocations.filter((i) => i.available > 0);

  // keep the chosen income; fall back to the first one with money left
  const [chosen, setChosen] = useState("");
  const selected =
    withFunds.find((i) => i.id === chosen) ?? withFunds[0] ?? null;

  // only clear the inputs after a successful save, so mistakes don't wipe input
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      formRef.current.newBudget.value = ""
      formRef.current.newBudgetAmount.value = ""
      focusRef.current.focus()
    }
  }, [fetcher.state, fetcher.data])

  const canCreate = Boolean(selected);

  return (
    <div className="form-wrapper">
      <div className="grid-xs">
        <h2 className="h3">Create budget</h2>
        {!canCreate && (
          <small className="warning-text">
            {incomes.length === 0
              ? "Record income first. Budgets are funded from your income."
              : "All of your income is budgeted. Add more income to create a budget."}
          </small>
        )}
      </div>
      <fetcher.Form
        method="post"
        className="grid-sm"
        ref={formRef}
      >
        <div className="grid-xs">
          <label htmlFor="newBudgetIncome">Funded from</label>
          <select
            name="newBudgetIncome"
            id="newBudgetIncome"
            value={selected?.id ?? ""}
            onChange={(e) => setChosen(e.target.value)}
            disabled={!canCreate}
            required
          >
            {!canCreate && <option value="">No income available</option>}
            {allocations.map((income) => (
              <option
                key={income.id}
                value={income.id}
                disabled={income.available <= 0}
              >
                {income.name} ({formatCurrency(income.available)} left)
              </option>
            ))}
          </select>
        </div>
        <div className="expense-inputs">
          <div className="grid-xs">
            <label htmlFor="newBudget">Budget name</label>
            <input
              type="text"
              name="newBudget"
              id="newBudget"
              placeholder="e.g., Groceries"
              maxLength={60}
              required
              ref={focusRef}
            />
          </div>
          <div className="grid-xs">
            <label htmlFor="newBudgetAmount">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={selected ? selected.available : undefined}
              name="newBudgetAmount"
              id="newBudgetAmount"
              placeholder={selected ? `Up to ${selected.available}` : "e.g., 350.00"}
              required
              inputMode="decimal"
            />
          </div>
        </div>
        <FormError fetcher={fetcher} />
        {INLINE}
        <input type="hidden" name="_action" value="createBudget" />
        <button
          type="submit"
          className="btn btn--dark"
          disabled={isSubmitting || !canCreate}
        >
          {
            isSubmitting ? <span>Submitting…</span> : (
              <>
                <span>Create budget</span>
                <CurrencyDollarIcon width={20} />
              </>
            )
          }
        </button>
      </fetcher.Form>
    </div>
  )
}
export default AddBudgetForm
