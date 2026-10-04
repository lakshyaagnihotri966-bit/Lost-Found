import { Component } from 'react';

// Stops one broken page from turning the whole site white.
export default class ErrorBoundary extends Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(e) { console.error(e); }
  render() {
    if (this.state.err) {
      return (
        <div className="wrap page narrow center">
          <h1>Oops, something broke</h1>
          <p className="muted">This page ran into a problem. Your data is safe.</p>
          <button className="btn" onClick={() => window.location.reload()}>Reload page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
