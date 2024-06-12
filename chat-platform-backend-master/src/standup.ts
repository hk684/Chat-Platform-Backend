import { findByToken } from './implementationHelpers';
import { getData, save } from './dataStore';
import HTTPError from 'http-errors';
import { standupActive } from './returnTypes';
/**
  * Starts a standup in channel with channelId
  *
  * @param {string} token - token of authorised user
  * @param {number} channelId - channelId of the channel that a standup is trying to be started
  * @param {number} length - duration of standup
  * ...
  *
  * @throws HTTPError - upon error
  * @returns {timeFinish} - when standup successfully starts
*/
export function standupStartV1(token: string, channelId: number, length: number) {
  const data = getData();

  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid Token');
  }

  const channel = data.channels.find(c => c.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(400, 'Invalid channel');
  }

  if (!channel.allMembers.includes(user.uId)) {
    throw HTTPError(403, 'user not in channel');
  }

  if (length < 0) {
    throw HTTPError(400, 'invalid length');
  }

  if (channel.standupActive) {
    throw HTTPError(400, 'standup active');
  }

  const timeFinish = Math.floor((new Date()).getTime() / 1000) + length;

  channel.standupActive = true;
  channel.standupFinish = timeFinish;
  save();

  setTimeout(() => standupEnd(token, channelId), length * 1000);
  return { timeFinish: timeFinish };
}

// Helper function to end standup when standup duration is over
function standupEnd(token: string, channelId: number) {
  const data = getData();
  const channel = data.channels.find(c => c.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(400, 'Invalid channel');
  }
  channel.standupActive = false;
  channel.standupFinish = null;
  if (channel.standupStr) {
    channel.messages.push({
      messageId: getData().maxId + 1,
      message: channel.standupStr.substring(0, channel.standupStr.length - 1),
      uId: findByToken(token).uId,
      timeSent: Math.floor((new Date()).getTime() / 1000),
      reacts: [],
      isPinned: false
    });
    channel.standupStr = '';
  }
  save();
}

/**
  * Checks if a standup is already active in a certain channel
  *
  * @param {string} token - token of authorised user
  * @param {number} channelId - channelId of the channel that a standup is trying to be started
  * ...
  *
  * @throws HTTPError - upon error
  * @returns {standupActive} - when standup successfully starts
*/
export function standupActiveV1(token: string, channelId: number): standupActive {
  const data = getData();

  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid Token');
  }

  const channel = data.channels.find(c => c.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(400, 'Invalid channel');
  }

  if (!channel.allMembers.includes(user.uId)) {
    throw HTTPError(403, 'user not in channel');
  }

  return {
    isActive: channel.standupActive,
    timeFinish: channel.standupFinish
  };
}

/**
  * Appends user's message to the standup's buffered message
  *
  * @param {string} token - token of authorised user
  * @param {number} channelId - channelId of the channel that a standup is trying to be started
  * @param {number} message - message that the user wants to send
  * ...
  *
  * @throws HTTPError - upon error
  * @returns {} - when standup is sent
*/
export function standupSendV1(token: string, channelId: number, message: string) {
  const data = getData();

  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid Token');
  }

  const channel = data.channels.find(c => c.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(400, 'Invalid channel');
  }

  if (!channel.allMembers.includes(user.uId)) {
    throw HTTPError(403, 'user not in channel');
  }

  if (!channel.standupActive) {
    throw HTTPError(400, 'no standup active');
  }

  if (message.length > 1000) {
    throw HTTPError(400, 'max message length 1000 chars');
  }

  channel.standupStr += user.handleStr + ': ' + message + '\n';

  save();
  return {};
}
