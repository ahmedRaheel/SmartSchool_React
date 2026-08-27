import { useEffect } from "react";
import { useUi } from "./InteractiveUi";

interface ApiErrorEventDetail {
  message?: string;
}

export function GlobalApiFeedback() {
  const { notify } = useUi();

  useEffect(() => {
    const handleApiError = (event: Event) => {
      const detail = (event as CustomEvent<ApiErrorEventDetail>).detail;

      notify({
        kind: "error",
        title: "Request failed",
        message: detail?.message ?? "The request could not be completed.",
        duration: 6500,
      });
    };

    window.addEventListener("smartschool:api-error", handleApiError);

    return () => {
      window.removeEventListener("smartschool:api-error", handleApiError);
    };
  }, [notify]);

  return null;
}
