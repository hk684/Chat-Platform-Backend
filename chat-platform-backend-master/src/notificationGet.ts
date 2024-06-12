import { notifications } from './returnTypes';
import { findByToken } from './implementationHelpers';
import HTTPError from 'http-errors';

/**
 * Returns the user's most recent 20 notifications, ordered
 * from most recent to least recent.
 * @param {string} token - unique identifier for user
 * @returns {object} - return an array of notifications if token is valid
 */
export function notificationsGet(token: string): notifications {
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token');
  }
  const notification = [...user.notifications].reverse().slice(0, 20);
  return { notifications: notification };
}
