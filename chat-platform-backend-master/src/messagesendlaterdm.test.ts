import {
  clear,
  dmCreate,
  dmMessages,
  messagePin,
  messagesendLaterDM,
  authRegister,
  dmRemove
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
  let dmId = 0;
  beforeEach(() => {
    const user = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    token = user.token;
    dmId = dmCreate(token, []).dmId;
  });

  test('Error: dmId does not refer to a valid dm', () => {
    expect(messagesendLaterDM(token, dmId + 1, 'Life is hard', Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual(400);
  });

  test('Error: length of the message is less than 1', () => {
    expect(messagesendLaterDM(token, dmId, '', Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual(400);
  });

  test('Error: length of the message is over 1000 characters', () => {
    expect(messagesendLaterDM(token, dmId, 'c'.repeat(1001), Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual(400);
  });

  test('Error: timeSent is a time in the past', () => {
    expect(messagesendLaterDM(token, dmId, "Don't know what to say", Math.floor((new Date()).getTime() / 1000) - 5)).toStrictEqual(400);
  });

  test('Error: Invalid token', () => {
    expect(messagesendLaterDM(token + 'hi', dmId, 'No idea a', Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual(403);
  });

  test('Error: valid dmId but authorised user is not a member of the dm', () => {
    const token2 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang').token;
    expect(messagesendLaterDM(token2, dmId, 'No idea a', Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual(403);
  });
});

describe('messagesendLater correct return type', () => {
  let token = '';
  let uId = 0;
  let dmId = 0;
  beforeEach(() => {
    const user = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    uId = user.authUserId;
    token = user.token;
    dmId = dmCreate(token, []).dmId;
  });

  test('Message send 2 seconds in the future', () => {
    const messageId = messagesendLaterDM(token, dmId, 'Life is hard', Math.floor((new Date()).getTime() / 1000) + 2).messageId;
    expect(messagePin(token, messageId)).toStrictEqual(400);
    expect(dmMessages(token, dmId, 0).messages).toStrictEqual([]);
    sleep(2.5);
    expect(messagePin(token, messageId)).toStrictEqual({});
    expect(dmMessages(token, dmId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: uId,
          message: 'Life is hard',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: true,
        }
      ]
    );
  });

  test('Correct return type', () => {
    expect(messagesendLaterDM(token, dmId, 'Life is hard', Math.floor((new Date()).getTime() / 1000) + 2)).toStrictEqual({ messageId: expect.any(Number) });
    sleep(2.5);
  });

  test('If the DM is removed before the message has sent, message will not be sent', () => {
    messagesendLaterDM(token, dmId, 'Life is hard', Math.floor((new Date()).getTime() / 1000) + 3);
    expect(dmMessages(token, dmId, 0).messages).toStrictEqual([]);
    dmRemove(token, dmId);
    sleep(3.5);
    expect(dmMessages(token, dmId, 0)).toStrictEqual(400);
  });
});
