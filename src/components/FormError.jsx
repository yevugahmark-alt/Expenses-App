import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

// Persistent, screen-reader-announced error for a fetcher form.
// Pair with <input type="hidden" name="_inline" value="1" /> so the
// action skips its toast and the message isn't announced twice.
const FormError = ({ fetcher }) => {
  if (fetcher.state !== "idle" || fetcher.data?.ok !== false) return null;
  return (
    <p className="form-error" role="alert">
      <ExclamationCircleIcon width={18} aria-hidden="true" />
      <span>{fetcher.data.error}</span>
    </p>
  );
};

export const INLINE = <input type="hidden" name="_inline" value="1" />;

export default FormError;
