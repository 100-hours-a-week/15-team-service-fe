/**
 * SSE Client using EventSource API
 * Handles Server-Sent Events with HttpOnly cookie authentication
 */
export class SSEClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.eventSource = null;
    this.eventListeners = new Map(); // event name -> callback
    this.onOpen = options.onOpen;
    this.onError = options.onError;
    this.closeOnError = options.closeOnError ?? false;
    this.isConnected = false;
  }

  connect() {
    this.eventSource = new EventSource(this.url, { withCredentials: true });

    this.eventSource.onopen = () => {
      this.isConnected = true;
      this.onOpen?.();
    };

    this.eventSource.onerror = (error) => {
      this.isConnected = false;
      if (this.closeOnError) {
        this.close();
      }
      this.onError?.(error);
    };

    // Register all pre-configured event listeners
    this.eventListeners.forEach((callback, eventName) => {
      this.eventSource.addEventListener(eventName, callback);
    });
  }

  addEventListener(eventName, callback) {
    const wrappedCallback = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch {
        // ignore parse errors
      }
    };

    this.eventListeners.set(eventName, wrappedCallback);

    if (this.eventSource) {
      this.eventSource.addEventListener(eventName, wrappedCallback);
    }
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }
}
