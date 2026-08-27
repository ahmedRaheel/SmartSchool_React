import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? error.statusText : error instanceof Error ? error.message : "An unexpected error occurred.";
  return <main className="route-error"><section><span className="route-error-icon"><AlertTriangle/></span><span className="eyebrow">SmartSchool</span><h1>We couldn’t open this workspace</h1><p>{message}</p><div><button className="button primary" onClick={() => window.location.reload()}><RefreshCw size={16}/>Try again</button><button className="button secondary" onClick={() => window.location.assign("/")}><Home size={16}/>Dashboard</button></div></section></main>;
}
