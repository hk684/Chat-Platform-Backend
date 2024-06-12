import { authRegister, channelsCreate, channelInvite, channelMessages, standupStart, standupSend, standupActive, clear } from './testHelpers';

function sleep(s: number) {
  return new Promise(resolve => setTimeout(resolve, s * 1000));
}

describe('HTTP Tests for standups', () => {
  beforeEach(() => {
    clear();
  });
  test('0.1 Invalid Token', async () => {
    const user1 = authRegister('henry@gmail.com', 'examplepassword', 'Henry', 'Lan');
    const channel = channelsCreate(user1.token, 'Henrys Channel', true);
    expect(standupStart('invalidtoken', channel.channelId, 2)).toStrictEqual(403);
    expect(standupActive('invalidtoken', channel.channelId)).toStrictEqual(403);
  });
  test('0.2 Invalid channelId', () => {
    const user1 = authRegister('henry@gmail.com', 'examplepassword', 'Henry', 'Lan');
    const channel = channelsCreate(user1.token, 'Henrys Channel', true);
    expect(standupStart(user1.token, channel.channelId + 1, 2)).toStrictEqual(400);
    expect(standupActive(user1.token, channel.channelId + 1)).toStrictEqual(400);
  });
  test('0.3 Length is negative', () => {
    const user1 = authRegister('henry@gmail.com', 'examplepassword', 'Henry', 'Lan');
    const channel = channelsCreate(user1.token, 'Henrys Channel', true);
    expect(standupStart(user1.token, channel.channelId, -1)).toStrictEqual(400);
  });
  test('0.4 Standup is currently running', async () => {
    const user1 = authRegister('henry@gmail.com', 'examplepassword', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const channel = channelsCreate(user1.token, 'Henrys Channel', true);
    standupStart(user1.token, channel.channelId, 2);
    expect(standupStart(user1.token, channel.channelId, 2)).toStrictEqual(400);
    await sleep(2);
    expect(standupStart(user2.token, channel.channelId, 2)).toStrictEqual(403);
    await sleep(2);
  });
  test('0.5 Valid channelId, authorised user not member of channel', async () => {
    const user1 = authRegister('henry@gmail.com', 'examplepassword', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const channel = channelsCreate(user1.token, 'Henrys Channel', true);
    expect(standupStart(user2.token, channel.channelId, 10)).toStrictEqual(403);
    expect(standupActive(user2.token, channel.channelId)).toStrictEqual(403);
  });
  test('0.6 standupSend: standup is active', async () => {
    const user1 = authRegister('henry@gmail.com', 'examplepassword', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const channel = channelsCreate(user1.token, 'Henrys Channel', true);
    standupStart(user1.token, channel.channelId, 2);
    expect(standupSend(user2.token, channel.channelId, 'Whos Joe')).toStrictEqual(403);
    expect(standupSend(user1.token, channel.channelId + 1, 'Whos Joe')).toStrictEqual(400);
    expect(standupSend(user1.token, channel.channelId, 'Joemamalol'.repeat(101))).toStrictEqual(400);
    await sleep(2);
    expect(standupSend(user1.token, channel.channelId, 'Whos Joe')).toStrictEqual(400);
  });
  test('1.0 Success Cases ', async () => {
    const user1 = authRegister('henry@gmail.com', 'examplepassword', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const channel = channelsCreate(user1.token, 'Henrys Channel', true);
    channelInvite(user1.token, channel.channelId, user2.authUserId);

    const timeFinish = Math.floor((new Date()).getTime() / 1000) + 2;
    const checkTimeFinish = standupStart(user1.token, channel.channelId, 2).timeFinish;
    expect(checkTimeFinish).toBeGreaterThanOrEqual(timeFinish);
    expect(checkTimeFinish).toBeLessThanOrEqual(timeFinish + 1);

    expect(standupActive(user1.token, channel.channelId)).toStrictEqual({
      isActive: true,
      timeFinish: checkTimeFinish
    });
    expect(standupSend(user1.token, channel.channelId, 'Whos Joe')).toStrictEqual({});
    expect(standupSend(user2.token, channel.channelId, 'Joe Mama')).toStrictEqual({});

    await sleep(2);

    expect(channelMessages(user1.token, channel.channelId, 0)).toStrictEqual({
      messages: [{
        messageId: 1,
        uId: user1.authUserId,
        message: 'henrylan: Whos Joe\njoemama: Joe Mama',
        timeSent: timeFinish,
        isPinned: false,
        reacts: [],
      }],
      start: 0,
      end: -1
    });
  });
});
