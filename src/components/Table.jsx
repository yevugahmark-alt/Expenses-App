import ExpenseItem from "./ExpenseItem";

const Table = ({ expenses, showBudget = true }) => {
  const headers = ["Name", "Amount", "Date", ...(showBudget ? ["Budget"] : []), ""];

  return (
    <div className="table">
      <table>
        <thead>
          <tr>
            {headers.map((i, index) => (
              <th key={index}>{i}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <ExpenseItem expense={expense} showBudget={showBudget} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default Table;
