// ========================================
// Centralized Type Definitions (JSDoc)
// ========================================

// Interview Types
// ========================================

/**
 * @typedef {'personality' | 'technical'} InterviewType
 */

/**
 * @typedef {'면접관' | '유저' | 'AI'} Speaker
 */

/**
 * @typedef {Object} ScriptEntry
 * @property {string} timestamp
 * @property {Speaker} speaker
 * @property {string} content
 */

/**
 * @typedef {Object} EvaluationData
 * @property {string} summary
 * @property {string[]} strengths
 * @property {string[]} improvements
 * @property {string[]} nextActions
 */

/**
 * @typedef {Object} Interview
 * @property {string} id
 * @property {string} name
 * @property {string} date
 * @property {InterviewType} type
 * @property {string} position
 * @property {string} company
 * @property {number} [duration]
 * @property {ScriptEntry[]} [script]
 * @property {EvaluationData} [evaluation]
 */

// Resume Types
// ========================================

/**
 * @typedef {Object} Resume
 * @property {string} id
 * @property {string} name
 * @property {string} createdAt
 * @property {string} position
 * @property {string} company
 * @property {string} [yamlContent]
 */

// Repository Types
// ========================================

/**
 * @typedef {Object} Repository
 * @property {number} id
 * @property {string} name
 * @property {string} owner
 * @property {boolean} isPrivate
 * @property {string} updatedAt - ISO 8601 format
 */

/**
 * @typedef {'recent' | 'name'} RepoSortOption
 */

// Chatbot Types
// ========================================

/**
 * @typedef {Object} ChatMessage
 * @property {'user' | 'assistant'} role
 * @property {string} content
 * @property {string} timestamp
 */

// UI Component Types
// ========================================

/**
 * @typedef {Object} MenuItem
 * @property {string} label
 * @property {(e: React.MouseEvent) => void} onClick
 * @property {'default' | 'danger'} [variant]
 */

// User Profile Types
// ========================================

/**
 * @typedef {Object} UserProfile
 * @property {string} name
 * @property {string} position
 * @property {string} phone
 * @property {string | null} [profileImage]
 */

// Export empty object to make this a module
export {};
