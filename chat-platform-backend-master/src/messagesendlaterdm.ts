import { getData } from './dataStore';
import { findByToken } from './implementationHelpers';
import { messageId } from './returnTypes';
import HTTPError from 'http-errors';
import { save } from './dataStore';
import { messageSendDMV1 } from './messagesendDM';

/**
 * Sends a message from the authorised user to the DM specified by dmId automatically
 * at a specific time in the future. The returned messageId will only be considered valid for
 * other actions once it has been sent.
 * @param {string} token - unique identifier for user
 * @param {number} dmId - unique identifier for dm
 * @param {string} message - message being sent to channel
 * @param {number} timeSent - specific time in the future
 * @throw HTTP error - upon error
 * @return {Object} - return an object containing messageId on success
 */

export function messagesendLaterDM(token: string, dmId: number, message: string, timeSent: number): messageId {
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token');
  }

  const dm = getData().dms.find(dm => dm.dmId === dmId);
  if (dm === undefined) {
    throw HTTPError(400, 'dmId does not refer to a valid dm');
  } else if (message.length < 1 || message.length > 1000) {
    throw HTTPError(400, 'Invalid message length');
  } else if (timeSent < Math.floor((new Date()).getTime() / 1000)) {
    throw HTTPError(400, 'timeSent is a time in the past');
  } else if (dm !== undefined && !(dm.uIds.find(userId => userId === user.uId) !== undefined || dm.owner === user.uId)) {
    throw HTTPError(403, 'valid dmId but authorised user is not a memeber of the dm');
  }

  const messageId = getData().maxId + 1;
  const delay = timeSent - Math.floor((new Date()).getTime() / 1000);

  setTimeout((token, dmId, message) => {
    try {
      messageSendDMV1(token, dmId, message);
      save();
    } catch (err) {
    }
  }, delay * 1000, token, dmId, message);

  return { messageId: messageId };
}
