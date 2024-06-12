import {
  authRegister,
  messageEdit, clear,
  dmCreate,
  messageSendDm,
  messageSend,
  channelsCreate,
  channelInvite,
  channelMessages,
  dmMessages
} from './testHelpers';

beforeEach(() => {
  clear();
});

describe('Testing messageEdit Error Cases', () => {
  let globalUID = 0;
  let globalToken = '';
  let channelId = 0;
  beforeEach(() => {
    const globalOwner = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    globalUID = globalOwner.authUserId;
    globalToken = globalOwner.token;
    channelId = channelsCreate(globalToken, 'Channel 1', true).channelId;
  });

  test('Invalid token', () => {
    const messageId: number = messageSend(globalToken, channelId, 'Hello').messageId;
    expect(messageEdit(globalToken + 'hi', messageId, 'Hi')).toStrictEqual(403);
  });
  test('Length of message > 1000 characters', () => {
    const messageId: number = messageSend(globalToken, channelId, 'Hello').messageId;
    expect(messageEdit(globalToken, messageId, 'a'.repeat(1005))).toStrictEqual(400);
  });
  test('Message was not sent by the authorised user, and user does not have owner permissions in the channel', () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const userId1 = user1.authUserId;
    channelInvite(globalToken, channelId, userId1);

    const messageId: number = messageSend(globalToken, channelId, 'Hello').messageId;
    expect(messageEdit(token1, messageId, 'hi')).toStrictEqual(403);
  });

  test('Message was not sent by the authorised user, and user does not have owner permissions in the DM', () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const dmId = dmCreate(token1, [globalUID]).dmId;
    const messageId = messageSendDm(token1, dmId, 'Hi there').messageId;
    expect(messageEdit(globalToken, messageId, 'Hello')).toStrictEqual(403);
  });

  test('MessageId does not exist in dm/channel', () => {
    const messageId = messageSend(globalToken, channelId, 'Hey guys').messageId;
    expect(messageEdit(globalToken, messageId + 1, 'Heyo')).toStrictEqual(400);
  });

  test('MessageId is valid but the authorised user is not a part of the channel', () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const messageId = messageSend(globalToken, channelId, 'Hey guys').messageId;
    expect(messageEdit(token1, messageId, 'Heyo')).toStrictEqual(400);
  });
  test('MessageId is valid but the authorised user is not a part of the dm', () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const dmId = dmCreate(globalToken, [globalUID]).dmId;
    const messageId = messageSendDm(globalToken, dmId, 'Hey guys').messageId;
    expect(messageEdit(token1, messageId, 'Heyo')).toStrictEqual(400);
  });
});

describe('Testing messageEdit correct return type', () => {
  let globalUID = 0;
  let globalToken = '';
  beforeEach(() => {
    const globalOwner = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    globalUID = globalOwner.authUserId;
    globalToken = globalOwner.token;
  });

  test('Correct returned object', () => {
    const channelId = channelsCreate(globalToken, 'Channel 1', true).channelId;
    const messageId = messageSend(globalToken, channelId, 'Hey guys').messageId;
    expect(messageEdit(globalToken, messageId, 'Yoyo')).toStrictEqual({});
  });
  test("Channels: Global Owner editing members' messages", () => {
    // owner of the channel
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const channelId = channelsCreate(token1, 'channel 1', true).channelId;

    // invite global owner to the channel;
    channelInvite(token1, channelId, globalUID);

    // member of the channel without special permissions
    const user2 = authRegister('yy@outlook.com', '1234567', 'Yo', 'Yo');
    const token2 = user2.token;
    const userId2 = user2.authUserId;
    channelInvite(token1, channelId, userId2);
    const messageId = messageSend(token2, channelId, 'AAAAA').messageId;

    messageEdit(globalToken, messageId, 'BBBBB');
    expect(channelMessages(globalToken, channelId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: userId2,
          message: 'BBBBB',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });
  test("Channels: Channel Owner editing members' messages", () => {
    // owner of the channel
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const channelId = channelsCreate(token1, 'channel 1', true).channelId;

    // member of the channel without special permissions
    const user2 = authRegister('yy@outlook.com', '1234567', 'Yo', 'Yo');
    const token2 = user2.token;
    const userId2 = user2.authUserId;
    channelInvite(token1, channelId, userId2);
    const messageId = messageSend(token2, channelId, 'AAAAA').messageId;

    messageEdit(token1, messageId, 'BBBBB');
    expect(channelMessages(token1, channelId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: userId2,
          message: 'BBBBB',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });

  test('Channels: Member editing their own messages', () => {
    // owner of the channel
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const channelId = channelsCreate(token1, 'channel 1', true).channelId;

    // member of the channel without special permissions
    const user2 = authRegister('yy@outlook.com', '1234567', 'Yo', 'Yo');
    const token2 = user2.token;
    const userId2 = user2.authUserId;
    channelInvite(token1, channelId, userId2);
    const messageId = messageSend(token2, channelId, 'AAAAA').messageId;

    messageEdit(token2, messageId, 'BBBBB');
    expect(channelMessages(token1, channelId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: userId2,
          message: 'BBBBB',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });
  test('New message is an empty string -> message deleted', () => {
    // owner of the channel
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const channelId = channelsCreate(token1, 'channel 1', true).channelId;

    // member of the channel without special permissions
    const user2 = authRegister('yy@outlook.com', '1234567', 'Yo', 'Yo');
    const token2 = user2.token;
    const userId2 = user2.authUserId;
    channelInvite(token1, channelId, userId2);
    const messageId = messageSend(token2, channelId, 'AAAAA').messageId;

    messageEdit(token2, messageId, '');
    expect(channelMessages(token1, channelId, 0).messages).toStrictEqual([]);
  });

  test('New message is an empty string in  dm -> message deleted', () => {
    // owner of the channel
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const user2 = authRegister('yy@outlook.com', '1234567', 'Yo', 'Yo');
    const token2 = user2.token;
    const userId2 = user2.authUserId;
    const dmId = dmCreate(token1, [userId2]).dmId;

    // member of the channel without special permissions
    const messageId = messageSendDm(token2, dmId, 'AAAAA').messageId;

    messageEdit(token2, messageId, '');
    expect(dmMessages(token1, dmId, 0).messages).toStrictEqual([]);
  });

  test("DM: DM owner editing members' messages", () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const dmId = dmCreate(token1, [globalUID]).dmId;

    const messageId = messageSendDm(globalToken, dmId, 'Hey bro').messageId;
    messageEdit(token1, messageId, 'Hey');
    expect(dmMessages(token1, dmId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: globalUID,
          message: 'Hey',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });

  test('DM: DM member editing their own messages', () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const dmId = dmCreate(token1, [globalUID]).dmId;

    const messageId = messageSendDm(globalToken, dmId, 'Hey bro').messageId;
    messageEdit(globalToken, messageId, 'Hey');
    expect(dmMessages(token1, dmId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: globalUID,
          message: 'Hey',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });
});
