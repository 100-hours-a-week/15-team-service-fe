import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import { STORAGE_KEYS } from '@/app/constants';

/**
 * Middleware to sync Redux user state to localStorage
 * Automatically saves user profile whenever user actions are dispatched
 *
 * Implementation decisions:
 * - Runs AFTER reducer (after state update is complete)
 * - Only triggers on user/ actions (avoids unnecessary localStorage writes)
 * - Silent failure on localStorage errors (degradation, not blocking)
 */
const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // Save to localStorage on any user action
  if (action.type.startsWith('user/')) {
    try {
      const state = store.getState();
      localStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(state.user)
      );
    } catch (error) {
      console.error('Failed to save user profile to localStorage:', error);
    }
  }

  return result;
};

/**
 * Redux store configuration
 * - User reducer: manages global user profile state
 * - localStorage middleware: auto-syncs user state to localStorage
 * - Redux DevTools: automatically enabled by configureStore
 */
export const store = configureStore({
  reducer: {
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(localStorageMiddleware),
});
