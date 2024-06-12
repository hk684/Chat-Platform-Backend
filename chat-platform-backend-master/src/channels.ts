import { getData } from './dataStore';
import { channelId, channelList } from './returnTypes';
import { findByToken, calculateInvolvementRate } from './implementationHelpers';
import { save } from './dataStore';
import HTTPError from 'http-errors';

/**
 * List all channels including private channels (and their associative details)
 * @param {string} token - a unique string identifier for user
 * @throws HTTP error - upon error
 * @returns {Object} - returns an object containing an array of 'channelId and (channel) name' if no error is encountered.
 */
export function channelsListAllV1(token: string): channelList {
  // Error checking
  if (findByToken(token) === undefined) {
    throw HTTPError(403, 'Invalid token!');
  }

  // Collect all channels
  const channels: {channelId: number, name: string}[] = [];
  for (const channel of getData().channels) {
    channels.push({
      channelId: channel.channelId,
      name: channel.nameChannel,
    });
  }
  save();
  return { channels: channels };
}

/**
 * List all channels (and their associative details) that the authorised user is part of
 * @param {string} token - a unique string identifier for user
 * @throws HTTP error - upon error
 * @returns {Object} - returns an object containing an array of 'channelId and (channel) name' if no error is encountered.
 */
export function channelsListV1(token: string): channelList {
  // Error checking
  if (findByToken(token) === undefined) {
    throw HTTPError(403, 'Invalid token!');
  }

  // collect channels that the authorised user is a part of.
  const channels: {channelId: number, name: string}[] = [];
  const authUserId = findByToken(token).uId;
  for (const channel of getData().channels) {
    if (channel.allMembers.some(member => member === authUserId)) {
      channels.push({
        channelId: channel.channelId,
        name: channel.nameChannel,
      });
    }
  }
  save();
  return { channels: channels };
}

/**
 * Creates a new channel and populate the corresponding info in dataStore
 * @param {string} token - a unique string identifier for user
 * @param {string} name - name of the channel to be created
 * @param {boolean} isPublic - determine if the channel is public or private
 * @throws HTTP error - upon error
 * @returns {Object} - returns an object containing channelId if no error is encountered.
 */
export function channelsCreateV1(token: string, name: string, isPublic: boolean): channelId {
  // error checkings
  const user = findByToken(token);
  if (name.length < 1 || name.length > 20) {
    throw HTTPError(400, 'Invalid name length!');
  } else if (user === undefined) {
    throw HTTPError(403, 'Invalid token!');
  }
  // push channel details to dataStore
  const channelId = 1 + getData().channels.length;
  const authUserId = user.uId;
  getData().channels.push({
    nameChannel: name,
    isPublic: isPublic,
    channelId: channelId,
    messages: [],
    ownerMembers: [
      authUserId
    ],
    allMembers: [
      authUserId
    ],
    standupActive: false,
    standupFinish: null,
    standupStr: '',
  });

  // userStats
  user.userStats.channelsJoined.push(
    {
      numChannelsJoined: user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined + 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );
  user.userStats.involvementRate = calculateInvolvementRate(user);

  // workspaceStats
  getData().workspaceStats.channelsExist.push(
    {
      numChannelsExist: getData().workspaceStats.channelsExist[getData().workspaceStats.channelsExist.length - 1].numChannelsExist + 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );
  save();
  return {
    channelId: channelId,
  };
}
