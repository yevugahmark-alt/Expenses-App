import { Outlet, useLoaderData } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { requireUser } from "../auth";

export function mainLoader() {
  const user = requireUser();
  return { user };
}

const Main = () => {
  const { user } = useLoaderData();

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar user={user} />
      <main className="app-main" id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
};
export default Main;
