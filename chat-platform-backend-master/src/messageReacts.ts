import { save, getData } from './dataStore';
import { findByToken, checkMessageIdChannels, checkMessageIdDMs, findMessage } from './implementationHelpers';
import HTTPError from 'http-errors';

const validReactIds = [1];

/**
 * adds a react object to a message
 * @param token token of user reacting to the message
 * @param messageId id of the message being reacted to
 * @param reactId id of the react that will be added to the message
 * @returns empty object on success
 */
export const messageReact = (token: string, messageId: number, reactId: number) => {
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'user token invalid');
  }
  const channel = checkMessageIdChannels(messageId);
  const dm = checkMessageIdDMs(messageId);
  if (channel !== undefined && !channel.allMembers.some((uId) => user.uId === uId)) {
    throw HTTPError(400, 'user is not in channel');
  }
  if (dm !== undefined && !dm.uIds.some((uId) => user.uId === uId) && dm.owner !== user.uId) {
    throw HTTPError(400, 'user is not in dm');
  }
  if (!validReactIds.includes(reactId)) {
    throw HTTPError(400, 'react id invalid');
  }
  const message = findMessage(messageId);
  const react = message.reacts.find((r) => r.reactId === reactId);
  if (react === undefined) {
    message.reacts.push({
      reactId: reactId,
      uIds: [user.uId],
      isThisUserReacted: false
    });
  } else if (!react.uIds.some((uId) => user.uId === uId)) {
    react.uIds.push(user.uId);
  } else {
    throw HTTPError(400, 'you have already reacted with this react');
  }
  // user that sent the message
  const user2 = getData().users.find(user => user.uId === message.uId);
  if (channel !== undefined && channel.allMembers.find(uId => uId === user2.uId) !== undefined) {
    user2.notifications.push({
      channelId: channel.channelId,
      dmId: -1,
      notificationMessage: user.handleStr + ' reacted to your message in ' + channel.nameChannel,
    });
  } else if (dm !== undefined && (user2.uId === dm.owner || dm.uIds.find(uId => uId === user2.uId) !== undefined)) {
    user2.notifications.push({
      channelId: -1,
      dmId: dm.dmId,
      notificationMessage: user.handleStr + ' reacted to your message in ' + dm.dmName,
    });
  }
  save();
  return {};
};

/**
 * removes a user from the uids array in a react, or removes the react from the message if there are no uids left
 * @param token token of user being removed from the react
 * @param messageId id of the message having the react removed
 * @param reactId id of the react that will be removed
 * @returns empty object on success
 */
export const messageUnreact = (token: string, messageId: number, reactId: number) => {
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'user token invalid');
  }
  const channel = checkMessageIdChannels(messageId);
  const dm = checkMessageIdDMs(messageId);
  if (channel !== undefined && !channel.allMembers.some((uId) => user.uId === uId)) {
    throw HTTPError(400, 'user is not in channel');
  }
  if (dm !== undefined && !dm.uIds.some((uId) => user.uId === uId) && dm.owner !== user.uId) {
    throw HTTPError(400, 'user is not in dm');
  }
  const message = findMessage(messageId);
  const react = message.reacts.find((r) => r.reactId === reactId);
  if (react === undefined) {
    throw HTTPError(400, 'you have not reacted with this react yet');
  }
  if (react.uIds.some((uId) => user.uId === uId)) {
    const index = react.uIds.indexOf(user.uId);
    if (index === 0) {
      react.uIds = [];
    }
    react.uIds.splice(index, 1);
    if (react.uIds.length === 0) {
      const reactIndex = message.reacts.indexOf(react);
      if (reactIndex === 0) {
        message.reacts = [];
      }
      message.reacts.splice(reactIndex, 1);
    }
    save();
    return {};
  } else {
    throw HTTPError(400, 'you have not reacted with this react yet');
  }
};
