import {
  ArrowDownLeftIcon,
  ArrowsRightLeftIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import { computeTotals, formatCurrency, formatPercentage } from "../helpers";

const BalanceCard = ({ incomes = [], budgets = [], expenses = [], loans = [] }) => {
  const { income, budgeted, spent, reserved, balance, leftToBudget, owedToYou, youOwe } =
    computeTotals({ incomes, budgets, expenses, loans });
  const unallocated = leftToBudget;

  const pct = (n) => (income > 0 ? Math.max(Math.min(n / income, 1), 0) * 100 : 0);
  const spentPct = pct(spent);
  // still-unspent budget money; capped so the bar never exceeds 100%
  const reservedPct = Math.min(pct(reserved), 100 - spentPct);

  return (
    <div className="overview">
      <section className="hero-card" aria-label="Balance">
        <div className="hero-top">
          <span className="hero-label">Available balance</span>
          {income > 0 && (
            <span className="hero-chip">
              {formatPercentage(spent / income)} of income spent
            </span>
          )}
        </div>
        <div className={`hero-balance${balance < 0 ? " is-negative" : ""}`}>
          {formatCurrency(balance)}
        </div>

        <div className="hero-flows">
          <div>
            <span className="flow-icon flow-icon--in">
              <ArrowDownLeftIcon width={16} />
            </span>
            <div>
              <small>Income</small>
              <strong>{formatCurrency(income)}</strong>
            </div>
          </div>
          <div>
            <span className="flow-icon flow-icon--out">
              <ArrowUpRightIcon width={16} />
            </span>
            <div>
              <small>Spent</small>
              <strong>{formatCurrency(spent)}</strong>
            </div>
          </div>
          {owedToYou > 0 && (
            <div>
              <span className="flow-icon flow-icon--lent">
                <ArrowsRightLeftIcon width={16} />
              </span>
              <div>
                <small>Lent out</small>
                <strong>{formatCurrency(owedToYou)}</strong>
              </div>
            </div>
          )}
          {youOwe > 0 && (
            <div>
              <span className="flow-icon flow-icon--owe">
                <ArrowsRightLeftIcon width={16} />
              </span>
              <div>
                <small>You owe</small>
                <strong>{formatCurrency(youOwe)}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="hero-bar" aria-hidden="true">
          <span className="hero-bar-spent" style={{ width: `${spentPct}%` }} />
          <span className="hero-bar-reserved" style={{ width: `${reservedPct}%` }} />
        </div>
        <div className="hero-legend">
          <small><i className="hdot hdot--spent" /> Spent</small>
          <small><i className="hdot hdot--reserved" /> Budgeted</small>
          <small><i className="hdot hdot--free" /> Unbudgeted</small>
        </div>
      </section>

      <div className="kpis">
        <div className={`kpi${unallocated < 0 ? " kpi--negative" : ""}`}>
          <span className="eyebrow">
            {unallocated < 0 ? "Over-budgeted" : "Left to budget"}
          </span>
          <strong>{formatCurrency(Math.abs(unallocated))}</strong>
          <small>
            {unallocated < 0
              ? "Budgets and spending exceed your income"
              : "Not in a budget or already spent"}
          </small>
        </div>
        <div className="kpi">
          <span className="eyebrow">Total budgeted</span>
          <strong>{formatCurrency(budgeted)}</strong>
          <small>
            Across {budgets.length} {budgets.length === 1 ? "budget" : "budgets"}
          </small>
        </div>
        <div className="kpi">
          <span className="eyebrow">Transactions</span>
          <strong>{incomes.length + expenses.length}</strong>
          <small>
            {incomes.length} income · {expenses.length} expenses
          </small>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
