import { useState } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router-dom";
import { toast } from "react-toastify";
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

import { AuthLayout, Field, PasswordInput } from "../components/AuthLayout";
import {
  getUsers,
  hasLegacyData,
  passwordStrength,
  signUp,
  validateSignUp,
} from "../session";
import { redirectIfSignedIn } from "../auth";

export function signupLoader() {
  redirectIfSignedIn();
  return { hasUsers: getUsers().length > 0, legacy: hasLegacyData() };
}

export async function signupAction({ request }) {
  const data = Object.fromEntries(await request.formData());
  const { errors, cleanName, cleanEmail } = validateSignUp(data);

  if (Object.keys(errors).length > 0) {
    return { errors, values: { name: data.name, email: data.email } };
  }

  try {
    const user = await signUp({
      name: cleanName,
      email: cleanEmail,
      password: data.password,
    });
    toast.success(`Welcome, ${user.name.split(" ")[0]}! Your account is ready.`);
    return redirect("/");
  } catch (e) {
    return { errors: { form: e.message }, values: data };
  }
}

const StrengthMeter = ({ password }) => {
  if (!password) return null;
  const { score, label } = passwordStrength(password);
  return (
    <div className={`strength strength--${score}`} aria-live="polite">
      <div className="strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < Math.max(score, 1) ? "on" : ""} />
        ))}
      </div>
      <small>{label}</small>
    </div>
  );
};

const Signup = () => {
  const { hasUsers, legacy } = useLoaderData();
  const result = useActionData();
  const errors = result?.errors ?? {};
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const [password, setPassword] = useState("");

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking income, budgets and spending in minutes."
      footer={
        hasUsers && (
          <>
            Already have an account? <Link to="/login">Sign in</Link>
          </>
        )
      }
    >
      <Form method="post" className="auth-form">
        {legacy && (
          <div className="auth-note">
            We found budgets saved on this device. They’ll be moved into your
            new account.
          </div>
        )}
        {errors.form && (
          <div className="auth-alert" role="alert">
            {errors.form}
          </div>
        )}

        <Field label="Full name" id="name" icon={UserIcon} error={errors.name}>
          <input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Ama Mensah"
            defaultValue={result?.values?.name ?? ""}
            maxLength={40}
            aria-invalid={Boolean(errors.name)}
            required
            autoFocus
          />
        </Field>

        <Field label="Email" id="email" icon={EnvelopeIcon} error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={result?.values?.email ?? ""}
            aria-invalid={Boolean(errors.email)}
            required
          />
        </Field>

        <Field
          label="Password"
          id="password"
          icon={LockClosedIcon}
          error={errors.password}
          hint="At least 8 characters, with a letter and a number."
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            minLength={8}
            aria-invalid={Boolean(errors.password)}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <StrengthMeter password={password} />

        <Field
          label="Confirm password"
          id="confirm"
          icon={LockClosedIcon}
          error={errors.confirm}
        >
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            placeholder="Type it again"
            aria-invalid={Boolean(errors.confirm)}
            required
          />
        </Field>

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? (
            <span className="spinner" aria-label="Creating account" />
          ) : (
            <>
              <span>Create account</span>
              <ArrowRightIcon width={18} />
            </>
          )}
        </button>
        <small className="auth-fine">
          Accounts are stored only in this browser. If you clear your browser
          data, your account is removed too.
        </small>
      </Form>
    </AuthLayout>
  );
};

export default Signup;
