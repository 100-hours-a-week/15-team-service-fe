import { toast as sonnerToast } from 'sonner';

// A helper function to generate an ID from the message content
const generateIdFromMessage = (message) => {
  // Only generate for static strings to avoid issues with dynamic content
  if (typeof message === 'string' && message.length > 0) {
    return message
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase()
      .slice(0, 50); // Limit length
  }
  return undefined; // Return undefined for non-strings or empty strings
};

export const toast = {
  ...sonnerToast, // Inherit all other methods like success, info, etc.

  // Override the .error method
  error: (message, options) => {
    // If an ID is explicitly provided, use it.
    // Otherwise, generate one from the message content as a fallback.
    const id = options?.id ?? generateIdFromMessage(message);

    // In development, warn if a dynamic message is used without a manual ID
    if (
      import.meta.env.MODE === 'development' &&
      !options?.id &&
      typeof message !== 'string'
    ) {
      console.warn(
        `[Toast] A toast.error was called with dynamic content without providing a unique 'id'. This may cause duplication. Please add a manual id.`,
        message
      );
    }

    sonnerToast.error(message, { ...options, id });
  },
};
