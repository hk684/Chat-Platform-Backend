import { getData } from './dataStore';
import { findByToken } from './implementationHelpers';
import { messageId } from './returnTypes';
import HTTPError from 'http-errors';
import { messageSendV1 } from './messageSend';
import { save } from './dataStore';

/**
 * Sends a message from the authorised user to the channel specified by channelId automatically
 * at a specific time in the future. The returned messageId will only be considered valid for
 * other actions once it has been sent.
 * @param {string} token - unique identifier for user
 * @param {number} channelId - unique identifier for channel
 * @param {string} message - message being sent to channel
 * @param {number} timeSent - specific time in the future
 * @throw HTTP error - upon error
 * @return {Object} - return an object containing messageId on success
 */

export function messagesendLater(token: string, channelId: number, message: string, timeSent: number): messageId {
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token');
  }

  const channel = getData().channels.find(channel => channel.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(400, 'ChannelId does not refer to a valid channel');
  } else if (message.length < 1 || message.length > 1000) {
    throw HTTPError(400, 'Invalid message length');
  } else if (timeSent < Math.floor((new Date()).getTime() / 1000)) {
    throw HTTPError(400, 'timeSent is a time in the past');
  } else if (channel !== undefined && channel.allMembers.find(userId => userId === user.uId) === undefined) {
    throw HTTPError(403, 'valid channelId but authorised user is not a memeber of the channel');
  }

  const messageId = getData().maxId + 1;
  const delay = timeSent - Math.floor((new Date()).getTime() / 1000);

  setTimeout((token, channelId, message) => {
    messageSendV1(token, channelId, message);
    save();
  }, delay * 1000, token, channelId, message);

  return { messageId: messageId };
}
