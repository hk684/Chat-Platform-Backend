import { messagePin, messageUnpin, messageSend, channelsCreate, clear, authRegister, channelJoin, channelMessages, dmCreate, messageSendDm } from './testHelpers';

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

describe('messagePin given error cases', () => {
  test('messageid not real', () => {
    expect(messagePin(userToken, messageId + 1)).toStrictEqual(400);
  });
  test('user token not real', () => {
    expect(messagePin(userToken + 'a', messageId)).toStrictEqual(403);
  });
  test('user does not have permission to pin messages in this channel', () => {
    const userToken2 = authRegister('email2@email.com', 'weqrwgfedf', 'jasper', 'mars').token;
    channelJoin(userToken2, channelId);
    expect(messagePin(userToken2, messageId)).toStrictEqual(403);
  });
  test('user does not have permission to pin messages in this dm', () => {
    const user2 = authRegister('email2@email.com', 'weqrwgfedf', 'jasper', 'mars');
    const dmId = dmCreate(userToken, [user2.authUserId]).dmId;
    const messageId2 = messageSendDm(user2.token, dmId, 'bbuh').messageId;
    expect(messagePin(user2.token, messageId2)).toStrictEqual(403);
  });
  test('message is already pinned', () => {
    messagePin(userToken, messageId);
    expect(messagePin(userToken, messageId)).toStrictEqual(400);
  });
});

describe('messagePin success cases', () => {
  test('message is pinned in channel', () => {
    messagePin(userToken, messageId);
    expect(channelMessages(userToken, channelId, 0)).toStrictEqual({
      messages: [{
        messageId: messageId,
        uId: userId,
        message: 'bbuh',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: true
      }],
      start: 0,
      end: -1
    });
  });
});

describe('message unpin given error cases', () => {
  test('messageid not real', () => {
    expect(messageUnpin(userToken, messageId + 1)).toStrictEqual(400);
  });
  test('user token not real', () => {
    messagePin(userToken, messageId);
    expect(messageUnpin(userToken + 'a', messageId)).toStrictEqual(403);
  });
  test('user does not have permission to pin messages in this channel', () => {
    messagePin(userToken, messageId);
    const userToken2 = authRegister('email2@email.com', 'weqrwgfedf', 'jasper', 'mars').token;
    channelJoin(userToken2, channelId);
    expect(messageUnpin(userToken2, messageId)).toStrictEqual(403);
  });
  test('user does not have permission to unpin messages in this dm', () => {
    const user2 = authRegister('email2@email.com', 'weqrwgfedf', 'jasper', 'mars');
    const dmId = dmCreate(userToken, [user2.authUserId]).dmId;
    const messageId2 = messageSendDm(user2.token, dmId, 'bbuh').messageId;
    messagePin(userToken, messageId2);
    expect(messageUnpin(user2.token, messageId2)).toStrictEqual(403);
  });
  test('message is not pinned', () => {
    expect(messageUnpin(userToken, messageId)).toStrictEqual(400);
  });
});

describe('message unpin success cases', () => {
  test('message is pinned in channel', () => {
    messagePin(userToken, messageId);
    messageUnpin(userToken, messageId);
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
