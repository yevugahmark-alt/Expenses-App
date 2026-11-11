import { redirect } from "react-router-dom";
import { toast } from "react-toastify";
import { deleteCurrentAccount, endSession } from "../session";

export async function logoutAction() {
  endSession();
  toast.info("You’ve been signed out.");
  return redirect("/login");
}

export async function deleteAccountAction() {
  deleteCurrentAccount();
  toast.success("Your account and its data were deleted.");
  return redirect("/signup");
}
