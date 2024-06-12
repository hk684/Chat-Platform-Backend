import { messageReact, messageUnreact, messageSend, channelsCreate, clear, authRegister, channelMessages, dmMessages, dmCreate, messageSendDm, channelJoin } from './testHelpers';

let messageId: number;
let userToken: string;
let channelId: number;
let userId: number;
beforeEach(() => {
  clear();
  const user = authRegister('email@email.com', 'weqrwgfedf', 'cassandra', 'mars');
  userToken = user.token;
  userId = user.authUserId;
  channelId = channelsCreate(userToken, 'channel1', true).channelId;
  messageId = messageSend(userToken, channelId, 'bbuh').messageId;
});

describe('message react given error cases', () => {
  test('messageid is not real', () => {
    expect(messageReact(userToken, messageId + 1, 1)).toStrictEqual(400);
  });
  test('user token is not real', () => {
    expect(messageReact(userToken + 'a', messageId, 1)).toStrictEqual(403);
  });
  test('user is not in channel', () => {
    const userToken2 = authRegister('email2@email.com', 'weqrwgfedf', 'cassandra', 'mars').token;
    expect(messageReact(userToken2, messageId, 1)).toStrictEqual(400);
  });
  test('user is not in dm', () => {
    const userToken2 = authRegister('email2@email.com', 'weqrwgfedf', 'cassandra', 'mars').token;
    const dmId = dmCreate(userToken, []).dmId;
    const messageId2 = messageSendDm(userToken, dmId, 'bbuh').messageId;
    expect(messageReact(userToken2, messageId2, 1)).toStrictEqual(400);
  });
  test('user is not in dm', () => {
    const user2 = authRegister('email2@email.com', 'weqrwgfedf', 'cassandra', 'mars');
    const userToken3 = authRegister('email3@email.com', 'weqrwgfedf', 'cassandra', 'mars').token;
    const dmId = dmCreate(userToken, [user2.authUserId]).dmId;
    const messageId2 = messageSendDm(userToken, dmId, 'bbuh').messageId;
    expect(messageReact(userToken3, messageId2, 1)).toStrictEqual(400);
  });
  test('react id is not valid', () => {
    expect(messageReact(userToken, messageId, -1)).toStrictEqual(400);
  });
  test('user has already reacted with the same reaction before', () => {
    messageReact(userToken, messageId, 1);
    expect(messageReact(userToken, messageId, 1)).toStrictEqual(400);
  });
});

describe('message react success case', () => {
  test('message has reaction in channel', () => {
    messageReact(userToken, messageId, 1);
    expect(channelMessages(userToken, channelId, 0)).toStrictEqual({
      messages: [{
        messageId: messageId,
        uId: userId,
        message: 'bbuh',
        timeSent: expect.any(Number),
        reacts: [{
          isThisUserReacted: true,
          reactId: 1,
          uIds: [userId],
        }],
        isPinned: false
      }],
      start: 0,
      end: -1
    });
  });
  test('message has reaction in dm', () => {
    const dmId = dmCreate(userToken, []).dmId;
    const messageId2 = messageSendDm(userToken, dmId, 'bbuh').messageId;
    messageReact(userToken, messageId2, 1);
    expect(dmMessages(userToken, dmId, 0)).toStrictEqual({
      messages: [{
        messageId: messageId2,
        uId: userId,
        message: 'bbuh',
        timeSent: expect.any(Number),
        reacts: [{
          isThisUserReacted: true,
          reactId: 1,
          uIds: [userId],
        }],
        isPinned: false
      }],
      start: 0,
      end: -1
    });
  });
  test('one message react by two different users', () => {
    const user2 = authRegister('email2@email.com', 'weqrwgfedf', 'cassandra', 'mars');
    messageReact(userToken, messageId, 1);
    channelJoin(user2.token, channelId);
    messageReact(user2.token, messageId, 1);
    expect(channelMessages(userToken, channelId, 0)).toStrictEqual({
      messages: [{
        messageId: messageId,
        uId: userId,
        message: 'bbuh',
        timeSent: expect.any(Number),
        reacts: [{
          isThisUserReacted: true,
          reactId: 1,
          uIds: [userId, user2.authUserId],
        }],
        isPinned: false
      }],
      start: 0,
      end: -1
    });
  });
});

describe('message unreact given error cases', () => {
  test('messageid is not real', () => {
    expect(messageUnreact(userToken, messageId + 1, 1)).toStrictEqual(400);
  });
  test('user token is not real', () => {
    messageReact(userToken, messageId, 1);
    expect(messageUnreact(userToken + 'a', messageId, 1)).toStrictEqual(403);
  });
  test('user is not in channel', () => {
    const userToken2 = authRegister('email2@email.com', 'weqrwgfedf', 'cassandra', 'mars').token;
    expect(messageUnreact(userToken2, messageId, 1)).toStrictEqual(400);
  });
  test('user is not in dm', () => {
    const user2 = authRegister('email2@email.com', 'weqrwgfedf', 'cassandra', 'mars');
    const userToken3 = authRegister('email3@email.com', 'weqrwgfedf', 'cassandra', 'mars').token;
    const dmId = dmCreate(userToken, [user2.authUserId]).dmId;
    const messageId2 = messageSendDm(userToken, dmId, 'bbuh').messageId;
    expect(messageUnreact(userToken3, messageId2, 1)).toStrictEqual(400);
  });
  test('react id is not valid', () => {
    messageReact(userToken, messageId, 1);
    expect(messageUnreact(userToken, messageId, -1)).toStrictEqual(400);
  });
  test('message does not have reaction from user', () => {
    expect(messageUnreact(userToken, messageId, 1)).toStrictEqual(400);
  });
  test('message does not have reaction from seperate user', () => {
    const userToken2 = authRegister('email2@email.com', 'weqrwgfedf', 'cassandra', 'mars').token;
    channelJoin(userToken2, channelId);
    messageReact(userToken, messageId, 1);
    expect(messageUnreact(userToken2, messageId, 1)).toStrictEqual(400);
  });
});

describe('message unreact success case', () => {
  test('message react is removed in channel', () => {
    messageReact(userToken, messageId, 1);
    messageUnreact(userToken, messageId, 1);
    expect(channelMessages(userToken, channelId, 0)).toStrictEqual({
      messages: [{
        messageId: messageId,
        uId: userId,
        message: 'bbuh',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false
      }],
      start: 0,
      end: -1
    });
  });
});
