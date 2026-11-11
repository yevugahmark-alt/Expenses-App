import { Link, useLoaderData } from "react-router-dom";
import { ChartPieIcon } from "@heroicons/react/24/outline";

import PageHeader from "../components/PageHeader";
import AddBudgetForm from "../components/AddBudgetForm";
import BudgetItem from "../components/BudgetItem";

import { fetchData, formatCurrency } from "../helpers";
import { handleAction } from "../actions/handleAction";
import { requireUser } from "../auth";

// loader
export function budgetsLoader() {
  requireUser();
  const incomes = fetchData("incomes") ?? [];
  const budgets = fetchData("budgets") ?? [];
  return { incomes, budgets };
}

// action
export async function budgetsAction({ request }) {
  return handleAction(request, ["createBudget"]);
}

const BudgetsPage = () => {
  const { incomes, budgets } = useLoaderData();
  const budgeted = budgets.reduce((acc, b) => acc + b.amount, 0);
  const income = incomes.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Plan"
        title="Budgets"
        subtitle={
          budgets.length > 0
            ? `${formatCurrency(budgeted)} budgeted of ${formatCurrency(income)} income`
            : "Split your income into budgets so every cedi has a job."
        }
      />

      <div className="split">
        <div className="split-main">
          {budgets.length > 0 ? (
            <div className="budgets">
              {budgets.map((budget) => (
                <BudgetItem key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <ChartPieIcon width={40} />
              <h2 className="h3">No budgets yet</h2>
              <p>
                {incomes.length === 0 ? (
                  <>
                    Budgets are funded from income.{" "}
                    <Link to="/income" className="link-btn">
                      Record your income
                    </Link>{" "}
                    first.
                  </>
                ) : (
                  "Use the form to create your first budget."
                )}
              </p>
            </div>
          )}
        </div>
        <aside className="split-side">
          <AddBudgetForm incomes={incomes} budgets={budgets} />
        </aside>
      </div>
    </div>
  );
};

export default BudgetsPage;
