import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { getInsights } from "../insights";

const ICONS = {
  warn: ExclamationTriangleIcon,
  good: CheckCircleIcon,
  tip: LightBulbIcon,
};

const Insights = ({ incomes, budgets, expenses, loans, limit = 4 }) => {
  const insights = useMemo(
    () => getInsights({ incomes, budgets, expenses, loans }),
    [incomes, budgets, expenses, loans]
  );
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? insights : insights.slice(0, limit);

  return (
    <section className="panel insights" aria-labelledby="insights-title">
      <div className="panel-head">
        <div>
          <h2 id="insights-title">Smart insights</h2>
          <small className="muted">Worked out on this device from your data</small>
        </div>
      </div>

      {insights.length === 0 ? (
        <p className="muted insights-empty">
          Nothing needs your attention. Insights appear as you record more income
          and expenses.
        </p>
      ) : (
        <ul className="insight-list">
          {visible.map(({ id, tone, title, text, to, cta }) => {
            const Icon = ICONS[tone];
            return (
              <li key={id} className={`insight insight--${tone}`}>
                <span className="insight-icon">
                  <Icon width={18} />
                </span>
                <div className="insight-body">
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
                {to && (
                  <Link to={to} className="btn btn--ghost btn--sm">
                    {cta}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {insights.length > limit && (
        <button
          type="button"
          className="link-btn"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show fewer" : `Show all ${insights.length}`}
        </button>
      )}
    </section>
  );
};

export default Insights;
