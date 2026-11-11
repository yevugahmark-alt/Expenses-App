// On-device budgeting insights. Pure functions over loader data: nothing
// leaves the browser. Each insight has a priority (higher shows first).
import {
  computeTotals,
  formatCurrency,
  formatPercentage,
  loanStatus,
} from "./helpers";

const DAY = 864e5;
const round = (n) => Math.round(n * 100) / 100;
const sum = (items) => round(items.reduce((acc, i) => acc + i.amount, 0));

const monthStart = (d, offset = 0) =>
  new Date(d.getFullYear(), d.getMonth() + offset, 1).getTime();

const median = (nums) => {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export const getInsights = ({
  incomes = [],
  budgets = [],
  expenses = [],
  loans = [],
  now = new Date(),
}) => {
  const out = [];
  const add = (insight) => out.push(insight);
  const budgetById = Object.fromEntries(budgets.map((b) => [b.id, b]));

  const thisMonthStart = monthStart(now);
  const lastMonthStart = monthStart(now, -1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  const inRange = (items, from, to) =>
    items.filter((i) => i.createdAt >= from && i.createdAt < to);

  const spentByBudget = (id) => sum(expenses.filter((e) => e.budgetId === id));

  // 1. Budgets already over, or on track to run out soon
  budgets.forEach((b) => {
    const spent = spentByBudget(b.id);
    if (spent > b.amount) {
      add({
        id: `over-${b.id}`,
        tone: "warn",
        priority: 100 + (spent - b.amount) / b.amount,
        title: `${b.name} is over budget`,
        text: `You've spent ${formatCurrency(spent)} of ${formatCurrency(
          b.amount
        )}, which is ${formatCurrency(round(spent - b.amount))} too much. Raise the budget or pause spending here.`,
        to: `/budget/${b.id}`,
        cta: "Review budget",
      });
      return;
    }

    // pace: how fast this budget has been used since it was created
    const ageDays = Math.max((now - b.createdAt) / DAY, 1);
    const perDay = spent / ageDays;
    const remaining = b.amount - spent;
    if (perDay > 0 && remaining > 0 && ageDays >= 3) {
      const daysToEmpty = remaining / perDay;
      if (daysToEmpty < 7) {
        add({
          id: `pace-${b.id}`,
          tone: "warn",
          priority: 80 - daysToEmpty,
          title: `${b.name} may run out in ${Math.max(
            Math.round(daysToEmpty),
            1
          )} ${Math.round(daysToEmpty) === 1 ? "day" : "days"}`,
          text: `You're spending about ${formatCurrency(
            round(perDay)
          )} a day here and ${formatCurrency(round(remaining))} is left.`,
          to: `/budget/${b.id}`,
          cta: "See expenses",
        });
      }
    }
  });

  // 2. This month's pace compared with last month
  const spentThisMonth = sum(inRange(expenses, thisMonthStart, Infinity));
  // same moment last month (clamped, e.g. 31 Mar → 28/29 Feb)
  const daysInLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const lastMonthSameDay = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    Math.min(dayOfMonth, daysInLastMonth),
    now.getHours(),
    now.getMinutes()
  ).getTime();
  const spentLastMonthToDate = sum(
    inRange(expenses, lastMonthStart, lastMonthSameDay)
  );

  if (spentThisMonth > 0 && dayOfMonth >= 5) {
    const projected = round((spentThisMonth / dayOfMonth) * daysInMonth);
    if (spentLastMonthToDate > 0) {
      const change = (spentThisMonth - spentLastMonthToDate) / spentLastMonthToDate;
      if (change >= 0.2) {
        add({
          id: "pace-month-up",
          tone: "warn",
          priority: 60 + Math.min(change, 1) * 10,
          title: `Spending is up ${formatPercentage(change)} on last month`,
          text: `By this day last month you'd spent ${formatCurrency(
            spentLastMonthToDate
          )}. This month it's ${formatCurrency(
            spentThisMonth
          )}. At this rate you'll spend about ${formatCurrency(projected)} by month end.`,
          to: "/expenses",
          cta: "See expenses",
        });
      } else if (change <= -0.15) {
        add({
          id: "pace-month-down",
          tone: "good",
          priority: 30,
          title: `Spending is down ${formatPercentage(-change)} on last month`,
          text: `You've spent ${formatCurrency(
            round(spentLastMonthToDate - spentThisMonth)
          )} less than at this point last month. Consider moving the difference to savings.`,
        });
      }
    } else if (daysLeft > 0) {
      add({
        id: "pace-month",
        tone: "tip",
        priority: 20,
        title: `On course to spend ${formatCurrency(projected)} this month`,
        text: `That's based on ${formatCurrency(
          spentThisMonth
        )} spent over the first ${dayOfMonth} days.`,
      });
    }
  }

  // 3. Savings rate this month
  const incomeThisMonth = sum(inRange(incomes, thisMonthStart, Infinity));
  if (incomeThisMonth > 0 && spentThisMonth > 0) {
    const rate = (incomeThisMonth - spentThisMonth) / incomeThisMonth;
    if (rate < 0) {
      add({
        id: "savings-negative",
        tone: "warn",
        priority: 90,
        title: "You're spending more than you earned this month",
        text: `Income this month is ${formatCurrency(
          incomeThisMonth
        )} and spending is ${formatCurrency(spentThisMonth)}. Cut back on your largest budget first.`,
        to: "/budgets",
        cta: "Review budgets",
      });
    } else if (rate >= 0.2) {
      add({
        id: "savings-good",
        tone: "good",
        priority: 25,
        title: `You're keeping ${formatPercentage(rate)} of this month's income`,
        text: "Saving 20% or more is a healthy target. Keep it up.",
      });
    } else if (daysLeft > 7) {
      add({
        id: "savings-low",
        tone: "tip",
        priority: 40,
        title: `Only ${formatPercentage(rate)} of this month's income is left`,
        text: `Aim to keep at least 20% (${formatCurrency(
          round(incomeThisMonth * 0.2)
        )}). Smaller daily spends over the next ${daysLeft} days will get you there.`,
      });
    }
  }

  // 4. Income that hasn't been given a budget
  const totalIncome = sum(incomes);
  const unallocated = computeTotals({ incomes, budgets, expenses, loans }).leftToBudget;
  if (totalIncome > 0 && unallocated / totalIncome >= 0.15) {
    add({
      id: "unallocated",
      tone: "tip",
      priority: 35,
      title: `${formatCurrency(unallocated)} isn't in a budget yet`,
      text: "Give it a job: create a savings or emergency-fund budget so it doesn't get spent by accident.",
      to: "/budgets",
      cta: "Create budget",
    });
  }

  // 5. Spending outside any budget
  const unbudgeted = expenses.filter((e) => !budgetById[e.budgetId]);
  const unbudgetedTotal = sum(unbudgeted);
  const totalSpent = sum(expenses);
  if (unbudgeted.length >= 3 && totalSpent > 0 && unbudgetedTotal / totalSpent >= 0.2) {
    add({
      id: "unbudgeted",
      tone: "tip",
      priority: 45,
      title: `${formatPercentage(unbudgetedTotal / totalSpent)} of your spending has no budget`,
      text: `${formatCurrency(
        unbudgetedTotal
      )} across ${unbudgeted.length} expenses. A budget for these would show where it's going.`,
      to: "/expenses?budget=none",
      cta: "See them",
    });
  }

  // 6. Unusually large expense in the last 2 weeks
  const recent = expenses.filter((e) => now - e.createdAt <= 14 * DAY);
  let biggest = null;
  recent.forEach((e) => {
    const peers = expenses
      .filter((p) => p.id !== e.id && p.budgetId === e.budgetId)
      .map((p) => p.amount);
    if (peers.length < 4) return;
    const ratio = e.amount / median(peers);
    if (ratio >= 3 && (!biggest || ratio > biggest.ratio)) biggest = { e, ratio };
  });
  if (biggest) {
    const where = budgetById[biggest.e.budgetId]?.name ?? "unbudgeted spending";
    add({
      id: `outlier-${biggest.e.id}`,
      tone: "tip",
      priority: 50,
      title: `“${biggest.e.name}” was unusually large`,
      text: `At ${formatCurrency(biggest.e.amount)} it's about ${Math.round(
        biggest.ratio
      )}× your typical ${where} expense. Check it was planned.`,
    });
  }

  // 7. Biggest category, when one dominates
  if (budgets.length >= 2 && totalSpent > 0) {
    const top = budgets
      .map((b) => ({ b, spent: spentByBudget(b.id) }))
      .sort((a, b) => b.spent - a.spent)[0];
    const share = top.spent / totalSpent;
    if (share >= 0.5) {
      add({
        id: "dominant",
        tone: "tip",
        priority: 10,
        title: `${top.b.name} is ${formatPercentage(share)} of your spending`,
        text: "Small cuts in your largest category usually save the most.",
        to: `/budget/${top.b.id}`,
        cta: "Open",
      });
    }
  }

  // 8. Loans: overdue money owed to you, and debts due soon
  loans.forEach((loan) => {
    const st = loanStatus(loan);
    if (st.settled || loan.dueAt == null) return;
    const days = Math.ceil((loan.dueAt - now) / DAY);
    if (loan.direction === "lent" && loan.dueAt < now) {
      add({
        id: `loan-overdue-${loan.id}`,
        tone: "warn",
        priority: 70,
        title: `${loan.person} is late repaying ${formatCurrency(st.remaining)}`,
        text: `It was due on ${new Date(loan.dueAt).toLocaleDateString()}. A friendly reminder now is easier than later.`,
        to: "/loans",
        cta: "View loan",
      });
    } else if (loan.direction === "borrowed" && days <= 7) {
      add({
        id: `loan-due-${loan.id}`,
        tone: "warn",
        priority: days < 0 ? 85 : 65,
        title:
          days < 0
            ? `Your repayment to ${loan.person} is overdue`
            : `You owe ${loan.person} ${formatCurrency(st.remaining)} ${
                days <= 0 ? "today" : `in ${days} ${days === 1 ? "day" : "days"}`
              }`,
        text: `Keep ${formatCurrency(st.remaining)} aside so it doesn't get spent.`,
        to: "/loans",
        cta: "View loan",
      });
    }
  });

  return out.sort((a, b) => b.priority - a.priority);
};
