import { getData } from './dataStore';
import { channels, dm, notification, userStat } from './returnTypes';
import crypto from 'crypto';
import HTTPError from 'http-errors';

interface user {
  userStats: userStat;
  uId: number,
  permissionId: number,
  nameFirst: string,
  nameLast: string,
  email: string,
  password: string,
  handleStr: string,
  tokens: string[],
  profileImgUrl: string,
  resetCode?: string,
  notifications: notification[]
}

/**
 * Given a channelId, check if it is valid.
 * @param channelId - identifier for a particular channel
 * @returns {boolean} - if channelId is valid return true, else return false.
 */
export function verifyChannelId(channelId: number): boolean {
  if (!(getData().channels.some(channel => channel.channelId === channelId))) {
    return false;
  }
  return true;
}

/**
 * Given a token, hash it and check if it is valid
 * @param givenToken - identifier for a particular user
 * @returns {undefined} - if token does not belong to any user
 * @returns {Object} - if token belongs to a user
 */
export function findByToken(givenToken: string): user | undefined {
  const hashedToken = crypto.createHash('sha256').update(givenToken + getData().secret).digest('hex');
  for (const user of getData().users) {
    for (const token of user.tokens) {
      if (token === hashedToken) {
        return user;
      }
    }
  }
  return undefined;
}

/**
 * Given a messageId, check if it is present in any channels
 * @param messageId - identifier for a particular mesage
 * @returns {undefined} - if messageId is not present in any channels
 * @returns {Object} - if messageId is present in a particular channel
 */
export function checkMessageIdChannels(messageId: number): undefined | channels {
  for (const channel of getData().channels) {
    for (const message of channel.messages) {
      if (message.messageId === messageId) {
        return channel;
      }
    }
  }
  return undefined;
}

/**
 * Given a messageId, check if it is present in any DMs
 * @param messageId - identifier for a particular message
 * @returns {undefined} - if messageId is not in any DMs
 * @returns {Object} - if messageId is present in a particular DM
 */
export function checkMessageIdDMs(messageId: number): undefined | dm {
  for (const dm of getData().dms) {
    for (const message of dm.messages) {
      if (message.messageId === messageId) {
        return dm;
      }
    }
  }
  return undefined;
}

/**
 * Calculate total number of messages send by a user
 * @param {string} userId - unique identifer for user
 * @returns {number} - no. of messages send by user
 */
export function numMessagesUser(userId: number) {
  let num = 0;
  // no. of messages in channels
  for (const channel of getData().channels) {
    for (const message of channel.messages) {
      if (message.uId === userId) {
        num++;
      }
    }
  }
  // no. of messages in dms
  for (const dm of getData().dms) {
    for (const message of dm.messages) {
      if (message.uId === userId) {
        num++;
      }
    }
  }
  return num;
}

/**
 * Calculate total number of messages
 * @returns {number} total number of messages
 */
export function totalMessages() {
  let total = 0;
  for (const channel of getData().channels) {
    total = total + channel.messages.length;
  }

  for (const dm of getData().dms) {
    total = total + dm.messages.length;
  }
  return total;
}

/**
 * Compute the involvement rate
 * @param {Object} user - details related to a user
 * @returns {number} - involvement rate
 */
export function calculateInvolvementRate(user: user) {
  const channelsJoined = user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined;
  const dmsJoined = user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1].numDmsJoined;
  const messagesSent = numMessagesUser(user.uId);
  if ((getData().channels.length + getData().dms.length + totalMessages()) === 0) {
    return 0;
  }
  let rate = (channelsJoined + dmsJoined + messagesSent) / (getData().channels.length + getData().dms.length + totalMessages());
  if (rate > 1) {
    rate = 1;
  }
  return rate;
}

/**
 * Count no. of users who have joined at least 1 channel or Dm
 * @returns {number} - no. of users that have joined at least 1 channel/Dm
 */
export function userInDmChannel(): number {
  const uId: number[] = [];
  for (const channel of getData().channels) {
    for (const userId of channel.allMembers) {
      if (!(uId.includes(userId))) {
        uId.push(userId);
      }
    }
  }
  for (const dm of getData().dms) {
    if (!(uId.includes(dm.owner)) && dm.owner !== undefined) {
      uId.push(dm.owner);
    }
    for (const userId of dm.uIds) {
      if (!(uId.includes(userId))) {
        uId.push(userId);
      }
    }
  }
  return uId.length;
}

/**
 * Compute the utilization rate
 * @returns {number} - utilization rate
 */
export function calculateUtilizationRate() {
  return userInDmChannel() / getData().users.length;
}

export const findMessage = (messageId: number) => {
  const channel = checkMessageIdChannels(messageId);
  const dm = checkMessageIdDMs(messageId);
  if (dm !== undefined) {
    return dm.messages.find((m) => m.messageId === messageId);
  }
  if (channel !== undefined) {
    return channel.messages.find((m) => m.messageId === messageId);
  }
  throw HTTPError(400, 'message does not exist');
};
