import { Link } from "react-router-dom";
import { CheckIcon } from "@heroicons/react/24/solid";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const GettingStarted = ({ hasIncome, hasBudget, hasExpense }) => {
  const steps = [
    {
      done: hasIncome,
      title: "Record your income",
      text: "Add your salary or any money you receive.",
      to: "/income",
      cta: "Add income",
    },
    {
      done: hasBudget,
      title: "Split it into budgets",
      text: "Give each part of your income a job: Food, Rent, Transport.",
      to: "/budgets",
      cta: "Create budget",
    },
    {
      done: hasExpense,
      title: "Track your spending",
      text: "Log expenses, with or without a budget, to see what’s left.",
      to: "/expenses",
      cta: "Add expense",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  return (
    <section className="panel onboarding">
      <div className="panel-head">
        <div>
          <h2>Get set up</h2>
          <small className="muted">
            {doneCount} of {steps.length} steps complete
          </small>
        </div>
        <div className="onboarding-progress" aria-hidden="true">
          <span style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
      </div>
      <ol className="steps">
        {steps.map((step, i) => (
          <li key={step.title} className={`step${step.done ? " is-done" : ""}`}>
            <span className="step-num">
              {step.done ? <CheckIcon width={14} /> : i + 1}
            </span>
            <div className="step-body">
              <strong>{step.title}</strong>
              <small>{step.text}</small>
            </div>
            {step === next && (
              <Link to={step.to} className="btn btn--dark btn--sm">
                <span>{step.cta}</span>
                <ArrowRightIcon width={14} />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
};

export default GettingStarted;
