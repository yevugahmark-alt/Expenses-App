import { redirect } from "react-router-dom";
import { getCurrentUser } from "./session";

// App pages need a signed-in user; send everyone else to sign in.
export const requireUser = () => {
  const user = getCurrentUser();
  if (!user) throw redirect("/login");
  return user;
};

// Sign-in/up pages: already signed in? go to the dashboard.
export const redirectIfSignedIn = () => {
  if (getCurrentUser()) throw redirect("/");
  return null;
};
