import {
  clear,
  channelsCreate,
  channelMessages,
  messagePin,
  messagesendLater,
  authRegister,
} from './testHelpers';

function sleep(s: number) {
  const currentTime = Math.floor(Date.now() / 1000);
  let time = Math.floor(Date.now() / 1000);
  while (time < currentTime + s) {
    time = Math.floor(Date.now() / 1000);
  }
}

beforeEach(() => {
  clear();
});

describe('messagesendLater Error Case', () => {
  let token = '';
  let channelId = 0;
  beforeEach(() => {
    const user = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    token = user.token;
    channelId = channelsCreate(token, 'channel1', true).channelId;
  });

  test('Error: channelId does not refer to a valid channel', () => {
    expect(messagesendLater(token, channelId + 1, 'Life is hard', Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual(400);
  });

  test('Error: length of the message is less than 1', () => {
    expect(messagesendLater(token, channelId, '', Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual(400);
  });

  test('Error: length of the message is over 1000 characters', () => {
    expect(messagesendLater(token, channelId, 'c'.repeat(1001), Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual(400);
  });

  test('Error: timeSent is a time in the past', () => {
    expect(messagesendLater(token, channelId, "Don't know what to say", Math.floor((new Date()).getTime() / 1000) - 5)).toStrictEqual(400);
  });

  test('Error: Invalid token', () => {
    expect(messagesendLater(token + 'hi', channelId, 'No idea a', Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual(403);
  });

  test('Error: valid channelId but authorised user is not a member of the channel', () => {
    const token2 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang').token;
    expect(messagesendLater(token2, channelId, 'No idea a', Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual(403);
  });
});

describe('messagesendLater correct return type', () => {
  let token = '';
  let uId1 = 0;
  let channelId = 0;
  beforeEach(() => {
    const user = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    token = user.token;
    uId1 = user.authUserId;
    channelId = channelsCreate(token, 'channel1', true).channelId;
  });

  test('Message send 2 seconds in the future', () => {
    const messageId = messagesendLater(token, channelId, 'Life is hard', Math.floor((new Date()).getTime() / 1000) + 2).messageId;
    expect(messagePin(token, messageId)).toStrictEqual(400);
    expect(channelMessages(token, channelId, 0).messages).toStrictEqual([]);
    sleep(3);
    expect(messagePin(token, messageId)).toStrictEqual({});
    expect(channelMessages(token, channelId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: uId1,
          message: 'Life is hard',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: true,
        }
      ]
    );
  });

  test('Correct return type', () => {
    expect(messagesendLater(token, channelId, 'Life is hard', Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual({ messageId: expect.any(Number) });
    sleep(2);
  });
});
