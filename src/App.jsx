import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Main, { mainLoader } from "./layouts/Main";
import { deleteAccountAction, logoutAction } from "./actions/logout";
import Login, { loginAction, loginLoader } from "./pages/Login";
import Signup, { signupAction, signupLoader } from "./pages/Signup";
import { deleteBudget } from "./actions/deleteBudget";
import Dashboard, { dashboardLoader } from "./pages/Dashboard";
import Error from "./pages/Error";
import { useTheme } from "./theme";
import BudgetPage, { budgetAction, budgetLoader } from "./pages/BudgetPage";
import IncomePage, { incomeAction, incomeLoader } from "./pages/IncomePage";
import BudgetsPage, { budgetsAction, budgetsLoader } from "./pages/BudgetsPage";
import LoansPage, { loansAction, loansLoader } from "./pages/LoansPage";
import ExpensesPage, {
  expensesAction,
  expensesLoader,
} from "./pages/ExpensesPage";


const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
    loader: loginLoader,
    action: loginAction,
    errorElement: <Error />,
  },
  {
    path: "/signup",
    element: <Signup />,
    loader: signupLoader,
    action: signupAction,
    errorElement: <Error />,
  },
  {
    path: "/",
    element: <Main />,
    loader: mainLoader,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Dashboard />,
        loader: dashboardLoader,
        errorElement: <Error />,
      },
      {
        path: "budgets",
        element: <BudgetsPage />,
        loader: budgetsLoader,
        action: budgetsAction,
        errorElement: <Error />,
      },
      {
        path: "budget/:id",
        element: <BudgetPage />,
        loader: budgetLoader,
        action: budgetAction,
        errorElement: <Error />,
        children: [
          {
            path: "delete",
            action: deleteBudget,
          },
        ],
      },
      {
        path: "expenses",
        element: <ExpensesPage />,
        loader: expensesLoader,
        action: expensesAction,
        errorElement: <Error />,
      },
      {
        path: "loans",
        element: <LoansPage />,
        loader: loansLoader,
        action: loansAction,
        errorElement: <Error />,
      },
      {
        path: "income",
        element: <IncomePage />,
        loader: incomeLoader,
        action: incomeAction,
        errorElement: <Error />,
      },
      {
        path: "logout",
        action: logoutAction,
      },
      {
        path: "delete-account",
        action: deleteAccountAction,
      },
    ],
  },
]);

function App() {
  const { resolved } = useTheme();
  return (
    <div className="App">
      <RouterProvider router={router} />
      <ToastContainer position="bottom-right" theme={resolved} />
    </div>
  );
}

export default App;
