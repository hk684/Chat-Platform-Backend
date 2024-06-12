import { save } from './dataStore';
import { findByToken, checkMessageIdChannels, checkMessageIdDMs, findMessage } from './implementationHelpers';
import HTTPError from 'http-errors';

/**
 * finds a message that messageid refers to and then marks it as pinned
 * @param token token of user pinning the message. must have owner permissions in channel
 * @param messageId id of the message that is being pinned
 * @returns empty object on success
 */
export const messagePin = (token: string, messageId: number) => {
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'invalid token');
  }
  const channel = checkMessageIdChannels(messageId);
  const dm = checkMessageIdDMs(messageId);
  // if user is not owner of the dm
  if (dm !== undefined && dm.owner !== user.uId) {
    throw HTTPError(403, 'you do not have permission to pin messages in this channel');
  }
  // if user does not have owner permissions in channel
  if (channel !== undefined && user.permissionId === 2 && !channel.ownerMembers.some((u) => user.uId === u)) {
    throw HTTPError(403, 'you do not have permission to pin messages in this channel');
  }
  if (!findMessage(messageId).isPinned) {
    findMessage(messageId).isPinned = true;
  } else {
    throw HTTPError(400, 'message is already pinned');
  }
  save();
  return {};
};

/**
 * finds a pinned message and marks it as unpinned
 * @param token token of user unpinning the message. must have owner permissions in channel
 * @param messageId id of the message that is being unpinned
 * @returns empty object on success
 */
export const messageUnpin = (token: string, messageId: number) => {
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'invalid token');
  }
  const channel = checkMessageIdChannels(messageId);
  const dm = checkMessageIdDMs(messageId);
  // if user is not owner of the dm
  if (dm !== undefined && dm.owner !== user.uId) {
    throw HTTPError(403, 'you do not have permission to unpin messages in this channel');
  }
  // if user does not have owner permissions in channel
  if (channel !== undefined && user.permissionId === 2 && !channel.ownerMembers.some((u) => user.uId === u)) {
    throw HTTPError(403, 'you do not have permission to unpin messages in this channel');
  }
  if (findMessage(messageId).isPinned) {
    findMessage(messageId).isPinned = false;
  } else {
    throw HTTPError(400, 'message is not currently pinned');
  }
  save();
  return {};
};
