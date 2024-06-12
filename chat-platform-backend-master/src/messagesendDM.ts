import { messageSend } from './returnTypes';
import { findByToken, calculateInvolvementRate } from './implementationHelpers';
import { save, getData } from './dataStore';
import HTTPError from 'http-errors';

/**
 * Send a message from the authorised user to the DM specified by dmId
 * @param token - a unique string identifier for user
 * @param dmlId - identifier for DM
 * @param message - text that users send
 * @returns {Object} - object containing messageId if message is sent succesfully
 * @throws HTTPError - upon error
 */

export function messageSendDMV1(token: string, dmId: number, message: string): messageSend {
  if (getData().dms.find(dm => dm.dmId === dmId) === undefined) {
    throw HTTPError(400, 'Invalid dmId');
  } else if (message.length < 1) {
    throw HTTPError(400, 'Message length < 1');
  } else if (message.length > 1000) {
    throw HTTPError(400, 'Message length > 1000');
  }

  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token');
  }
  const userId = user.uId;

  // extract the dm with dmId
  const givenDm = getData().dms.find(dm => dm.dmId === dmId);

  // check if user belongs to the dm
  if (givenDm.uIds.find(uId => uId === userId) === undefined && givenDm.owner !== userId) {
    throw HTTPError(403, 'Valid channelId but authorised user is not a member of the dm');
  }

  // every newly generated id is the largest
  const messageId = getData().maxId + 1;
  getData().maxId = messageId;

  // push the message onto the dm (specified by dmId)
  givenDm.messages.push(
    {
      messageId: messageId,
      message: message,
      uId: userId,
      timeSent: Math.floor((new Date()).getTime() / 1000),
      reacts: [],
      isPinned: false
    }
  );

  // check for tagging
  const regex = /@(\w+)/g;
  const matches = message.match(regex);
  if (matches !== null) {
    const handles = new Set(matches.map(match => match.substring(1)));
    const dmName = givenDm.dmName;
    const userHandle = user.handleStr;

    for (const handle of Array.from(handles)) {
      const user2 = getData().users.find(user => user.handleStr === handle);
      if (user2 !== undefined && (givenDm.uIds.find(userId => userId === user2.uId) !== undefined || givenDm.owner === user2.uId)) {
        user2.notifications.push(
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: userHandle + ' tagged you in ' + dmName + ': ' + message.slice(0, 20),
          }
        );
      }
    }
  }

  // userStat
  user.userStats.messagesSent.push(
    {
      numMessagesSent: user.userStats.messagesSent[user.userStats.messagesSent.length - 1].numMessagesSent + 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );
  user.userStats.involvementRate = calculateInvolvementRate(user);

  // workspace stats
  getData().workspaceStats.messagesExist.push(
    {
      numMessagesExist: getData().workspaceStats.messagesExist[getData().workspaceStats.messagesExist.length - 1].numMessagesExist + 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );

  save();
  return { messageId: messageId };
}
