import { messageSend, messageShare } from './returnTypes';
import { verifyChannelId, findByToken, findMessage, checkMessageIdChannels, checkMessageIdDMs, calculateInvolvementRate } from './implementationHelpers';
import { save, getData } from './dataStore';
import HTTPError from 'http-errors';
import { messageSendDMV1 } from './messagesendDM';

/**
 * Send a message from the authorised user to the channel specified by channelId
 * @param token - a unique string identifier for user
 * @param channelId - identifier for channel
 * @param message - text that users send
 * @returns {Object} - object containing messageId if message is send succesfully
 * @throws HTTPError - upon error
 */
export function messageSendV1(token: string, channelId: number, message: string): messageSend {
  if (verifyChannelId(channelId) === false) {
    throw HTTPError(400, 'Invalid channelId');
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
  const userHandle = user.handleStr;

  const givenChannel = getData().channels.find(channel => channel.channelId === channelId);

  if (givenChannel.allMembers.find(uId => uId === userId) === undefined) {
    throw HTTPError(403, 'Valid channelId but authorised user is not a member of the channel');
  }

  // every newly generated id is the largest
  const messageId = getData().maxId + 1;
  getData().maxId = messageId;

  givenChannel.messages.push(
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
    const channelName = givenChannel.nameChannel;
    for (const handle of Array.from(handles)) {
      const user2 = getData().users.find(user => user.handleStr === handle);
      if (user2 !== undefined && givenChannel.allMembers.find(userId => userId === user2.uId) !== undefined) {
        user2.notifications.push(
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: userHandle + ' tagged you in ' + channelName + ': ' + message.slice(0, 20),
          }
        );
      }
    }
  }

  // update userStats
  user.userStats.messagesSent.push(
    {
      numMessagesSent: user.userStats.messagesSent[user.userStats.messagesSent.length - 1].numMessagesSent + 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );
  user.userStats.involvementRate = calculateInvolvementRate(user);

  // updata workspaceStats
  getData().workspaceStats.messagesExist.push(
    {
      numMessagesExist: getData().workspaceStats.messagesExist[getData().workspaceStats.messagesExist.length - 1].numMessagesExist + 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );

  save();
  return { messageId: messageId };
}

export function messageShareV1(token: string, ogMessageId: number, message: string, channelId: number, dmId: number): messageShare {
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'invalid token');
  }
  // check if both channelId and dmId are valid
  // condition 1: both are invalid
  if (channelId !== -1 && dmId !== -1) {
    throw HTTPError(400, 'invalid channelId and dmId');
  }

  // condition 3: ogMessageId does not refer to valid message in channel/dm that authUser has joined
  const channel = checkMessageIdChannels(ogMessageId);
  const dm = checkMessageIdDMs(ogMessageId);
  const userId = user.uId;

  if (channel === undefined && dm === undefined) {
    throw HTTPError(400, 'channel and dm does not exist');
  }

  // condition 4: length of optional message is more than 1000 characters
  if (message.length > 1000) {
    throw HTTPError(400, 'invalid message length');
  }

  // condition 5: channelId or dmId are valid, but authUser has not joined
  if (channel !== undefined && channel.allMembers.find(uId => uId === userId) === undefined) {
    throw HTTPError(403, 'valid channelId or dmId, but no authUser has joined');
  }
  if (dm !== undefined && dm.uIds.find(uId => uId === userId) === undefined) {
    throw HTTPError(403, 'valid channelId or dmId, but no authUser has joined');
  }

  // sharing message
  const newMessage = findMessage(ogMessageId).message + message;
  if (channelId === -1) {
    const messageId = messageSendDMV1(token, dmId, newMessage).messageId;
    return { sharedMessageId: messageId };
  } else if (dmId === -1) {
    const messageId = messageSendV1(token, channelId, newMessage).messageId;
    return { sharedMessageId: messageId };
  }
}
