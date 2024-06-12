import { getData } from './dataStore';
import { findByToken } from './implementationHelpers';
import { usersAll, channelProfile } from './returnTypes';
import HTTPError from 'http-errors';

/**
 * Return a list of all users and their associated details
 * @param {string} token - unqiue string identifier for user
 * @returns {Object} - returns an error object if token is invalid
 * @returns {Object} - returns an object containing users if no error is encountered
 */
export function usersAllV2(token: string): usersAll {
  if (findByToken(token) === undefined) {
    throw HTTPError(403, 'invalid token');
  }
  const users: channelProfile[] = [];
  for (const user of getData().users) {
    users.push(
      {
        uId: user.uId,
        email: user.email,
        nameFirst: user.nameFirst,
        nameLast: user.nameLast,
        handleStr: user.handleStr,
      }
    );
  }
  return { users: users };
}
