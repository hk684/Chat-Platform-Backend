import { save, getData } from './dataStore';
import { findByToken } from './implementationHelpers';
import { messageRemove } from './returnTypes';
import { checkMessageIdChannels, checkMessageIdDMs } from './implementationHelpers';
import HTTPError from 'http-errors';

/**
 * Given a messageId for a message, this message is removed from the channel/DM
 * @param token - a unique string identifier for user
 * @param messageId - identifier for message
 * @throws HTTP error - upon errors
 * @returns {Object} - an empty object if no error is encountered
 */
export function messageRemoveV1(token: string, messageId: number): messageRemove {
  // Invalid token
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token');
  }

  const userId = user.uId;
  const permissionId = user.permissionId;
  const channel = checkMessageIdChannels(messageId);
  const dm = checkMessageIdDMs(messageId);

  // valid messageId?
  if (channel === undefined && dm === undefined) {
    throw HTTPError(400, 'MessageId does not exist');
  }

  let msgSenderId = 0;

  // message is in channel
  if (channel !== undefined) {
    // error case
    if (channel.allMembers.find(uId => uId === userId) === undefined) {
      throw HTTPError(400, 'authorised user is not in the channel');
    }

    msgSenderId = channel.messages.find(message => message.messageId === messageId).uId;
    if (msgSenderId !== userId && permissionId !== 1 && channel.ownerMembers.find(uId => uId === userId) === undefined) {
      throw HTTPError(403, 'Message was not sent by authorised user making request and the user does not have owner permissions in channel');
    }

    // remove the message
    const index = channel.messages.findIndex(message => message.messageId === messageId);
    channel.messages.splice(index, 1);
  }

  // message is in DM
  if (dm !== undefined) {
    // error case
    if (dm.uIds.find(uId => uId === userId) === undefined && dm.owner !== userId) {
      throw HTTPError(400, 'authorised user is not in the DM');
    }

    msgSenderId = dm.messages.find(message => message.messageId === messageId).uId;
    if (msgSenderId !== userId && dm.owner !== userId) {
      throw HTTPError(403, 'Message was not sent by authorised user making request and the user does not have owner permissions in DM');
    }

    // remove the message
    const index = dm.messages.findIndex(message => message.messageId === messageId);
    dm.messages.splice(index, 1);
  }

  // workspace stats
  getData().workspaceStats.messagesExist.push(
    {
      numMessagesExist: getData().workspaceStats.messagesExist[getData().workspaceStats.messagesExist.length - 1].numMessagesExist - 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );

  save();
  return {};
}
