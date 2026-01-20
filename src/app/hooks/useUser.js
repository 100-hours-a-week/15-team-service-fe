import { useSelector, useDispatch } from 'react-redux';
import {
  updateUser as updateUserAction,
  clearUser as clearUserAction,
} from '../store/userSlice';

/**
 * Custom hook for accessing and updating user state
 * Wraps Redux hooks to provide a simple interface similar to Context API
 *
 * Implementation decisions:
 * - Abstracts Redux complexity from components
 * - Provides familiar API surface (user, updateUser, clearUser)
 * - No need for components to import actions or use dispatch directly
 *
 * @returns {{ user: import('@/app/types').UserProfile, updateUser: (updates: Partial<import('@/app/types').UserProfile>) => void, clearUser: () => void }}
 *
 * @example
 * // In a component
 * const { user, updateUser, clearUser } = useUser();
 *
 * // Read user data
 * console.log(user.name);
 *
 * // Update user data
 * updateUser({ name: 'New Name' });
 *
 * // Clear user data (logout)
 * clearUser();
 */
export function useUser() {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const updateUser = (updates) => {
    dispatch(updateUserAction(updates));
  };

  const clearUser = () => {
    dispatch(clearUserAction());
  };

  return { user, updateUser, clearUser };
}
