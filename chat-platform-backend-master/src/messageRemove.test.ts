import { authRegister, clear, dmCreate, messageSendDm, messageSend, channelsCreate, channelInvite, channelMessages, dmMessages, messageRemove } from './testHelpers';

beforeEach(() => {
  clear();
});

describe('Testing messageRemove Error Cases', () => {
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
    expect(messageRemove(globalToken + 'hi', messageId)).toStrictEqual(403);
  });

  test('Message was not sent by the authorised user, and user does not have owner permissions in the channel', () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const userId1 = user1.authUserId;
    channelInvite(globalToken, channelId, userId1);
    const messageId: number = messageSend(globalToken, channelId, 'Hello').messageId;
    expect(messageRemove(token1, messageId)).toStrictEqual(403);
  });

  test('Message was not sent by the authorised user, and user does not have owner permissions in the DM', () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const dmId = dmCreate(token1, [globalUID]).dmId;
    const messageId = messageSendDm(token1, dmId, 'Hi there').messageId;
    expect(messageRemove(globalToken, messageId)).toStrictEqual(403);
  });

  test('MessageId does not exist in dm/channel', () => {
    const messageId = messageSend(globalToken, channelId, 'Hey guys').messageId;
    expect(messageRemove(globalToken, messageId + 1)).toStrictEqual(400);
  });

  test('MessageId is valid but the authorised user is not a part of channel', () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const messageId = messageSend(globalToken, channelId, 'Hey guys').messageId;
    expect(messageRemove(token1, messageId)).toStrictEqual(400);
  });

  test('MessageId is valid but the authorised user is not a part of dm', () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const dmId = dmCreate(globalToken, []).dmId;
    const messageId = messageSendDm(globalToken, dmId, 'Hey guys').messageId;
    expect(messageRemove(token1, messageId)).toStrictEqual(400);
  });
});

describe('Testing messageRemove correct return type', () => {
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
    expect(messageRemove(globalToken, messageId)).toStrictEqual({});
  });

  test("Channels: Global Owner remove members' messages", () => {
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

    messageRemove(globalToken, messageId);
    expect(channelMessages(globalToken, channelId, 0).messages).toStrictEqual([]);
  });

  test("Channels: Channel Owner removing members' messages", () => {
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

    messageRemove(token1, messageId);
    expect(channelMessages(token1, channelId, 0).messages).toStrictEqual([]);
  });

  test('Channels: Member removing their own messages', () => {
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

    messageRemove(token2, messageId);
    expect(channelMessages(token1, channelId, 0).messages).toStrictEqual([]);
  });

  test("DM: DM owner removing members' messages", () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const dmId = dmCreate(token1, [globalUID]).dmId;

    const messageId = messageSendDm(globalToken, dmId, 'Hey bro').messageId;
    messageRemove(token1, messageId);
    expect(dmMessages(token1, dmId, 0).messages).toStrictEqual([]);
  });

  test('DM: DM member removing their own messages', () => {
    const user1 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token1 = user1.token;
    const dmId = dmCreate(token1, [globalUID]).dmId;

    const messageId = messageSendDm(globalToken, dmId, 'Hey bro').messageId;
    messageRemove(globalToken, messageId);
    expect(dmMessages(token1, dmId, 0).messages).toStrictEqual([]);
  });
});
