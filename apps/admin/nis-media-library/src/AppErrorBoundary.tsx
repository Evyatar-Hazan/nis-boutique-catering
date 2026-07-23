import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
}

interface State {
  readonly failed: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Media library render failed', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;

    return <main className="error-page" role="alert">
      <section>
        <p className="eyebrow">אפשר להמשיך מכאן</p>
        <h1>המסך נתקל בתקלה</h1>
        <p>התמונה נשמרה בבטחה. רענון קצר יחזיר את הספרייה.</p>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>
          רענון הספרייה
        </button>
      </section>
    </main>;
  }
}
