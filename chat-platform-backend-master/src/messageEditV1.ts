import { messageEdit } from './returnTypes';
import { findByToken } from './implementationHelpers';
import { save, getData } from './dataStore';
import { checkMessageIdChannels, checkMessageIdDMs } from './implementationHelpers';
import HTTPError from 'http-errors';

/**
 * Given a message, update its text with new text, if the new message is an empty string
 * the message is deleted
 * @param token - a unique string identifier for user
 * @param messageId - identifier for message
 * @param message - text that users send
 * @returns {Object} - an empty object if message is edited succesfully
 * @throws HTTPError - upon error.
 */
export function messageEditV1(token: string, messageId: number, message: string): messageEdit {
  // overly long message
  if (message.length > 1000) {
    throw HTTPError(400, 'Message length > 1000');
  }

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
    const msgSenderHandle = getData().users.find(user => user.uId === msgSenderId).handleStr;

    // new message is an empty string, remove the message
    if (message === '') {
      const index = channel.messages.findIndex(message => message.messageId === messageId);
      channel.messages.splice(index, 1);

    // update message
    } else {
      const message1 = channel.messages.find(message => message.messageId === messageId);
      message1.message = message;
      // notification
      const regex = /@(\w+)/g;
      const matches = message.match(regex);
      if (matches !== null) {
        const handles = new Set(matches.map(match => match.substring(1)));
        const channelName = channel.nameChannel;
        for (const handle of Array.from(handles)) {
          const user2 = getData().users.find(user => user.handleStr === handle);
          if (user2 !== undefined && channel.allMembers.find(userId => userId === user2.uId) !== undefined) {
            user2.notifications.push(
              {
                channelId: channel.channelId,
                dmId: -1,
                notificationMessage: msgSenderHandle + ' tagged you in ' + channelName + ': ' + message.slice(0, 20),
              }
            );
          }
        }
      }
    }
  }

  // message is in DM
  if (dm !== undefined) {
    // error case
    if (dm.uIds.find(uId => uId === userId) === undefined && dm.owner !== userId) {
      throw HTTPError(400, 'authorised user is not in the DM');
    }

    msgSenderId = dm.messages.find(message => message.messageId === messageId).uId;
    if (msgSenderId !== userId && dm.owner !== userId) {
      throw HTTPError(403, 'Message was not sent by authorised user making this request and user does not have owner permissions in DM');
    }
    const msgSenderHandle = getData().users.find(user => user.uId === msgSenderId).handleStr;

    // new message is an empty string, remove the message
    if (message === '') {
      const index = dm.messages.findIndex(message => message.messageId === messageId);
      dm.messages.splice(index, 1);

    // update message
    } else {
      const message2 = dm.messages.find(message => message.messageId === messageId);
      message2.message = message;
      const regex = /@(\w+)/g;
      const matches = message.match(regex);
      if (matches !== null) {
        const handles = new Set(matches.map(match => match.substring(1)));
        const dmName = dm.dmName;
        for (const handle of Array.from(handles)) {
          const user2 = getData().users.find(user => user.handleStr === handle);
          if (user2 !== undefined && (dm.uIds.find(userId => userId === user2.uId) !== undefined || dm.owner === user2.uId)) {
            user2.notifications.push(
              {
                channelId: -1,
                dmId: dm.dmId,
                notificationMessage: msgSenderHandle + ' tagged you in ' + dmName + ': ' + message.slice(0, 20),
              }
            );
          }
        }
      }
    }
  }
  save();
  return {};
}
