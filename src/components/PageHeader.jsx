const PageHeader = ({ eyebrow, title, subtitle, actions, back }) => (
  <header className="page-head">
    <div className="page-head-text">
      {back}
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-sub">{subtitle}</p>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>
);

export default PageHeader;
