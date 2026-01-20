import { createSlice } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '@/app/constants';

/**
 * @typedef {import('@/app/types').UserProfile} UserProfile
 */

/** @type {UserProfile} */
const DEFAULT_USER_PROFILE = {
  name: '유저1',
  position: '백엔드',
  phone: '',
  profileImage: null,
};

/**
 * Load initial state from localStorage
 * @returns {UserProfile}
 */
const loadInitialState = () => {
  try {
    const savedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (savedProfile) {
      return JSON.parse(savedProfile);
    }
  } catch (error) {
    console.error('Failed to parse user profile:', error);
  }
  return DEFAULT_USER_PROFILE;
};

/**
 * Redux slice for user profile state management
 * Manages user profile data (name, position, phone, profileImage)
 */
const userSlice = createSlice({
  name: 'user',
  initialState: loadInitialState(),
  reducers: {
    /**
     * Set entire user profile
     * @param {UserProfile} state
     * @param {{ payload: UserProfile }} action
     */
    setUser: (state, action) => {
      return action.payload;
    },
    /**
     * Update specific fields of user profile
     * @param {UserProfile} state
     * @param {{ payload: Partial<UserProfile> }} action
     */
    updateUser: (state, action) => {
      // Immer makes this safe - looks like mutation but creates new state
      return { ...state, ...action.payload };
    },
    /**
     * Reset user profile to default (logout)
     * @returns {UserProfile}
     */
    clearUser: () => {
      return DEFAULT_USER_PROFILE;
    },
  },
});

export const { setUser, updateUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
