import { getData, save, user, message } from './dataStore';

import { dmCreate, dms, dmDetails, error, dmUser, channelMessage, channelProfile } from './returnTypes';
import HTTPError from 'http-errors';

import { findByToken, calculateInvolvementRate } from './implementationHelpers';

/**
  * Creates a dm with members containing the owner and any user in uIds
  *
  * @param {string} token - token of authorised user
  * @param {number[]} uIds - array of uIds of which the authorised user is adding to a dm
  * ...
  *
  * @throws HTTPError - upon error
  * @returns {dmId} - when dm is successfully created
*/
export function dmCreateV2(token: string, uIds: number[]): dmCreate {
  const data = getData();

  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token');
  }
  for (const uId of uIds) {
    const validuId = data.users.find(u => u.uId === uId);
    if (validuId === undefined) {
      throw HTTPError(400, 'Invalid uId(s)');
    }
  }

  const duplicates = Array.from(new Set(uIds));
  if (uIds.length !== duplicates.length) {
    throw HTTPError(400, 'Duplicate uId(s)');
  }
  const dmId = data.lastDmId + 1;
  data.lastDmId = dmId;

  const dmName = generateDmName(user, uIds);

  const newDm = {
    dmId,
    dmName,
    owner: user.uId,
    uIds,
    messages: [] as message[],
  };
  data.dms.push(newDm);

  // notification
  const userHandle = user.handleStr;
  for (const uId of uIds) {
    const user1 = getData().users.find(user => user.uId === uId);
    user1.notifications.push({
      channelId: -1,
      dmId: dmId,
      notificationMessage: userHandle + ' added you to ' + dmName,
    });
  }

  // userStats
  user.userStats.dmsJoined.push(
    {
      numDmsJoined: user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1].numDmsJoined + 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );
  user.userStats.involvementRate = calculateInvolvementRate(user);

  // workspace Stats
  getData().workspaceStats.dmsExist.push(
    {
      numDmsExist: getData().workspaceStats.dmsExist[getData().workspaceStats.dmsExist.length - 1].numDmsExist + 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );

  save();
  return { dmId: dmId };
}

// Helper function for dmCreate to create and return a dmName from handleStr of users in alphabetical order
function generateDmName(user: user, uIds: number[]): string {
  const data = getData();
  const uIdArray = uIds.slice();
  uIdArray.push(user.uId);
  const handleStrArr: string[] = [];
  for (const Id of uIdArray) {
    for (const user of data.users) {
      if (Id === user.uId) {
        handleStrArr.push(user.handleStr);
      }
    }
  }
  handleStrArr.sort();
  const dmName = handleStrArr.join(', ');
  return dmName;
}

/**
  * Returns the list of DMs that the authorised user is a member of
  *
  * @param {string} token - token of authorised user
  * ...
  *
  * @returns {dms} - upon successful listing of DMs
  * @returns {error} - upon error
*/
export function dmListV2(token: string): dms | error {
  const data = getData();

  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token');
  }
  const dmArray: dmUser[] = [];
  for (const dm of data.dms) {
    if (user.uId === dm.owner || dm.uIds.includes(user.uId)) {
      dmArray.push({
        dmId: dm.dmId,
        name: dm.dmName,
      });
    }
  }
  save();
  return { dms: dmArray };
}

/**
  * Returns the list of DMs that the authorised user is a member of
  *
  * @param {string} token - token of authorised user
  * @param {number} dmId - dmId of the dm that is trying to be removed
  * ...
  *
  * @returns {object} - returns empty object on success
  * @throws HTTPError - upon error
*/
export function dmRemoveV2(token: string, dmId: number): error | object {
  const data = getData();

  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token');
  }

  const dm = data.dms.find(d => d.dmId === dmId);
  if (dm === undefined) {
    throw HTTPError(400, 'invalid dmId');
  }

  if (dm.owner !== user.uId) {
    throw HTTPError(403, 'authoriseed user is not original dm creator');
  }

  const msg = dm.messages.length;

  data.dms = data.dms.filter((dm) => dm.dmId !== dmId);

  // user stats
  user.userStats.dmsJoined.push(
    {
      numDmsJoined: user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1].numDmsJoined - 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );
  user.userStats.involvementRate = calculateInvolvementRate(user);

  // workspace stats
  getData().workspaceStats.dmsExist.push(
    {
      numDmsExist: getData().workspaceStats.dmsExist[getData().workspaceStats.dmsExist.length - 1].numDmsExist - 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );
  getData().workspaceStats.messagesExist.push(
    {
      numMessagesExist: getData().workspaceStats.messagesExist[getData().workspaceStats.messagesExist.length - 1].numMessagesExist - msg,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );
  save();

  return {};
}

/**
  * Returns the list of DMs that the authorised user is a member of
  *
  * @param {string} token - token of authorised user
  * @param {number} dmId - dmId of DM which the details were requested for
  * ...
  *
  * @returns {dmDetails} - returns dmDetails if successful
  * @throws HTTPError - upon error
*/
export function dmDetailsV2(token: string, dmId: number): dmDetails {
  const data = getData();

  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token');
  }

  const dm = data.dms.find(d => d.dmId === dmId);
  if (dm === undefined) {
    throw HTTPError(400, 'invalid dmId');
  }

  if (dm.owner !== user.uId && !dm.uIds.includes(user.uId)) {
    throw HTTPError(403, 'authorised user is not member of dm');
  }

  const dmDetails = {
    name: dm.dmName,
    members: [] as channelProfile[],
  };

  for (const id of dm.uIds) {
    for (const user of data.users) {
      if (user.uId === id) {
        dmDetails.members.push({
          uId: user.uId,
          email: user.email,
          nameFirst: user.nameFirst,
          nameLast: user.nameLast,
          handleStr: user.handleStr,
        });
      }
    }
  }

  return dmDetails;
}

/**
  * Returns the list of DMs that the authorised user is a member of
  *
  * @param {string} token - token of authorised user
  * @param {number} dmId - dmId of the DM that the authorised user is trying to leave
  * ...
  *
  * @returns {object} - returns empty object
  * @throws HTTPError - upon error
*/
export function dmLeaveV2(token: string, dmId: number): error | object {
  const data = getData();

  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'Invalid token');
  }

  const dm = data.dms.find(d => d.dmId === dmId);
  if (dm === undefined) {
    throw HTTPError(400, 'invalid dmId');
  }

  if (dm.owner !== user.uId && !dm.uIds.includes(user.uId)) {
    throw HTTPError(403, 'authorised user is not member of dm');
  }

  if (user.uId === dm.owner) {
    dm.owner = dm.uIds[0];
  }
  dm.uIds = dm.uIds.filter(u => u !== user.uId);
  dm.uIds = dm.uIds.filter(u => u !== dm.owner); // removes uId of new owner from uIds array
  user.userStats.dmsJoined.push(
    {
      numDmsJoined: user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1].numDmsJoined - 1,
      timeStamp: Math.floor((new Date()).getTime() / 1000),
    }
  );
  user.userStats.involvementRate = calculateInvolvementRate(user);
  save();
  return {};
}

/**
 * The function displays the messages. Returns up to 50 messages between start and start + 50.
 *
 * @param {string} token  another method to identify the user for the correct session
 * @param {number} dmId a way to identify the dm and verify if it's valid for the user
 * @param {number} start the index that determines the amount of messages shown
 * @returns {objects} error condition if dm is not valid or token is invalid
 * @returns {objects} the messages shown in the dm
 */

export function dmMessagesV2(token: string, dmId: number, start: number): error | channelMessage {
  const data = getData();
  const dm = data.dms.find(d => d.dmId === dmId);

  if (dm === undefined) {
    throw HTTPError(400, 'invalid dmId');
  }

  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'invalid token for user');
  }

  if (dm.owner !== user.uId && !dm.uIds.includes(user.uId)) {
    throw HTTPError(403, 'authorised user is not member of DM');
  }

  if (start > dm.messages.length) {
    throw HTTPError(400, 'start is greater than the total number of messages in the channel');
  }
  const channelMessages = [...dm.messages];
  for (const message of channelMessages) {
    for (const react of message.reacts) {
      if (react.uIds.some((uId) => uId === user.uId)) {
        react.isThisUserReacted = true;
      }
    }
  }
  channelMessages.reverse();
  if (start + 50 > dm.messages.length) {
    const end = -1;
    return { messages: channelMessages.slice(start), start: start, end: end };
  } else {
    const end = start + 50;
    return { messages: channelMessages.slice(start, end), start: start, end: end };
  }
}
