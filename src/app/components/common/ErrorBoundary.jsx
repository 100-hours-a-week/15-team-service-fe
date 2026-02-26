import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            문제가 발생했습니다
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            예기치 않은 오류가 발생했습니다. 홈으로 돌아가 다시 시도해주세요.
          </p>
          <button
            type="button"
            onClick={() => window.location.replace('/')}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
