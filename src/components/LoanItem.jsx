import { useCallback, useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import FormError, { INLINE } from "./FormError";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  formatCurrency,
  formatDateToLocaleString,
  loanStatus,
  toInputDate,
  todayInputValue,
} from "../helpers";

const DAY = 864e5;

const dueLabel = (loan, status) => {
  if (status.settled) return "Settled";
  if (loan.dueAt == null) return "No due date";
  const days = Math.ceil((loan.dueAt - Date.now()) / DAY);
  if (status.overdue) {
    const late = Math.max(Math.floor((Date.now() - loan.dueAt) / DAY), 0);
    return late === 0 ? "Overdue since today" : `Overdue by ${late} ${late === 1 ? "day" : "days"}`;
  }
  if (days <= 0) return "Due today";
  return `Due in ${days} ${days === 1 ? "day" : "days"}`;
};

const EditLoanForm = ({ loan, onDone }) => {
  const fetcher = useFetcher();
  const [direction, setDirection] = useState(loan.direction);
  const lent = direction === "lent";
  const repaid = loanStatus(loan).repaid;
  const id = (name) => `${name}-${loan.id}`;

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) onDone();
  }, [fetcher.state, fetcher.data, onDone]);

  return (
    <fetcher.Form method="post" className="loan-edit grid-sm">
      <fieldset className="segmented">
        <legend className="sr-only">Direction</legend>
        {["lent", "borrowed"].map((d) => (
          <label key={d}>
            <input
              type="radio"
              name="loanDirection"
              value={d}
              checked={direction === d}
              onChange={() => setDirection(d)}
            />
            <span>{d === "lent" ? "I lent money" : "I borrowed money"}</span>
          </label>
        ))}
      </fieldset>
      <div className="expense-inputs">
        <div className="grid-xs">
          <label htmlFor={id("person")}>{lent ? "Lent to" : "Borrowed from"}</label>
          <input
            type="text"
            name="loanPerson"
            id={id("person")}
            defaultValue={loan.person}
            maxLength={60}
            autoFocus
            required
          />
        </div>
        <div className="grid-xs">
          <label htmlFor={id("amount")}>Amount</label>
          <input
            type="number"
            step="0.01"
            min={Math.max(repaid, 0.01)}
            inputMode="decimal"
            name="loanAmount"
            id={id("amount")}
            defaultValue={loan.amount}
            required
          />
        </div>
      </div>
      <div className="expense-inputs">
        <div className="grid-xs">
          <label htmlFor={id("date")}>Date</label>
          <input
            type="date"
            name="loanDate"
            id={id("date")}
            defaultValue={toInputDate(loan.createdAt)}
            max={todayInputValue()}
            required
          />
        </div>
        <div className="grid-xs">
          <label htmlFor={id("due")}>
            Due back <span className="muted">(optional)</span>
          </label>
          <input
            type="date"
            name="loanDue"
            id={id("due")}
            defaultValue={loan.dueAt != null ? toInputDate(loan.dueAt) : ""}
          />
        </div>
      </div>
      <div className="grid-xs">
        <label htmlFor={id("note")}>
          Note <span className="muted">(optional)</span>
        </label>
        <input
          type="text"
          name="loanNote"
          id={id("note")}
          defaultValue={loan.note}
          maxLength={120}
        />
      </div>
      {repaid > 0 && (
        <p className="form-hint muted">
          {formatCurrency(repaid)} has already been repaid, so the amount can’t go
          below that. Repayments stay as they are.
        </p>
      )}
      <FormError fetcher={fetcher} />
      {INLINE}
      <input type="hidden" name="_action" value="updateLoan" />
      <input type="hidden" name="loanId" value={loan.id} />
      <div className="loan-repay-actions">
        <button type="submit" className="btn btn--dark btn--sm" disabled={fetcher.state !== "idle"}>
          Save changes
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onDone}>
          Cancel
        </button>
      </div>
    </fetcher.Form>
  );
};

const LoanItem = ({ loan }) => {
  const status = loanStatus(loan);
  const lent = loan.direction === "lent";
  const [repaying, setRepaying] = useState(false);
  const [editing, setEditing] = useState(false);

  const repay = useFetcher();
  const remove = useFetcher();

  // close the repayment form once it saves
  useEffect(() => {
    if (repay.state === "idle" && repay.data?.ok) setRepaying(false);
  }, [repay.state, repay.data]);

  const closeEdit = useCallback(() => setEditing(false), []);

  const pct = Math.min(status.repaid / loan.amount, 1) * 100;
  const tone = status.settled ? "settled" : status.overdue ? "overdue" : "open";

  if (editing)
    return (
      <li className={`loan loan--${tone}`}>
        <EditLoanForm loan={loan} onDone={closeEdit} />
      </li>
    );

  return (
    <li className={`loan loan--${tone}`}>
      <div className="loan-head">
        <div className="loan-who">
          <strong>{loan.person}</strong>
          <small className="muted">
            {lent ? "You lent" : "You borrowed"} {formatCurrency(loan.amount)} on{" "}
            {formatDateToLocaleString(loan.createdAt)}
          </small>
        </div>
        <div className="loan-remaining">
          <strong>{formatCurrency(status.remaining)}</strong>
          <small className="muted">
            {status.settled ? "Fully repaid" : lent ? "owed to you" : "you owe"}
          </small>
        </div>
      </div>

      <div
        className="loan-track"
        role="progressbar"
        aria-label={`Repaid ${formatCurrency(status.repaid)} of ${formatCurrency(loan.amount)}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <span style={{ width: `${pct}%` }} />
      </div>

      <div className="loan-meta">
        <span className={`loan-status loan-status--${tone}`}>{dueLabel(loan, status)}</span>
        {status.repaid > 0 && !status.settled && (
          <small className="muted">{formatCurrency(status.repaid)} repaid so far</small>
        )}
        {loan.note && <small className="muted loan-note">{loan.note}</small>}
      </div>

      {loan.repayments?.length > 0 && (
        <details className="loan-history">
          <summary>
            {loan.repayments.length}{" "}
            {loan.repayments.length === 1 ? "repayment" : "repayments"}
          </summary>
          <ul>
            {[...loan.repayments]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((r) => (
                <li key={r.id}>
                  <span>{formatDateToLocaleString(r.createdAt)}</span>
                  <span className="amount">{formatCurrency(r.amount)}</span>
                </li>
              ))}
          </ul>
        </details>
      )}

      {repaying && (
        <repay.Form method="post" className="loan-repay">
          <div className="grid-xs">
            <label htmlFor={`repay-amt-${loan.id}`}>
              {lent ? "Amount they paid" : "Amount you paid"}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={status.remaining}
              inputMode="decimal"
              name="repayAmount"
              id={`repay-amt-${loan.id}`}
              defaultValue={status.remaining}
              autoFocus
              required
            />
          </div>
          <div className="grid-xs">
            <label htmlFor={`repay-date-${loan.id}`}>Date</label>
            <input
              type="date"
              name="repayDate"
              id={`repay-date-${loan.id}`}
              defaultValue={todayInputValue()}
              max={todayInputValue()}
              required
            />
          </div>
          <div className="loan-repay-error">
            <FormError fetcher={repay} />
          </div>
          {INLINE}
          <input type="hidden" name="_action" value="repayLoan" />
          <input type="hidden" name="loanId" value={loan.id} />
          <div className="loan-repay-actions">
            <button type="submit" className="btn btn--dark btn--sm" disabled={repay.state !== "idle"}>
              Save repayment
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setRepaying(false)}>
              Cancel
            </button>
          </div>
        </repay.Form>
      )}

      <div className="loan-actions">
        {!status.settled && !repaying && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setRepaying(true)}>
            Record repayment
          </button>
        )}
        <button
          type="button"
          className="btn btn--ghost btn--icon loan-edit-btn"
          aria-label={`Edit loan with ${loan.person}`}
          title="Edit"
          onClick={() => {
            setRepaying(false);
            setEditing(true);
          }}
        >
          <PencilSquareIcon width={18} />
        </button>
        <remove.Form
          method="post"
          onSubmit={(e) => {
            if (
              !confirm(
                `Delete the loan with ${loan.person}? Its repayments are deleted too and your balance will change.`
              )
            )
              e.preventDefault();
          }}
        >
          <input type="hidden" name="_action" value="deleteLoan" />
          <input type="hidden" name="loanId" value={loan.id} />
          <button
            type="submit"
            className="btn btn--warning btn--icon"
            aria-label={`Delete loan with ${loan.person}`}
            disabled={remove.state !== "idle"}
          >
            <TrashIcon width={18} />
          </button>
        </remove.Form>
      </div>
    </li>
  );
};

export default LoanItem;
