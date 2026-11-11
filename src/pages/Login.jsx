import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from "react-router-dom";
import { toast } from "react-toastify";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { AuthLayout, Field, PasswordInput } from "../components/AuthLayout";
import { getUsers, signIn } from "../session";
import { redirectIfSignedIn } from "../auth";

export function loginLoader() {
  redirectIfSignedIn();
  // nobody has an account yet? go straight to sign up
  if (getUsers().length === 0) throw redirect("/signup");
  return null;
}

export async function loginAction({ request }) {
  const data = Object.fromEntries(await request.formData());
  try {
    const user = await signIn({
      email: data.email,
      password: data.password,
      remember: data.remember === "on",
    });
    toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
    return redirect("/");
  } catch (e) {
    return { error: e.message, email: data.email };
  }
}

const Login = () => {
  const result = useActionData();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see where your money stands."
      footer={
        <>
          New to HomeBudget? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <Form method="post" className="auth-form">
        {result?.error && (
          <div className="auth-alert" role="alert">
            {result.error}
          </div>
        )}

        <Field label="Email" id="email" icon={EnvelopeIcon}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={result?.email ?? ""}
            required
            autoFocus
          />
        </Field>

        <Field label="Password" id="password" icon={LockClosedIcon}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
          />
        </Field>

        <label className="checkbox">
          <input type="checkbox" name="remember" defaultChecked />
          <span>Keep me signed in</span>
        </label>

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? (
            <span className="spinner" aria-label="Signing in" />
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRightIcon width={18} />
            </>
          )}
        </button>
      </Form>
    </AuthLayout>
  );
};

export default Login;
