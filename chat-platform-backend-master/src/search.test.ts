import {
  clear,
  authRegister,
  channelsCreate,
  messageSend,
  dmCreate,
  messageSendDm,
  search,
  channelInvite,
} from './testHelpers';

beforeEach(() => {
  clear();
});

describe('Error case testing', () => {
  let token = '';
  beforeEach(() => {
    token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
  });
  test('Invalid token', () => {
    expect(search(token + '123', 'Hello')).toStrictEqual(403);
  });
  test('Length of queryStr < 1', () => {
    expect(search(token, '')).toStrictEqual(400);
  });
  test('Length of queryStr > 1000', () => {
    expect(search(token, 'a'.repeat(1001))).toStrictEqual(400);
  });
});

describe('Correct return type', () => {
  let token = '';
  let uId = 0;
  let channelId = 0;
  let dmId = 0;
  beforeEach(() => {
    const user = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    uId = user.authUserId;
    token = user.token;
    channelId = channelsCreate(token, 'channel1', true).channelId;
    dmId = dmCreate(token, []).dmId;
  });

  test('No message at all', () => {
    expect(search(token, 'yo bro')).toStrictEqual({ messages: [] });
  });

  test("There're messages but no messages with matching queryString", () => {
    messageSend(token, channelId, 'Hey guys');
    messageSendDm(token, dmId, 'why is notification/get so complicated?');
    expect(search(token, 'i have no idea')).toStrictEqual({ messages: [] });
  });

  test('There are messages with matching queryString', () => {
    const messageId1 = messageSend(token, channelId, 'Good luck with your COMM1180 Exam!').messageId;
    const messageId2 = messageSend(token, channelId, 'Good luck with your COMM1170 Exam!').messageId;
    messageSendDm(token, dmId, "Exams way too close together :'(");
    const messageId3 = messageSendDm(token, dmId, 'Good luck with COMP1531!').messageId;
    expect(search(token, 'Good luck with')).toStrictEqual(
      {
        messages: [
          {
            messageId: messageId1,
            uId: uId,
            message: 'Good luck with your COMM1180 Exam!',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false
          },
          {
            messageId: messageId2,
            uId: uId,
            message: 'Good luck with your COMM1170 Exam!',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false
          },
          {
            messageId: messageId3,
            uId: uId,
            message: 'Good luck with COMP1531!',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false
          },
        ]
      }
    );
  });

  test('Query string is case-insensitive', () => {
    const messageId1 = messageSend(token, channelId, 'GOOD luck WITH your COMM1180 Exam!').messageId;
    const messageId2 = messageSend(token, channelId, 'good LUCK with YOUR COMM1170 Exam!').messageId;
    messageSendDm(token, dmId, "Exams way too close together :'(");
    const messageId3 = messageSendDm(token, dmId, 'GOOD LUCK WITH YOUR COMP1531!').messageId;
    expect(search(token, 'Good luck with')).toStrictEqual(
      {
        messages: [
          {
            messageId: messageId1,
            uId: uId,
            message: 'GOOD luck WITH your COMM1180 Exam!',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false
          },
          {
            messageId: messageId2,
            uId: uId,
            message: 'good LUCK with YOUR COMM1170 Exam!',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false
          },
          {
            messageId: messageId3,
            uId: uId,
            message: 'GOOD LUCK WITH YOUR COMP1531!',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false
          },
        ]
      }
    );
  });

  test('Message is substring of the query string', () => {
    messageSend(token, channelId, 'abc');
    messageSend(token, channelId, 'abcd');
    messageSendDm(token, dmId, 'abcde');
    expect(search(token, 'abcdefg')).toStrictEqual({ messages: [] });
  });

  test('Message contains a substring of the query string', () => {
    messageSend(token, channelId, 'abcccccccc');
    messageSend(token, channelId, 'abcddddddd');
    messageSendDm(token, dmId, 'abcdeeeeeeeefg');
    expect(search(token, 'abcdefg')).toStrictEqual({ messages: [] });
  });

  test('User is not part of channel or dm', () => {
    const token2 = authRegister('zz@outlook.com', '1234567', 'Z', 'Z').token;
    messageSend(token, channelId, 'Good luck with your COMM1180 Exam!');
    messageSend(token, channelId, 'Good luck with your COMM1170 Exam!');
    messageSendDm(token, dmId, "Exams way too close together :'(");
    messageSendDm(token, dmId, 'Good luck with COMP1531!');
    expect(search(token2, 'Good luck with')).toStrictEqual({ messages: [] });
  });

  test('User is a part of some channels but not all', () => {
    const user2 = authRegister('zz@outlook.com', '1234567', 'Z', 'Z');
    const uId2 = user2.authUserId;
    const token2 = user2.token;
    channelInvite(token, channelId, uId2);
    const messageId1 = messageSend(token, channelId, 'Good luck with your COMM1180 Exam!').messageId;
    const messageId2 = messageSend(token, channelId, 'Good luck with your COMM1170 Exam!').messageId;
    const channelId2 = channelsCreate(token, 'channel2', true).channelId;
    messageSend(token, channelId2, 'Good luck with your COMP1531 Exam!');
    messageSendDm(token, dmId, "Exams way too close together :'(");
    messageSendDm(token, dmId, 'Good luck with COMP1531!');
    expect(search(token2, 'Good luck with')).toStrictEqual(
      {
        messages: [
          {
            messageId: messageId1,
            uId: uId,
            message: 'Good luck with your COMM1180 Exam!',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false
          },
          {
            messageId: messageId2,
            uId: uId,
            message: 'Good luck with your COMM1170 Exam!',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false
          },
        ]
      }
    );
  });

  test('User is a part of some DMs but not all', () => {
    const user2 = authRegister('zz@outlook.com', '1234567', 'Z', 'Z');
    const uId2 = user2.authUserId;
    const token2 = user2.token;
    const dmId2 = dmCreate(token, [uId2]).dmId;
    messageSend(token, channelId, 'Good luck with your COMM1180 Exam!');
    messageSend(token, channelId, 'Good luck with your COMM1170 Exam!');
    messageSendDm(token, dmId, 'Good luck with everything <3');
    const messageId = messageSendDm(token, dmId2, 'Good luck with COMP1531!').messageId;
    expect(search(token2, 'Good luck with')).toStrictEqual(
      {
        messages: [
          {
            messageId: messageId,
            uId: uId,
            message: 'Good luck with COMP1531!',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false
          },
        ]
      }
    );
  });
});
