import { messages } from './returnTypes';
import { findByToken } from './implementationHelpers';
import { getData } from './dataStore';
import HTTPError from 'http-errors';

/**
 * Given a query substring, returns a collection of messages in
 * all of the channels/DMs that the user has joined that contain the
 * query (case-insensitive).
 * Assumption (order of messages returned): start with channels (oldest -> newest)
 * followed by dms (oldest -> newest)
 * @param {string} token - unique identifier of a user
 * @param {string} queryStr - the substring we're trying to match in every message
 * @returns {object} - if matching succeeds, return a collection of "messages", if failed, return empty array
 */
export function search(token: string, queryStr: string): messages {
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token!');
  } else if (queryStr.length < 1 || queryStr.length > 1000) {
    throw HTTPError(400, 'Invalid queryString length!');
  }
  const uId = user.uId;
  const messages = [];

  // check channels
  for (const channel of getData().channels) {
    if (channel.allMembers.find(userId => userId === uId) !== undefined) {
      for (const message of channel.messages) {
        if (message.message.toLowerCase().includes(queryStr.toLowerCase())) {
          messages.push(message);
        }
      }
    }
  }

  // check DMs
  for (const dm of getData().dms) {
    if (dm.uIds.find(userId => userId === uId) !== undefined || dm.owner === uId) {
      for (const message of dm.messages) {
        if (message.message.toLowerCase().includes(queryStr.toLowerCase())) {
          messages.push(message);
        }
      }
    }
  }
  return { messages: messages };
}
