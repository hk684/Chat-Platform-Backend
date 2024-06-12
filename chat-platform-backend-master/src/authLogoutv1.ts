import { authLogout } from './returnTypes';
import { findByToken } from './implementationHelpers';
import HTTPError from 'http-errors';
import { save } from './dataStore';

/**
 * Given an active token, invalidates the token to log the user out
 * @param {string} token - a unique string identifier for a user
 * @returns {Object} - returns an error object if token is invalid
 * @returns {Object} - returns an empty bracket if no error is encountered
 */
export function authLogoutV2(token: string): authLogout {
  const user = findByToken(token);
  // Invalid token
  if (user === undefined) {
    throw HTTPError(403, 'invalid token');
  }
  // remove the token
  const index = user.tokens.indexOf(token);
  user.tokens.splice(index, 1);
  save();
  return {};
}
