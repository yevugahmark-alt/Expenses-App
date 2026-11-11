// rrd imports
import { Link, useLoaderData } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import PageHeader from "../components/PageHeader";
import { requireUser } from "../auth";

// components
import AddExpenseForm from "../components/AddExpenseForm";
import BudgetItem from "../components/BudgetItem";
import EditBudgetForm from "../components/EditBudgetForm";
import Table from "../components/Table";

// helpers
import { fetchData, getAllMatchingItems, sortByNewest } from "../helpers";
import { handleAction } from "../actions/handleAction";

// loader
export function budgetLoader({ params }) {
  requireUser();
  const budget = getAllMatchingItems({
    category: "budgets",
    key: "id",
    value: params.id,
  })[0];

  if (!budget) {
    throw new Error("The budget you’re trying to find doesn’t exist");
  }

  const expenses = getAllMatchingItems({
    category: "expenses",
    key: "budgetId",
    value: params.id,
  });

  const incomes = fetchData("incomes") ?? [];
  const budgets = fetchData("budgets") ?? [];

  return { budget, expenses: sortByNewest(expenses), incomes, budgets };
}

// action
export async function budgetAction({ request }) {
  return handleAction(request, [
    "createExpense",
    "deleteExpense",
    "updateBudget",
  ]);
}

const BudgetPage = () => {
  const { budget, expenses, incomes, budgets } = useLoaderData();

  return (
    <div
      className="page"
      style={{
        "--accent": budget.color,
      }}
    >
      <PageHeader
        back={
          <Link to="/budgets" className="back-link">
            <ArrowLeftIcon width={14} /> All budgets
          </Link>
        }
        title={<span className="accent">{budget.name}</span>}
        subtitle="Budget overview"
      />
      <div className="flex-lg">
        <div className="grid-md budget-column">
          <BudgetItem budget={budget} showDelete={true} />
          <EditBudgetForm
            key={budget.id}
            budget={budget}
            incomes={incomes}
            budgets={budgets}
          />
        </div>
        <AddExpenseForm budgets={[budget]} lockBudget />
      </div>
      {expenses.length > 0 ? (
        <div className="grid-md">
          <div className="section-title">
            <h2>
              Expenses<span className="count-badge">{expenses.length}</span>
            </h2>
          </div>
          <Table expenses={expenses} showBudget={false} />
        </div>
      ) : (
        <div className="empty">
          <h2 className="h3">No expenses in this budget yet</h2>
          <p>Use the form above to log your first one.</p>
        </div>
      )}
    </div>
  );
};
export default BudgetPage;
