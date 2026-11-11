import { scopedKey } from "./session";

export const waait = () =>
  new Promise((res) => setTimeout(res, Math.random() * 800));

// ---------- storage ----------

export const fetchData = (key) => {
  try {
    return JSON.parse(localStorage.getItem(scopedKey(key)));
  } catch {
    // corrupted value: treat as missing instead of crashing the app
    return null;
  }
};

const saveData = (key, value) =>
  localStorage.setItem(scopedKey(key), JSON.stringify(value));

export const getAllMatchingItems = ({ category, key, value }) => {
  const data = fetchData(category) ?? [];
  return data.filter((item) => item[key] === value);
};

export const deleteItem = ({ key, id }) => {
  if (!id) return localStorage.removeItem(scopedKey(key));
  const existingData = fetchData(key) ?? [];
  return saveData(
    key,
    existingData.filter((item) => item.id !== id)
  );
};

export const updateItem = ({ key, id, changes }) => {
  const existingData = fetchData(key) ?? [];
  let found = false;
  const newData = existingData.map((item) => {
    if (item.id !== id) return item;
    found = true;
    return { ...item, ...changes };
  });
  if (!found) throw new Error("Item not found.");
  return saveData(key, newData);
};

// ---------- validation ----------

export const parseName = (value, label = "Name") => {
  const name = String(value ?? "").trim();
  if (!name) throw new Error(`${label} can’t be empty.`);
  if (name.length > 60) throw new Error(`${label} must be 60 characters or fewer.`);
  return name;
};

export const parseAmount = (value, label = "Amount") => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error(`${label} must be a number greater than 0.`);
  // store to the cent to avoid float drift (0.1 + 0.2 …)
  return Math.round(amount * 100) / 100;
};

// "YYYY-MM-DD" from a date input → epoch ms at local noon (avoids TZ day shifts)
export const parseDate = (value) => {
  if (!value) return Date.now();
  const [y, m, d] = String(value).split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date.");
  if (date.getTime() > Date.now() + 864e5)
    throw new Error("Expense date can’t be in the future.");
  return date.getTime();
};

export const todayInputValue = () => toInputDate(Date.now());

// epoch ms → "YYYY-MM-DD" in local time, for date inputs
export const toInputDate = (epoch) => {
  const d = new Date(epoch);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ---------- totals ----------

const sum = (items, key = "amount") =>
  Math.round(items.reduce((acc, i) => acc + i[key], 0) * 100) / 100;

const round2 = (n) => Math.round(n * 100) / 100;

// Single source of truth for the dashboard numbers. Pure, so the UI can use
// it with loader data.
//   balance     = income − everything spent
//   reserved    = what's still unspent inside budgets
//   leftToBudget = balance − reserved: money with no job yet. Spending with no
//                 budget (or beyond a budget's limit) comes out of this.
export const computeTotals = ({
  incomes = [],
  budgets = [],
  expenses = [],
  loans = [],
}) => {
  const income = sum(incomes);
  const budgeted = sum(budgets);
  const spent = sum(expenses);
  const budgetIds = new Set(budgets.map((b) => b.id));
  const reserved = round2(
    budgets.reduce((acc, b) => {
      const used = sum(expenses.filter((e) => e.budgetId === b.id));
      return acc + Math.max(b.amount - used, 0);
    }, 0)
  );
  // loans move cash without being income or spending
  const { owedToYou, youOwe } = summarizeLoans(loans);
  const balance = round2(income - spent - owedToYou + youOwe);
  return {
    income,
    budgeted,
    spent,
    unbudgetedSpent: sum(expenses.filter((e) => !budgetIds.has(e.budgetId))),
    reserved,
    balance,
    owedToYou,
    youOwe,
    leftToBudget: round2(balance - reserved),
  };
};

export const getTotals = () =>
  computeTotals({
    incomes: fetchData("incomes") ?? [],
    budgets: fetchData("budgets") ?? [],
    expenses: fetchData("expenses") ?? [],
    loans: fetchData("loans") ?? [],
  });

// Per-income view: how much of each income is already given to budgets.
// Pure function so the UI can use it with loader data.
export const getIncomeAllocations = (incomes = [], budgets = []) =>
  incomes.map((income) => {
    const allocated = sum(budgets.filter((b) => b.incomeId === income.id));
    return {
      ...income,
      allocated,
      available: Math.round((income.amount - allocated) * 100) / 100,
    };
  });

// A budget can't exceed what's left of the income it is funded from.
// `excludeBudgetId` lets an edited budget ignore its own current allocation.
const assertFundsAvailable = ({ incomeId, amount, excludeBudgetId }) => {
  const incomes = fetchData("incomes") ?? [];
  if (incomes.length === 0)
    throw new Error("Record some income first. Budgets are funded from your income.");

  const budgets = (fetchData("budgets") ?? []).filter(
    (b) => b.id !== excludeBudgetId
  );
  const income = getIncomeAllocations(incomes, budgets).find(
    (i) => i.id === incomeId
  );
  if (!income) throw new Error("Please choose which income funds this budget.");

  if (amount > income.available)
    throw new Error(
      income.available > 0
        ? `Only ${formatCurrency(income.available)} of “${income.name}” is left to budget.`
        : `“${income.name}” is fully budgeted. Pick another income or add more.`
    );

  // money already spent outside budgets can't be budgeted again
  const { leftToBudget } = computeTotals({
    incomes,
    budgets,
    expenses: fetchData("expenses") ?? [],
    loans: fetchData("loans") ?? [],
  });
  if (amount > leftToBudget)
    throw new Error(
      leftToBudget > 0
        ? `Only ${formatCurrency(leftToBudget)} is left to budget after unbudgeted spending and loans.`
        : "Nothing is left to budget: spending outside your budgets or money you've lent has used your free money."
    );
};

// ---------- income ----------

export const createIncome = ({ name, amount, date }) => {
  const newItem = {
    id: crypto.randomUUID(),
    name: parseName(name, "Income source"),
    createdAt: parseDate(date),
    amount: parseAmount(amount, "Income amount"),
  };
  const incomes = fetchData("incomes") ?? [];
  saveData("incomes", [...incomes, newItem]);
  return newItem;
};

export const deleteIncome = (id) => {
  const funded = getAllMatchingItems({
    category: "budgets",
    key: "incomeId",
    value: id,
  });
  if (funded.length > 0) {
    const names = funded.map((b) => `“${b.name}”`).join(", ");
    throw new Error(
      `This income funds ${names}. Move or delete ${
        funded.length === 1 ? "that budget" : "those budgets"
      } first.`
    );
  }
  deleteItem({ key: "incomes", id });
};

// ---------- budgets ----------

// golden-angle hue spacing: colors stay distinct no matter how many budgets
const generateRandomColor = () => {
  const count = fetchData("budgets")?.length ?? 0;
  return `${Math.round((183 + count * 137.508) % 360)} 65% 45%`;
};

export const createBudget = ({ name, amount, incomeId }) => {
  const budgets = fetchData("budgets") ?? [];
  const cleanName = parseName(name, "Budget name");
  if (budgets.some((b) => b.name.toLowerCase() === cleanName.toLowerCase()))
    throw new Error(`A budget named “${cleanName}” already exists.`);

  const cleanAmount = parseAmount(amount, "Budget amount");
  assertFundsAvailable({ incomeId, amount: cleanAmount });

  const newItem = {
    id: crypto.randomUUID(),
    name: cleanName,
    createdAt: Date.now(),
    amount: cleanAmount,
    incomeId,
    color: generateRandomColor(),
  };
  saveData("budgets", [...budgets, newItem]);
  return newItem;
};

export const updateBudget = ({ id, name, amount, incomeId }) => {
  const budgets = fetchData("budgets") ?? [];
  const cleanName = parseName(name, "Budget name");
  if (
    budgets.some(
      (b) => b.id !== id && b.name.toLowerCase() === cleanName.toLowerCase()
    )
  )
    throw new Error(`A budget named “${cleanName}” already exists.`);

  const current = budgets.find((b) => b.id === id);
  if (!current) throw new Error("Budget not found.");
  const cleanAmount = parseAmount(amount, "Budget amount");
  const newIncomeId = incomeId || current.incomeId;
  // check funds when the amount grows or the budget moves to another income
  if (cleanAmount > current.amount || newIncomeId !== current.incomeId)
    assertFundsAvailable({
      incomeId: newIncomeId,
      amount: cleanAmount,
      excludeBudgetId: id,
    });

  updateItem({
    key: "budgets",
    id,
    changes: { name: cleanName, amount: cleanAmount, incomeId: newIncomeId },
  });
};

// ---------- expenses ----------

export const createExpense = ({ name, amount, budgetId, date }) => {
  // budgetId is optional: an empty value records an unbudgeted expense
  let budget = null;
  if (budgetId) {
    const budgets = fetchData("budgets") ?? [];
    budget = budgets.find((b) => b.id === budgetId);
    if (!budget) throw new Error("Please choose a valid budget.");
  }

  const newItem = {
    id: crypto.randomUUID(),
    name: parseName(name, "Expense name"),
    createdAt: parseDate(date),
    amount: parseAmount(amount, "Expense amount"),
    budgetId: budget ? budget.id : null,
  };
  const existingExpenses = fetchData("expenses") ?? [];
  saveData("expenses", [...existingExpenses, newItem]);
  return { expense: newItem, budget };
};

export const calculateSpentByBudget = (budgetId) => {
  const expenses = fetchData("expenses") ?? [];
  const total = expenses.reduce(
    (acc, expense) =>
      expense.budgetId === budgetId ? acc + expense.amount : acc,
    0
  );
  return Math.round(total * 100) / 100;
};

export const sortByNewest = (items = []) =>
  [...items].sort((a, b) => b.createdAt - a.createdAt);

// ---------- loans ----------
// A loan: { id, direction: "lent" | "borrowed", person, amount, createdAt,
//           dueAt: number | null, note, repayments: [{ id, amount, createdAt }] }

export const loanStatus = (loan) => {
  const repaid = sum(loan.repayments ?? []);
  const remaining = round2(loan.amount - repaid);
  const settled = remaining <= 0;
  return {
    repaid,
    remaining: Math.max(remaining, 0),
    settled,
    overdue: !settled && loan.dueAt != null && loan.dueAt < Date.now(),
  };
};

export const summarizeLoans = (loans = []) =>
  loans.reduce(
    (acc, loan) => {
      const { remaining } = loanStatus(loan);
      if (loan.direction === "borrowed") acc.youOwe = round2(acc.youOwe + remaining);
      else acc.owedToYou = round2(acc.owedToYou + remaining);
      return acc;
    },
    { owedToYou: 0, youOwe: 0 }
  );

// due dates may be in the future, so they skip parseDate's future check
const parseDueDate = (value, startedAt) => {
  if (!value) return null;
  const [y, m, d] = String(value).split("-").map(Number);
  const due = new Date(y, m - 1, d, 23, 59).getTime();
  if (Number.isNaN(due)) throw new Error("Invalid due date.");
  if (due < startedAt) throw new Error("The due date can’t be before the loan date.");
  return due;
};

export const createLoan = ({ direction, person, amount, date, dueDate, note }) => {
  if (!["lent", "borrowed"].includes(direction))
    throw new Error("Choose whether you lent or borrowed the money.");
  const createdAt = parseDate(date);
  const loan = {
    id: crypto.randomUUID(),
    direction,
    person: parseName(person, "Name"),
    amount: parseAmount(amount, "Loan amount"),
    createdAt,
    dueAt: parseDueDate(dueDate, createdAt),
    note: String(note ?? "").trim().slice(0, 120),
    repayments: [],
  };
  saveData("loans", [...(fetchData("loans") ?? []), loan]);
  return loan;
};

export const updateLoan = ({ id, direction, person, amount, date, dueDate, note }) => {
  const loan = (fetchData("loans") ?? []).find((l) => l.id === id);
  if (!loan) throw new Error("Loan not found.");
  if (!["lent", "borrowed"].includes(direction))
    throw new Error("Choose whether you lent or borrowed the money.");

  const cleanAmount = parseAmount(amount, "Loan amount");
  const repaid = sum(loan.repayments ?? []);
  if (cleanAmount < repaid)
    throw new Error(
      `The amount can’t be less than the ${formatCurrency(repaid)} already repaid.`
    );

  const createdAt = parseDate(date);
  const firstRepayment = Math.min(...(loan.repayments ?? []).map((r) => r.createdAt));
  if (createdAt > firstRepayment)
    throw new Error("The loan date can’t be after its first repayment.");

  updateItem({
    key: "loans",
    id,
    changes: {
      direction,
      person: parseName(person, "Name"),
      amount: cleanAmount,
      createdAt,
      dueAt: parseDueDate(dueDate, createdAt),
      note: String(note ?? "").trim().slice(0, 120),
    },
  });
};

export const repayLoan = ({ id, amount, date }) => {
  const loans = fetchData("loans") ?? [];
  const loan = loans.find((l) => l.id === id);
  if (!loan) throw new Error("Loan not found.");
  const { remaining } = loanStatus(loan);
  if (remaining <= 0) throw new Error("This loan is already settled.");
  const clean = parseAmount(amount, "Repayment");
  if (clean > remaining)
    throw new Error(`Only ${formatCurrency(remaining)} is still outstanding.`);
  const createdAt = parseDate(date);
  if (createdAt < new Date(loan.createdAt).setHours(0, 0, 0, 0))
    throw new Error("A repayment can’t be dated before the loan.");

  const repayment = { id: crypto.randomUUID(), amount: clean, createdAt };
  updateItem({
    key: "loans",
    id,
    changes: { repayments: [...(loan.repayments ?? []), repayment] },
  });
  return { loan, repayment, remaining: round2(remaining - clean) };
};

// ---------- formatting ----------

export const formatDateToLocaleString = (epoch) =>
  new Date(epoch).toLocaleDateString();

export const formatPercentage = (amt) => {
  return amt.toLocaleString(undefined, {
    style: "percent",
    minimumFractionDigits: 0,
  });
};

export const formatCurrency = (amt) => {
  return amt.toLocaleString(undefined, {
    style: "currency",
    currency: "GHS",
  });
};

// ---------- export ----------

export const exportExpensesToCSV = (expenses) => {
  const budgets = fetchData("budgets") ?? [];
  const budgetName = (id) => budgets.find((b) => b.id === id)?.name ?? "";
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;

  const rows = [
    ["Name", "Amount", "Date", "Budget"],
    ...expenses.map((e) => [
      e.name,
      e.amount.toFixed(2),
      new Date(e.createdAt).toISOString().slice(0, 10),
      budgetName(e.budgetId),
    ]),
  ];
  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `expenses-${todayInputValue()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
