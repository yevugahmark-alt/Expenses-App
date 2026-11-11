import { useLoaderData } from "react-router-dom";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";

import PageHeader from "../components/PageHeader";
import AddLoanForm from "../components/AddLoanForm";
import LoanItem from "../components/LoanItem";

import { fetchData, formatCurrency, loanStatus, summarizeLoans } from "../helpers";
import { handleAction } from "../actions/handleAction";
import { requireUser } from "../auth";

// loader
export function loansLoader() {
  requireUser();
  return { loans: fetchData("loans") ?? [] };
}

// action
export async function loansAction({ request }) {
  return handleAction(request, ["createLoan", "updateLoan", "repayLoan", "deleteLoan"]);
}

// overdue first, then soonest due, then newest
const byUrgency = (a, b) => {
  const sa = loanStatus(a);
  const sb = loanStatus(b);
  if (sa.overdue !== sb.overdue) return sa.overdue ? -1 : 1;
  const da = a.dueAt ?? Infinity;
  const db = b.dueAt ?? Infinity;
  if (da !== db) return da - db;
  return b.createdAt - a.createdAt;
};

const LoanList = ({ title, loans }) =>
  loans.length > 0 && (
    <div className="grid-sm">
      <div className="section-title">
        <h2>
          {title}
          <span className="count-badge">{loans.length}</span>
        </h2>
      </div>
      <ul className="loan-list">
        {loans.map((loan) => (
          <LoanItem key={loan.id} loan={loan} />
        ))}
      </ul>
    </div>
  );

const LoansPage = () => {
  const { loans } = useLoaderData();
  const { owedToYou, youOwe } = summarizeLoans(loans);

  const open = loans.filter((l) => !loanStatus(l).settled);
  const settled = loans
    .filter((l) => loanStatus(l).settled)
    .sort((a, b) => b.createdAt - a.createdAt);
  const lentOpen = open.filter((l) => l.direction === "lent").sort(byUrgency);
  const borrowedOpen = open.filter((l) => l.direction === "borrowed").sort(byUrgency);
  const overdue = lentOpen.filter((l) => loanStatus(l).overdue).length;

  return (
    <div className="page">
      <PageHeader
        title="Loans"
        subtitle="Money you've lent or borrowed. Loans change your balance but don't count as income or spending."
      />

      <div className="split">
        <div className="split-main">
          <div className="kpis kpis--row">
            <div className="kpi kpi--income">
              <span className="eyebrow">Owed to you</span>
              <strong>{formatCurrency(owedToYou)}</strong>
              <small>
                {lentOpen.length} open {lentOpen.length === 1 ? "loan" : "loans"}
                {overdue > 0 && `, ${overdue} overdue`}
              </small>
            </div>
            <div className={`kpi${youOwe > 0 ? " kpi--negative" : ""}`}>
              <span className="eyebrow">You owe</span>
              <strong>{formatCurrency(youOwe)}</strong>
              <small>
                {borrowedOpen.length} open {borrowedOpen.length === 1 ? "loan" : "loans"}
              </small>
            </div>
          </div>

          {loans.length === 0 ? (
            <div className="empty">
              <ArrowsRightLeftIcon width={40} />
              <h2 className="h3">No loans recorded</h2>
              <p>
                Lent a friend some money, or borrowed some? Record it here to keep
                track of who owes what.
              </p>
            </div>
          ) : (
            <>
              <LoanList title="Owed to you" loans={lentOpen} />
              <LoanList title="You owe" loans={borrowedOpen} />
              {settled.length > 0 && (
                <details className="settled-loans">
                  <summary>
                    Settled loans <span className="count-badge">{settled.length}</span>
                  </summary>
                  <ul className="loan-list">
                    {settled.map((loan) => (
                      <LoanItem key={loan.id} loan={loan} />
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
        <aside className="split-side">
          <AddLoanForm />
        </aside>
      </div>
    </div>
  );
};

export default LoansPage;
