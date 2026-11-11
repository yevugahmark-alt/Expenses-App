import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router-dom";
import FormError, { INLINE } from "./FormError";
import { PlusCircleIcon } from "@heroicons/react/24/solid";
import { todayInputValue } from "../helpers";

const AddLoanForm = () => {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";
  const [direction, setDirection] = useState("lent");

  const formRef = useRef();
  const focusRef = useRef();

  // only clear the form after a successful save, so mistakes don't wipe input
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      formRef.current.reset();
      setDirection("lent");
      focusRef.current.focus();
    }
  }, [fetcher.state, fetcher.data]);

  const lent = direction === "lent";

  return (
    <div className="form-wrapper">
      <h2 className="h3">Record a loan</h2>
      <fetcher.Form method="post" className="grid-sm" ref={formRef}>
        <fieldset className="segmented">
          <legend className="sr-only">Direction</legend>
          <label>
            <input
              type="radio"
              name="loanDirection"
              value="lent"
              checked={lent}
              onChange={() => setDirection("lent")}
            />
            <span>I lent money</span>
          </label>
          <label>
            <input
              type="radio"
              name="loanDirection"
              value="borrowed"
              checked={!lent}
              onChange={() => setDirection("borrowed")}
            />
            <span>I borrowed money</span>
          </label>
        </fieldset>

        <div className="expense-inputs">
          <div className="grid-xs">
            <label htmlFor="loanPerson">{lent ? "Lent to" : "Borrowed from"}</label>
            <input
              type="text"
              name="loanPerson"
              id="loanPerson"
              placeholder="e.g., Kofi"
              maxLength={60}
              ref={focusRef}
              required
            />
          </div>
          <div className="grid-xs">
            <label htmlFor="loanAmount">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              name="loanAmount"
              id="loanAmount"
              placeholder="e.g., 300"
              required
            />
          </div>
        </div>
        <div className="expense-inputs">
          <div className="grid-xs">
            <label htmlFor="loanDate">Date</label>
            <input
              type="date"
              name="loanDate"
              id="loanDate"
              defaultValue={todayInputValue()}
              max={todayInputValue()}
              required
            />
          </div>
          <div className="grid-xs">
            <label htmlFor="loanDue">
              Due back <span className="muted">(optional)</span>
            </label>
            <input type="date" name="loanDue" id="loanDue" />
          </div>
        </div>
        <div className="grid-xs">
          <label htmlFor="loanNote">
            Note <span className="muted">(optional)</span>
          </label>
          <input
            type="text"
            name="loanNote"
            id="loanNote"
            placeholder={lent ? "e.g., For school fees" : "e.g., Rent shortfall"}
            maxLength={120}
          />
        </div>
        <p className="form-hint muted">
          {lent
            ? "This comes off your available balance and returns as they repay. It isn't counted as spending."
            : "This adds to your available balance and comes off as you repay. It isn't counted as income."}
        </p>
        <FormError fetcher={fetcher} />
        {INLINE}
        <input type="hidden" name="_action" value="createLoan" />
        <button type="submit" className="btn btn--dark" disabled={isSubmitting}>
          {isSubmitting ? (
            <span>Saving…</span>
          ) : (
            <>
              <span>Save loan</span>
              <PlusCircleIcon width={20} />
            </>
          )}
        </button>
      </fetcher.Form>
    </div>
  );
};

export default AddLoanForm;
