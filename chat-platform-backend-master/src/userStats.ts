import { findByToken } from './implementationHelpers';
import { UserStats } from './returnTypes';
import HTTPError from 'http-errors';

/**
 * Fetches the required statsitics about this users use
 * of UNSW Memes
 * @param {string} token - unique identifier for user
 * @returns {Object} - userStats containing channelsJoined, dmsJoined, messagesSent, involvementRate
 * @throws HTTP Error - invalid token
 */
export function userStats(token: string): UserStats {
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token');
  }
  return { userStats: user.userStats };
}
