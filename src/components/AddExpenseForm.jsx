import { useEffect, useMemo, useRef } from "react"
import { useFetcher } from "react-router-dom";
import FormError, { INLINE } from "./FormError"
import { PlusCircleIcon } from "@heroicons/react/24/solid"
import { todayInputValue } from "../helpers"

// `lockBudget` pins the form to budgets[0] (used on a budget's own page).
const AddExpenseForm = ({ budgets = [], lockBudget = false }) => {
  const fetcher = useFetcher()
  const isSubmitting = fetcher.state !== "idle"

  const formRef = useRef()
  const focusRef = useRef()

  // only clear the form after a successful save, so mistakes don't wipe input
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      formRef.current.reset()
      focusRef.current.focus()
    }
  }, [fetcher.state, fetcher.data])

  const sortedBudgets = useMemo(
    () => [...budgets].sort((a, b) => a.createdAt - b.createdAt),
    [budgets]
  )
  const single = lockBudget && budgets.length === 1

  return (
    <div className="form-wrapper">
      <h2 className="h3">
        Add new {single && <span className="accent">{budgets[0].name}</span>}{" "}
        expense
      </h2>
      <fetcher.Form method="post" className="grid-sm" ref={formRef}>
        <div className="expense-inputs">
          <div className="grid-xs">
            <label htmlFor="newExpense">Expense name</label>
            <input
              type="text"
              name="newExpense"
              id="newExpense"
              placeholder="e.g., Coffee"
              maxLength={60}
              ref={focusRef}
              required
            />
          </div>
          <div className="grid-xs">
            <label htmlFor="newExpenseAmount">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              name="newExpenseAmount"
              id="newExpenseAmount"
              placeholder="e.g., 3.50"
              required
            />
          </div>
        </div>
        <div className="expense-inputs">
          <div className="grid-xs">
            <label htmlFor="newExpenseDate">Date</label>
            <input
              type="date"
              name="newExpenseDate"
              id="newExpenseDate"
              defaultValue={todayInputValue()}
              max={todayInputValue()}
              required
            />
          </div>
          <div className="grid-xs" hidden={single}>
            <label htmlFor="newExpenseBudget">Budget category</label>
            <select
              name="newExpenseBudget"
              id="newExpenseBudget"
              defaultValue={single ? budgets[0].id : ""}
            >
              {!single && <option value="">No budget</option>}
              {sortedBudgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <FormError fetcher={fetcher} />
        {INLINE}
        <input type="hidden" name="_action" value="createExpense" />
        <button type="submit" className="btn btn--dark" disabled={isSubmitting}>
          {isSubmitting ? (
            <span>Submitting…</span>
          ) : (
            <>
              <span>Add expense</span>
              <PlusCircleIcon width={20} />
            </>
          )}
        </button>
      </fetcher.Form>
    </div>
  )
}
export default AddExpenseForm
