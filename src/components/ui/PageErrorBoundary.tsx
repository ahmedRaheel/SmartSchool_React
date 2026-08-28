import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class PageErrorBoundary extends Component<Props, State> {
  public state: State = { error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("SmartSchool page render failed", error, info);
  }

  private retry = (): void => {
    this.setState({ error: null });
  };

  public render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <section className="page-error-panel" role="alert">
        <AlertTriangle size={28} />
        <div>
          <h2>This page could not be displayed</h2>
          <p>
            The SmartSchool workspace is still available. Retry this page; your
            session and application shell have been preserved.
          </p>
          <button className="button secondary" type="button" onClick={this.retry}>
            <RefreshCw size={16} />
            Retry page
          </button>
        </div>
      </section>
    );
  }
}
