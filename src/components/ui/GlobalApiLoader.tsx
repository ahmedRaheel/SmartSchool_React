import { useEffect, useState } from "react";

/**
 * Non-blocking network activity indicator. API traffic must never cover or
 * unmount the current workspace; failures are reported separately as toasts.
 */
export function GlobalApiLoader() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleBusy = (event: Event) => {
      setActive((event as CustomEvent<boolean>).detail);
    };

    window.addEventListener("smartschool:api-busy", handleBusy);
    return () => window.removeEventListener("smartschool:api-busy", handleBusy);
  }, []);

  return active ? (
    <div className="global-api-loader" role="status" aria-live="polite" aria-label="Loading">
      <span />
    </div>
  ) : null;
}
