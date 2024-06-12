import { getData, save } from './dataStore';
import { findByToken, verifyChannelId, calculateInvolvementRate } from './implementationHelpers';
import { channelDetail, channelJoin, channelMessage, channelInvite, channelProfile } from './returnTypes';
import HTTPError from 'http-errors';

/**
 * Invite a user to join a channel with channelId. Once invited, the user is added to
 * the channel immediately. In both public and private channels, all members are able
 * to invite users.
 *
 * @param {Number} authUserId - user id of the user inviting to channel
 * @param {Number} channelId - channel that user is being invited into
 * @param {Number} uId - user id of the user being invited
 * @returns {Object} returns empty object if no error is encountered
 */

function channelInviteV1(authUserId: number, channelId: number, uId: number): channelInvite {
  const data = getData();
  const user = data.users.find(user => user.uId === uId);
  if (user === undefined) {
    throw HTTPError(400, 'user does not exist');
  }
  const channel = data.channels.find(c => c.channelId === channelId);
  if (channel !== undefined) {
    if (channel.allMembers.some((element) => element === uId)) {
      throw HTTPError(400, 'user is already in channel');
    }
    if (channel.allMembers.some((element) => element === authUserId)) {
      channel.allMembers.push(user.uId);
      // notification
      const owner = data.users.find(user => user.uId === authUserId);
      user.notifications.push({
        channelId: channelId,
        dmId: -1,
        notificationMessage: owner.handleStr + ' added you to ' + channel.nameChannel,
      });
      save();
    } else {
      throw HTTPError(403, 'authUser is not in channel! ');
    }
    user.userStats.channelsJoined.push(
      {
        numChannelsJoined: user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined + 1,
        timeStamp: Math.floor((new Date()).getTime() / 1000),
      }
    );
    user.userStats.involvementRate = calculateInvolvementRate(user);
    return {};
  } else {
    throw HTTPError(400, 'channel does not exist');
  }
}

/**
 * calls channelInviteV1 with the same functionality but checks if a provided token is valid
 *
 * @param {string} token token of a session that the user performing the action is currently logged in to
 * @param {number} channelId id of the channel that user is being invited to
 * @param {number} uId user id of the user being invited
 * @returns {object} empty object if no error
 */
export function channelInviteV2(token: string, channelId: number, uId: number): channelInvite {
  if (findByToken(token) !== undefined) {
    return channelInviteV1(findByToken(token).uId, channelId, uId);
  } else {
    throw HTTPError(403, 'invalid token');
  }
}

/**
 * given a channel and a starting index, returns up to 50 messages in a channel starting from the given starting index
 *
 * @param {String} authUserId - user id of the user viewing the messages
 * @param {String} channelId - channel that the messages are in
 * @param {String} start - the index of the first message to be viewed, starting from 0
 * @returns {Object} - object containing key messages, start and end.
 * messages is an array of maximum 50 messages in the channel, starting from start and ending at end.
 * start is the start passed into the function
 * end is start+50 if start+50 is smaller than the amount of messages in channel or -1 if this is not the case
 */
function channelMessagesV1(authUserId: number, channelId: number, start: number): channelMessage {
  const end = start + 50;
  let messages = [];
  const inputChannel = getData().channels.find(c => c.channelId === channelId);
  if (inputChannel === undefined) {
    throw HTTPError(400, 'channel does not exist!');
  }
  const user = inputChannel.allMembers.find(u => u === authUserId);
  if (typeof (user) !== 'number') {
    throw HTTPError(403, 'user is not in channel');
  }
  if (start > inputChannel.messages.length) {
    throw HTTPError(400, 'start index out of range');
  }
  const channelMessages = [...inputChannel.messages];
  for (const message of channelMessages) {
    for (const react of message.reacts) {
      if (react.uIds.some((uId) => uId === authUserId)) {
        react.isThisUserReacted = true;
      }
    }
  }
  channelMessages.reverse();
  if (end > channelMessages.length) {
    return {
      messages: channelMessages,
      start: start,
      end: -1
    };
  }
  messages = channelMessages.slice(start, end);
  return {
    messages,
    start,
    end
  };
}

/**
 * calls channelMessagesV1 with an extra validating token step
 * @param {string} token token of a session that the user performing the action is currently logged in to
 * @param {number} channelId id of the channel that the messages are read from
 * @param {number} start the start of where the messages are read from
 * @returns {channelMessage} array of messages comtaining messageid, timesent, message contents and sender
 */
export function channelMessagesV2(token: string, channelId: number, start: number): channelMessage {
  const user = findByToken(token);
  if (user !== undefined) {
    return channelMessagesV1(user.uId, channelId, start);
  } else {
    throw HTTPError(403, 'invalid token');
  }
}

/**
 * Given a channel with ID (channelId) that the authorised user is a
 * member of, provides basic details about the channel.
 *
 * @param {integer} authUserId - user ID generated by authRegisterV1()
 * @param {integer} channelId  - channel ID generated by channelsCreateV1()
 * @returns {Object} - returns an object containing info regarding name, isPublic, ownerMembers and allMembers if no error is encountered.
 */
function channelDetailsV1(authUserId: number, channelId: number): channelDetail {
  // invalid channelId
  if (!verifyChannelId(channelId)) {
    throw HTTPError(400, 'invalid channel id');
  }

  // valid channelId but authorised user is not a member of channel.
  let valid = false;
  for (const channel of getData().channels) {
    if (channel.channelId === channelId) {
      for (const member of channel.allMembers) {
        if (member === authUserId) {
          valid = true;
        }
      }
    }
  }
  if (valid === false) {
    throw HTTPError(403, 'user is not in channel');
  }

  // invalid authUserId
  // if (!verifyUserId(authUserId)) {
  //   throw HTTPError(400, 'invalid user id' };
  // }

  // extract info
  let name = '';
  let isPublic = false;
  const ownerMembers: channelProfile[] = [];
  const allMembers: channelProfile[] = [];
  for (const channel of getData().channels) {
    if (channel.channelId === channelId) {
      for (const uId of channel.ownerMembers) {
        const user = getData().users.find(user => uId === user.uId);
        ownerMembers.push({
          uId: user.uId,
          email: user.email,
          nameFirst: user.nameFirst,
          nameLast: user.nameLast,
          handleStr: user.handleStr
        });
      }
      for (const uId of channel.allMembers) {
        const user = getData().users.find(user => uId === user.uId);
        allMembers.push({
          uId: user.uId,
          email: user.email,
          nameFirst: user.nameFirst,
          nameLast: user.nameLast,
          handleStr: user.handleStr
        });
      }
      name = channel.nameChannel;
      isPublic = channel.isPublic;
      break;
    }
  }
  return {
    name: name,
    isPublic: isPublic,
    ownerMembers: ownerMembers,
    allMembers: allMembers,
  };
}

/**
 * calls channeldetails v1 with an extra token verification step
 *
 * @param {string} token token of the session that a user is currently logged into
 * @param {number} channelId id of the channel the user is trying to view
 * @returns {channelDetail} details about the channel
 */
export function channelDetailsV2(token: string, channelId: number): channelDetail {
  if (findByToken(token) !== undefined) {
    return channelDetailsV1(findByToken(token).uId, channelId);
  } else {
    throw HTTPError(403, 'invalid token');
  }
}

/**
 * Given a channelId of a channel that the authorised user can join,
 * adds them to that channel.
 *
 * @param {Number} authUserId - user id of user joining the channel
 * @param {Number} channelId - channel id that user is joining
 * @returns {Object} empty object if no error occurs
 */
function channelJoinV1(authUserId: number, channelId: number): channelJoin {
  let channelExists = false;
  const user = getData().users.find(user => user.uId === authUserId);
  for (const channel of getData().channels) {
    if (channel.channelId === channelId) {
      if (channel.allMembers.some((element) => element === authUserId)) {
        throw HTTPError(400, 'user is already in channel');
      }
      if (!channel.isPublic && user.permissionId === 2) {
        throw HTTPError(403, 'you do not have permission to do this');
      }
      channel.allMembers.push(user.uId);
      save();
      channelExists = true;
    }
  }
  if (!channelExists) {
    throw HTTPError(400, 'channel does not exist');
  } else {
    user.userStats.channelsJoined.push(
      {
        numChannelsJoined: user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined + 1,
        timeStamp: Math.floor((new Date()).getTime() / 1000),
      }
    );
    user.userStats.involvementRate = calculateInvolvementRate(user);
    return {};
  }
}

/**
 * calls channelJoinV1 with an extra token verification step
 *
 * @param {string} token token of the session that a user is currently logged into
 * @param channelId id of the channel user is joining
 * @returns {channelJoin} empty object on success
 */
export function channelJoinV2(token: string, channelId: number): channelJoin {
  if (findByToken(token) !== undefined) {
    return channelJoinV1(findByToken(token).uId, channelId);
  } else {
    throw HTTPError(403, 'token does not exist');
  }
}

/**
 * adds a user to the list of owners of the channel.
 *
 * @param token token of the session that a user is currently logged into. must already have owner permissions in the channel
 * @param channelId id of the channel the user will be added as an owner to
 * @param uId id of the user being added as an owner
 * @returns {object} empty object on success
 */
export function channelAddOwnerV1(token: string, channelId: number, uId: number): { error?: string } {
  if (!verifyChannelId(channelId)) {
    throw HTTPError(400, 'channel id is not valid');
  }
  if (findByToken(token) !== undefined) {
    const user = findByToken(token);
    if (!getData().channels[channelId - 1].allMembers.some((element) => element === uId)) {
      throw HTTPError(400, 'user is not in channel!');
    }
    if (!getData().channels[channelId - 1].ownerMembers.some((element) => element === user.uId) && user.permissionId === 2) {
      throw HTTPError(403, 'user does not have permission to perform this task');
    }
    if (getData().channels[channelId - 1].ownerMembers.some((element) => element === uId)) {
      throw HTTPError(400, 'user is already an owner in this channel');
    }
    getData().channels[channelId - 1].ownerMembers.push(uId);
    save();
  } else {
    throw HTTPError(403, 'invalid token');
  }
  return {};
}

/**
 * removes a user in a channel from the ownermemebers of the channel
 *
 * @param token token of the session that a user is currently logged into. must have owner permissions in channel
 * @param channelId id of the channel the user is in
 * @param uId id of the user that is being removed from owners
 * @returns {object} empty object on success
 */
export function channelRemoveOwnerV1(token: string, channelId: number, uId: number): { error?: string } {
  if (!verifyChannelId(channelId)) {
    throw HTTPError(400, 'channel id is not valid');
  }
  if (findByToken(token) !== undefined) {
    const user = findByToken(token);
    const channel = getData().channels.find((element) => element.channelId === channelId);
    if (!channel.ownerMembers.some((element) => element === uId)) {
      throw HTTPError(400, 'user is not an owner in the channel');
    }
    if (!channel.ownerMembers.some((element) => element === user.uId) && user.permissionId === 2) {
      throw HTTPError(403, 'user does not have permission to perform this task');
    }
    if (channel.ownerMembers.length <= 1) {
      throw HTTPError(400, 'a channel must have at least 1 owner');
    }
    channel.ownerMembers = removeUser(channel.ownerMembers, uId);
    save();
  } else {
    throw HTTPError(403, 'invalid token');
  }
  return {};
}

/**
 * removes the user calling the funciton from a channel
 *
 * @param token token of the session that a user is currently logged into
 * @param channelId id of the channel the user is removed from
 * @returns {object} empty object on success
 */
export function channelLeaveV1(token: string, channelId: number): { error?: string } {
  if (!verifyChannelId(channelId)) {
    throw HTTPError(400, 'channel id is not valid');
  }
  const user = findByToken(token);
  if (user !== undefined) {
    const channel = getData().channels.find((element) => element.channelId === channelId);
    const userId = findByToken(token).uId;
    if (!channel.allMembers.some((element) => element === userId)) {
      throw HTTPError(403, 'user not in channel!');
    }
    if (channel.ownerMembers.some((element) => element === userId)) {
      channel.ownerMembers = removeUser(channel.ownerMembers, userId);
    }
    channel.allMembers = removeUser(channel.allMembers, userId);
    save();
  } else {
    throw HTTPError(403, 'token is invalid');
  }
  user.userStats.channelsJoined.push(
    {
      numChannelsJoined: user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined - 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );
  user.userStats.involvementRate = calculateInvolvementRate(user);
  return {};
}

function removeUser(array: number[], uId: number): number[] {
  const index = array.indexOf(uId);
  if (index === 0) {
    array = [];
  }
  array.splice(index, 1);
  return array;
}
