import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./app/providers/AppProviders";
import "bootstrap/dist/css/bootstrap.min.css";
import "./core/theme/theme.css";
import "./styles.css";
import { installGlobalTelemetry } from "./core/telemetry/clientTelemetry";
import { installGlobalErrorTelemetry } from "./core/telemetry/telemetry";

installGlobalTelemetry();
installGlobalErrorTelemetry();

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("Unable to find the root application element.");
}

createRoot(rootElement).render(
    <StrictMode>
        <AppProviders />
    </StrictMode>,
);
