import { useLoaderData } from "react-router-dom";
import { BanknotesIcon } from "@heroicons/react/24/outline";

import PageHeader from "../components/PageHeader";
import AddIncomeForm from "../components/AddIncomeForm";
import IncomeTable from "../components/IncomeTable";

import { fetchData, formatCurrency, getTotals, sortByNewest } from "../helpers";
import { handleAction } from "../actions/handleAction";
import { requireUser } from "../auth";

// loader
export function incomeLoader() {
  requireUser();
  const incomes = fetchData("incomes") ?? [];
  const budgets = fetchData("budgets") ?? [];
  return { incomes: sortByNewest(incomes), budgets, totals: getTotals() };
}

// action
export async function incomeAction({ request }) {
  return handleAction(request, ["createIncome", "deleteIncome"]);
}

const IncomePage = () => {
  const { incomes, budgets, totals } = useLoaderData();
  const { income: total, budgeted, leftToBudget: free } = totals;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Earn"
        title="Income"
        subtitle="Everything you’ve received. Budgets are funded from these."
      />

      <div className="split">
        <div className="split-main">
          <div className="kpis kpis--row">
            <div className="kpi kpi--income">
              <span className="eyebrow">Total income</span>
              <strong>{formatCurrency(total)}</strong>
              <small>
                {incomes.length} {incomes.length === 1 ? "entry" : "entries"}
              </small>
            </div>
            <div className="kpi">
              <span className="eyebrow">Budgeted</span>
              <strong>{formatCurrency(budgeted)}</strong>
              <small>Across {budgets.length} budgets</small>
            </div>
            <div className={`kpi${free < 0 ? " kpi--negative" : ""}`}>
              <span className="eyebrow">
                {free < 0 ? "Over-budgeted" : "Left to budget"}
              </span>
              <strong>{formatCurrency(Math.abs(free))}</strong>
              <small>After budgets, unbudgeted spending and loans</small>
            </div>
          </div>

          {incomes.length > 0 ? (
            <IncomeTable incomes={incomes} budgets={budgets} />
          ) : (
            <div className="empty">
              <BanknotesIcon width={40} />
              <h2 className="h3">No income recorded yet</h2>
              <p>Add your salary, side hustle or any money you receive.</p>
            </div>
          )}
        </div>
        <aside className="split-side">
          <AddIncomeForm />
        </aside>
      </div>
    </div>
  );
};

export default IncomePage;
