import { Form, Link } from "react-router-dom";
import { ArrowRightIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  calculateSpentByBudget,
  formatCurrency,
  formatPercentage,
  getAllMatchingItems,
} from "../helpers";
import { useEffect, useState, useRef } from "react";

const ConfirmModal = ({ name, onConfirm, onCancel }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-budget-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-icon">
          <TrashIcon width={28} />
        </div>
        <h2 id="delete-budget-title" className="h3">
          Delete “{name}”?
        </h2>
        <p>
          This permanently deletes the budget and all of its expenses. This
          can’t be undone.
        </p>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn btn--ghost" autoFocus>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn--danger">
            <TrashIcon width={18} />
            <span>Yes, delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const BudgetItem = ({ budget, showDelete = false }) => {
  const { id, name, amount, color, incomeId } = budget;
  const income = incomeId
    ? getAllMatchingItems({ category: "incomes", key: "id", value: incomeId })[0]
    : null;
  const spent = calculateSpentByBudget(id);
  const remaining = amount - spent;
  const isOver = remaining < 0;
  const [showModal, setShowModal] = useState(false);
  const submitRef = useRef(null);

  const handleConfirm = () => {
    setShowModal(false);
    submitRef.current?.click();
  };

  return (
    <div
      className={`budget${isOver ? " budget--over" : ""}`}
      style={{ "--accent": color }}
    >
      {showModal && (
        <ConfirmModal
          name={name}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div className="budget-head">
        <div>
          <h3>{name}</h3>
          <p className="budget-amount">{formatCurrency(amount)} budgeted</p>
          <p className="budget-source">
            {income ? (
              <>Funded from <span className="income">{income.name}</span></>
            ) : (
              <span className="warning-text">Not linked to an income</span>
            )}
          </p>
        </div>
        <span className="budget-pct">
          {formatPercentage(amount ? spent / amount : 0)}
        </span>
      </div>

      <progress max={amount} value={Math.min(spent, amount)}>
        {formatPercentage(amount ? spent / amount : 0)}
      </progress>

      <div className="progress-text">
        <small>
          <strong>{formatCurrency(spent)}</strong> spent
        </small>
        <small className="remaining">
          <strong>{formatCurrency(Math.abs(remaining))}</strong>{" "}
          {isOver ? "over budget" : "remaining"}
        </small>
      </div>

      <div className="actions">
        {showDelete ? (
          <Form method="post" action="delete">
            {/* Hidden real submit button; React Router handles this */}
            <button ref={submitRef} type="submit" hidden />
            <button
              type="button"
              className="btn btn--warning"
              onClick={() => setShowModal(true)}
            >
              <TrashIcon width={18} />
              <span>Delete budget</span>
            </button>
          </Form>
        ) : (
          <Link to={`/budget/${id}`} className="btn">
            <span>View details</span>
            <ArrowRightIcon width={16} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default BudgetItem;
