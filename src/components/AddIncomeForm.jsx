import { useEffect, useRef } from "react";
import { useFetcher } from "react-router-dom";
import FormError, { INLINE } from "./FormError";
import { BanknotesIcon } from "@heroicons/react/24/solid";
import { todayInputValue } from "../helpers";

const AddIncomeForm = () => {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  const formRef = useRef();
  const focusRef = useRef();

  // only clear the form after a successful save, so mistakes don't wipe input
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      formRef.current.reset();
      focusRef.current.focus();
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="form-wrapper form-wrapper--income">
      <h2 className="h3">
        Record <span className="income">income</span>
      </h2>
      <fetcher.Form method="post" className="grid-sm" ref={formRef}>
        <div className="expense-inputs">
          <div className="grid-xs">
            <label htmlFor="newIncome">Source</label>
            <input
              type="text"
              name="newIncome"
              id="newIncome"
              placeholder="e.g., Salary"
              maxLength={60}
              ref={focusRef}
              required
            />
          </div>
          <div className="grid-xs">
            <label htmlFor="newIncomeAmount">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              name="newIncomeAmount"
              id="newIncomeAmount"
              placeholder="e.g., 2500"
              required
            />
          </div>
        </div>
        <div className="grid-xs">
          <label htmlFor="newIncomeDate">Date received</label>
          <input
            type="date"
            name="newIncomeDate"
            id="newIncomeDate"
            defaultValue={todayInputValue()}
            max={todayInputValue()}
            required
          />
        </div>
        <FormError fetcher={fetcher} />
        {INLINE}
        <input type="hidden" name="_action" value="createIncome" />
        <button
          type="submit"
          className="btn btn--income"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span>Saving…</span>
          ) : (
            <>
              <span>Add income</span>
              <BanknotesIcon width={20} />
            </>
          )}
        </button>
      </fetcher.Form>
    </div>
  );
};

export default AddIncomeForm;
