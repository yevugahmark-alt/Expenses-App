import { toast } from "react-toastify";
import {
  calculateSpentByBudget,
  createBudget,
  createExpense,
  createIncome,
  createLoan,
  deleteIncome,
  deleteItem,
  formatCurrency,
  getTotals,
  repayLoan,
  updateBudget,
  updateLoan,
} from "../helpers";

// Every action returns { ok, error? } so forms know whether to reset.
const handlers = {
  createIncome: ({ newIncome, newIncomeAmount, newIncomeDate }) => {
    const income = createIncome({
      name: newIncome,
      amount: newIncomeAmount,
      date: newIncomeDate,
    });
    toast.success(`Income “${income.name}” recorded!`);
  },

  deleteIncome: ({ incomeId }) => {
    deleteIncome(incomeId);
    toast.success("Income deleted!");
  },

  createBudget: ({ newBudget, newBudgetAmount, newBudgetIncome }) => {
    const budget = createBudget({
      name: newBudget,
      amount: newBudgetAmount,
      incomeId: newBudgetIncome,
    });
    toast.success(`Budget “${budget.name}” created!`);
  },

  updateBudget: ({ budgetId, budgetName, budgetAmount, budgetIncome }) => {
    updateBudget({
      id: budgetId,
      name: budgetName,
      amount: budgetAmount,
      incomeId: budgetIncome,
    });
    toast.success("Budget updated!");
  },

  createExpense: ({
    newExpense,
    newExpenseAmount,
    newExpenseBudget,
    newExpenseDate,
  }) => {
    const { expense, budget } = createExpense({
      name: newExpense,
      amount: newExpenseAmount,
      budgetId: newExpenseBudget,
      date: newExpenseDate,
    });
    toast.success(`Expense “${expense.name}” added!`);
    if (!budget) return;

    const spent = calculateSpentByBudget(budget.id);
    if (spent > budget.amount) {
      toast.warn(
        `${budget.name} is now ${formatCurrency(spent - budget.amount)} over budget.`
      );
    } else if (spent >= budget.amount * 0.9) {
      toast.info(
        `Heads up: ${budget.name} has only ${formatCurrency(
          budget.amount - spent
        )} left.`
      );
    }
  },

  deleteExpense: ({ expenseId }) => {
    deleteItem({ key: "expenses", id: expenseId });
    toast.success("Expense deleted!");
  },

  createLoan: ({ loanDirection, loanPerson, loanAmount, loanDate, loanDue, loanNote }) => {
    const loan = createLoan({
      direction: loanDirection,
      person: loanPerson,
      amount: loanAmount,
      date: loanDate,
      dueDate: loanDue,
      note: loanNote,
    });
    toast.success(
      loan.direction === "lent"
        ? `Recorded ${formatCurrency(loan.amount)} lent to ${loan.person}.`
        : `Recorded ${formatCurrency(loan.amount)} borrowed from ${loan.person}.`
    );
    const { balance } = getTotals();
    if (loan.direction === "lent" && balance < 0)
      toast.warn(
        `Your available balance is now ${formatCurrency(balance)}. Record any missing income.`
      );
  },

  repayLoan: ({ loanId, repayAmount, repayDate }) => {
    const { loan, remaining } = repayLoan({
      id: loanId,
      amount: repayAmount,
      date: repayDate,
    });
    const who = loan.person;
    if (remaining <= 0)
      toast.success(
        loan.direction === "lent"
          ? `${who} has paid you back in full.`
          : `You've paid ${who} back in full.`
      );
    else
      toast.success(`Repayment recorded. ${formatCurrency(remaining)} still outstanding.`);
  },

  updateLoan: ({ loanId, loanDirection, loanPerson, loanAmount, loanDate, loanDue, loanNote }) => {
    updateLoan({
      id: loanId,
      direction: loanDirection,
      person: loanPerson,
      amount: loanAmount,
      date: loanDate,
      dueDate: loanDue,
      note: loanNote,
    });
    toast.success("Loan updated.");
  },

  deleteLoan: ({ loanId }) => {
    deleteItem({ key: "loans", id: loanId });
    toast.success("Loan deleted.");
  },
};

export async function handleAction(request, allowed = Object.keys(handlers)) {
  const data = await request.formData();
  const { _action, _inline, ...values } = Object.fromEntries(data);

  if (!allowed.includes(_action)) {
    throw new Error(`Unknown action: ${_action}`);
  }

  try {
    handlers[_action](values);
    return { ok: true, action: _action };
  } catch (e) {
    // forms with an inline <FormError> show the message themselves
    if (!_inline) toast.error(e.message || "Something went wrong.");
    return { ok: false, action: _action, error: e.message || "Something went wrong." };
  }
}
