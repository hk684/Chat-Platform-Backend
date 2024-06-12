import { messageSendDm, clear, dmCreate, authRegister, dmMessages } from './testHelpers';

beforeEach(() => {
  clear();
});

describe('Testing messageSendDm Error cases', () => {
  let token = '';
  let dmId = 1;
  beforeEach(() => {
    token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
    dmId = dmCreate(token, []).dmId;
  });

  test('Invalid dmId', () => {
    expect(messageSendDm(token, dmId + 1, 'Hi there')).toStrictEqual(400);
  });
  test('Invalid token', () => {
    expect(messageSendDm(token + '...', dmId, 'Hi there')).toStrictEqual(403);
  });
  test('Length of message is less than 1', () => {
    expect(messageSendDm(token, dmId, '')).toStrictEqual(400);
  });
  test('Length of message is over 1000 characters', () => {
    expect(messageSendDm(token, dmId, 'a'.repeat(1002))).toStrictEqual(400);
  });
  test('Valid dmId but authorised user is not a member of the dm', () => {
    const token2 = authRegister('jaz@outlook.com', '1234569', 'Jaz', 'Wang').token;
    expect(messageSendDm(token2, dmId, 'How are you doing')).toStrictEqual(403);
  });
});

describe('Testing messageSendDm Correct Return Type', () => {
  let token = '';
  let dmId = 1;
  let userId = 1;
  let userId2 = 2;
  let token2 = '';
  beforeEach(() => {
    const user = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    token = user.token;
    userId = user.authUserId;
    const user2 = authRegister('zd@outlook.com', '1234567', 'Kate', 'Wong');
    userId2 = user2.authUserId;
    token2 = user2.token;
    dmId = dmCreate(token, [userId2]).dmId;
  });

  test('Correct return value', () => {
    expect(messageSendDm(token, dmId, "Hi, how's it going")).toStrictEqual({ messageId: expect.any(Number) });
  });

  test('Authorised user (that send the message) is the owner of the channel', () => {
    const messageId = messageSendDm(token, dmId, "Hi, how's it going").messageId;
    expect(dmMessages(token, dmId, 0).messages).toStrictEqual(
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
    const messageId = messageSendDm(token2, dmId, "Hi, how's it going").messageId;
    expect(dmMessages(token, dmId, 0).messages).toStrictEqual(
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
    const messageId = messageSendDm(token2, dmId, "Hi, how's it going").messageId;
    const messageId1 = messageSendDm(token, dmId, 'Hello how are you').messageId;
    expect(dmMessages(token, dmId, 0).messages).toStrictEqual(
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

  test('52 messages', () => {
    const messageIdArray: number[] = [];
    for (let i = 0; i <= 51; i++) {
      messageIdArray.push(messageSendDm(token, dmId, 'buh').messageId);
    }
    const expectedOutput = [];
    for (let i = 0; i < 50; i++) {
      expectedOutput.push({
        messageId: messageIdArray[51 - i],
        uId: userId,
        message: 'buh',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false
      });
    }
    expect(dmMessages(token, dmId, 0)).toStrictEqual({
      messages: expectedOutput,
      start: 0,
      end: 50
    });
  });
});
