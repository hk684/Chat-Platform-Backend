import { messageSend, clear, channelsCreate, authRegister, channelMessages, channelInvite, messageShare, dmCreate, dmMessages } from './testHelpers';

beforeEach(() => {
  clear();
});

describe('Testing messageSend Error cases', () => {
  let token = '';
  let channelId = 1;
  beforeEach(() => {
    token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
    channelId = channelsCreate(token, 'channel1', true).channelId;
  });
  test('Invalid channelId', () => {
    expect(messageSend(token, channelId + 1, 'Hi there')).toStrictEqual(400);
  });
  test('Invalid token', () => {
    expect(messageSend(token + '...', channelId, 'Hi there')).toStrictEqual(403);
  });
  test('Length of message is less than 1', () => {
    expect(messageSend(token, channelId, '')).toStrictEqual(400);
  });
  test('Length of message is over 1000 characters', () => {
    expect(messageSend(token, channelId, 'a'.repeat(1002))).toStrictEqual(400);
  });
  test('Valid channelId but authorised user is not a member of the channel', () => {
    const token2 = authRegister('jaz@outlook.com', '1234569', 'Jaz', 'Wang').token;
    expect(messageSend(token2, channelId, 'How are you doing')).toStrictEqual(403);
  });
});

describe('Testing messageSend Correct Return Type', () => {
  let token = '';
  let channelId = 1;
  let userId = 1;
  beforeEach(() => {
    const user = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    token = user.token;
    userId = user.authUserId;
    channelId = channelsCreate(token, 'channel1', true).channelId;
  });
  test('Correct return value', () => {
    expect(messageSend(token, channelId, "Hi, how's it going")).toStrictEqual({ messageId: expect.any(Number) });
  });
  test('Authorised user (that send the message) is the owner of the channel', () => {
    const messageId = messageSend(token, channelId, "Hi, how's it going").messageId;
    expect(channelMessages(token, channelId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: userId,
          message: "Hi, how's it going",
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });
  test('Authorised user (that send the message) is only a member (not owner) of the channel', () => {
    const user2 = authRegister('zd@outlook.com', '1234567', 'Kate', 'Wong');
    const userId2 = user2.authUserId;
    const token2 = user2.token;
    channelInvite(token, channelId, userId2);
    const messageId = messageSend(token2, channelId, "Hi, how's it going").messageId;
    expect(channelMessages(token, channelId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: userId2,
          message: "Hi, how's it going",
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });
  test('Multiple messages sent by owner & member', () => {
    const user2 = authRegister('zd@outlook.com', '1234567', 'Kate', 'Wong');
    const userId2 = user2.authUserId;
    const token2 = user2.token;
    channelInvite(token, channelId, userId2);
    const messageId = messageSend(token2, channelId, "Hi, how's it going").messageId;
    const messageId1 = messageSend(token, channelId, 'Hello how are you').messageId;
    expect(channelMessages(token, channelId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId1,
          uId: userId,
          message: 'Hello how are you',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        },
        {
          messageId: messageId,
          uId: userId2,
          message: "Hi, how's it going",
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });
});

describe('Testing messageShare error cases', () => {
  let token = '';
  let channelId = -1;
  let dmId = -1;
  let ogMessageId : number;

  beforeEach(() => {
    const user = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    token = user.token;
    dmId = dmCreate(token, []).dmId;
    channelId = channelsCreate(token, 'channel1', true).channelId;
    ogMessageId = messageSend(token, channelId, 'message').messageId;
  });

  test('Incorrect channelId', () => {
    expect(messageShare(token, ogMessageId, 'incorrect', channelId + 1, -1)).toStrictEqual(400);
  });
  test('Incorrect dmId', () => {
    expect(messageShare(token, ogMessageId, 'incorrect', -1, dmId + 1)).toStrictEqual(400);
  });
  test('Incorrect dmId and channelId', () => {
    expect(messageShare(token, ogMessageId, 'incorrect', channelId + 1, dmId + 1)).toStrictEqual(400);
  });
  test('incorrect ogMessageId', () => {
    expect(messageShare(token, ogMessageId + 1, 'incorrect', -1, -1)).toStrictEqual(400);
  });
  test('incorrect optional message length', () => {
    expect(messageShare(token, ogMessageId, 'incorrect'.repeat(1001), channelId, -1)).toStrictEqual(400);
  });
  test('no user in channel or dm', () => {
    const userNotJoined = authRegister('newemail@outlook.com', '1234567', 'Hailey', 'Wang');
    expect(messageShare(userNotJoined.token, ogMessageId, 'incorrect', channelId, -1)).toStrictEqual(403);
    expect(messageShare(userNotJoined.token, ogMessageId, 'incorrect', -1, dmId)).toStrictEqual(403);
  });
  test('Incorrect token', () => {
    expect(messageShare(token + 1, ogMessageId, 'incorrect', -1, -1)).toStrictEqual(403);
  });
});

describe('testing messageShare correct cases', () => {
  let token = '';
  let channelId = -1;
  let dmId = -1;
  let ogMessageId : number;

  beforeEach(() => {
    const user = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    token = user.token;
    dmId = dmCreate(token, []).dmId;
    channelId = channelsCreate(token, 'channel1', true).channelId;
    ogMessageId = messageSend(token, channelId, 'message').messageId;
  });

  test('Correct channelId', () => {
    expect(messageShare(token, ogMessageId, 'correct', channelId, -1)).toStrictEqual({ sharedMessageId: expect.any(Number) });
  });
  test('correct dmId', () => {
    expect(messageShare(token, ogMessageId, 'correct', -1, dmId)).toStrictEqual({ sharedMessageId: expect.any(Number) });
  });

  test('message is sent', () => {
    messageShare(token, ogMessageId, 'correct', channelId, -1);
    expect(channelMessages(token, channelId, 0).messages[0].message.includes('message')).toStrictEqual(true);
    expect(channelMessages(token, channelId, 0).messages[0].message.includes('correct')).toStrictEqual(true);
  });

  test('message is sent', () => {
    messageShare(token, ogMessageId, 'correct', -1, dmId);
    expect(dmMessages(token, dmId, 0).messages[0].message.includes('message')).toStrictEqual(true);
    expect(dmMessages(token, dmId, 0).messages[0].message.includes('correct')).toStrictEqual(true);
  });
});
