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

    const handleApiSuccess = (event: Event) => {
      const detail = (event as CustomEvent<ApiErrorEventDetail>).detail;
      notify({
        kind: "success",
        title: "Success",
        message: detail?.message ?? "Operation completed successfully.",
        duration: 4200,
      });
    };

    window.addEventListener("smartschool:api-error", handleApiError);
    window.addEventListener("smartschool:api-success", handleApiSuccess);

    return () => {
      window.removeEventListener("smartschool:api-error", handleApiError);
      window.removeEventListener("smartschool:api-success", handleApiSuccess);
    };
  }, [notify]);

  return null;
}
