// Character avatars for users
export const AVATAR_CHARACTERS = [
  '👨', '👩', '🧑', '👨‍🎓', '👩‍🎓', '👨‍💼', '👩‍💼',
  '🦸', '🦸‍♂️', '🦸‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️',
  '🧚', '🧚‍♂️', '🧚‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️',
  '🧜', '🧜‍♂️', '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️',
  '👻', '🤖', '👽', '🎭', '🥷', '🕵️', '🕵️‍♂️', '🕵️‍♀️',
  '👮', '👮‍♂️', '👮‍♀️', '👷', '👷‍♂️', '👷‍♀️',
  '🤴', '👸', '🤵', '👰', '🎅', '🤶', '🦸', '🦹'
];

/**
 * Get avatar character for a user based on their ID
 * This ensures consistent character per user
 */
export function getUserAvatar(userId: number): string {
  return AVATAR_CHARACTERS[userId % AVATAR_CHARACTERS.length];
}

/**
 * Get gradient color for avatar background based on user ID
 */
export function getUserAvatarGradient(userId: number): string {
  const gradients = [
    'from-blue-400 to-purple-500',
    'from-purple-400 to-pink-500',
    'from-pink-400 to-rose-500',
    'from-rose-400 to-orange-500',
    'from-orange-400 to-yellow-500',
    'from-yellow-400 to-green-500',
    'from-green-400 to-teal-500',
    'from-teal-400 to-cyan-500',
    'from-cyan-400 to-blue-500',
    'from-indigo-400 to-blue-500',
    'from-violet-400 to-purple-500',
    'from-fuchsia-400 to-pink-500',
  ];
  return gradients[userId % gradients.length];
}

