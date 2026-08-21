import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./app/providers/AppProviders";
import "./core/theme/theme.css";
import { installGlobalTelemetry } from "./core/telemetry/clientTelemetry";
installGlobalTelemetry();

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("Unable to find the root application element.");
}

createRoot(rootElement).render(
    <StrictMode>
        <AppProviders />
    </StrictMode>,
);
