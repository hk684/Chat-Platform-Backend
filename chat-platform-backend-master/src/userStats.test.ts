import {
  clear,
  channelsCreate,
  channelJoin,
  channelInvite,
  dmCreate,
  dmRemove,
  messageSend,
  messageRemove,
  messageSendDm,
  authRegister,
  dmLeave,
  channelLeave,
  userStats
} from './testHelpers';

beforeEach(() => {
  clear();
});

describe('Error case', () => {
  test('Invalid token', () => {
    const token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
    expect(userStats(token + 'hi')).toStrictEqual(403);
  });
});

describe('userStats correct return type', () => {
  let token = '';
  beforeEach(() => {
    token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
  });

  test('User is not a part of any channels, dms & did not send any messages', () => {
    expect(userStats(token)).toStrictEqual(
      {
        userStats: {
          channelsJoined: [{ numChannelsJoined: 0, timeStamp: expect.any(Number) }],
          dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.any(Number) }],
          messagesSent: [{ numMessagesSent: 0, timeStamp: expect.any(Number) }],
          involvementRate: 0,
        }
      }
    );
  });

  test('Involvement rate capped at 1 && removal of message does not affect no. of messages sent', () => {
    const dmId = dmCreate(token, []).dmId;
    const channelId = channelsCreate(token, 'channel1', true).channelId;
    const msgId1 = messageSend(token, channelId, 'all good as long as you try ur best').messageId;
    messageSendDm(token, dmId, 'Ill try my best');
    messageRemove(token, msgId1);
    expect(userStats(token)).toStrictEqual(
      {
        userStats: {
          channelsJoined: [
            {
              numChannelsJoined: 0,
              timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 1,
              timeStamp: expect.any(Number)
            }
          ],
          dmsJoined: [
            {
              numDmsJoined: 0,
              timeStamp: expect.any(Number)
            },
            {
              numDmsJoined: 1,
              timeStamp: expect.any(Number)
            }
          ],
          messagesSent: [
            {
              numMessagesSent: 0,
              timeStamp: expect.any(Number)
            },
            {
              numMessagesSent: 1,
              timeStamp: expect.any(Number)
            },
            {
              numMessagesSent: 2,
              timeStamp: expect.any(Number)
            }
          ],
          involvementRate: 1,
        }
      }
    );
  });

  test('User joined a channel and then leave the channel by channelLeave', () => {
    dmCreate(token, []);
    const channelId = channelsCreate(token, 'channel1', true).channelId;
    messageSend(token, channelId, 'all good as long as you try ur best');
    channelLeave(token, channelId);
    expect(userStats(token)).toStrictEqual(
      {
        userStats: {
          channelsJoined: [
            {
              numChannelsJoined: 0,
              timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 1,
              timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 0,
              timeStamp: expect.any(Number)
            }
          ],
          dmsJoined: [
            {
              numDmsJoined: 0,
              timeStamp: expect.any(Number)
            },
            {
              numDmsJoined: 1,
              timeStamp: expect.any(Number)
            }
          ],
          messagesSent: [
            {
              numMessagesSent: 0,
              timeStamp: expect.any(Number)
            },
            {
              numMessagesSent: 1,
              timeStamp: expect.any(Number)
            },
          ],
          involvementRate: 2 / 3,
        }
      }
    );
  });

  test('User joined a DM and then leave a DM by DM Leave', () => {
    const dmId = dmCreate(token, []).dmId;
    const channelId = channelsCreate(token, 'channel1', true).channelId;
    messageSend(token, channelId, 'all good as long as you try ur best');
    dmLeave(token, dmId);
    expect(userStats(token)).toStrictEqual(
      {
        userStats: {
          channelsJoined: [
            {
              numChannelsJoined: 0,
              timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 1,
              timeStamp: expect.any(Number)
            },
          ],
          dmsJoined: [
            {
              numDmsJoined: 0,
              timeStamp: expect.any(Number)
            },
            {
              numDmsJoined: 1,
              timeStamp: expect.any(Number)
            },
            {
              numDmsJoined: 0,
              timeStamp: expect.any(Number)
            }
          ],
          messagesSent: [
            {
              numMessagesSent: 0,
              timeStamp: expect.any(Number)
            },
            {
              numMessagesSent: 1,
              timeStamp: expect.any(Number)
            },
          ],
          involvementRate: 2 / 3,
        }
      }
    );
  });

  test('User joined a channel by channelJoin', () => {
    const token2 = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang').token;
    const channelId = channelsCreate(token, 'channel1', true).channelId;
    channelJoin(token2, channelId);
    expect(userStats(token2)).toStrictEqual(
      {
        userStats: {
          channelsJoined: [
            {
              numChannelsJoined: 0, timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 1, timeStamp: expect.any(Number)
            }
          ],
          dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.any(Number) }],
          messagesSent: [{ numMessagesSent: 0, timeStamp: expect.any(Number) }],
          involvementRate: 1,
        }
      }
    );
  });

  test('User joined a channel by channelInvite', () => {
    const user = authRegister('zz@outlook.com', '1234567', 'Zac', 'Zhang');
    const token2 = user.token;
    const uId2 = user.authUserId;
    const channelId = channelsCreate(token, 'channel1', false).channelId;
    channelInvite(token, channelId, uId2);
    expect(userStats(token2)).toStrictEqual(
      {
        userStats: {
          channelsJoined: [
            {
              numChannelsJoined: 0, timeStamp: expect.any(Number)
            },
            {
              numChannelsJoined: 1, timeStamp: expect.any(Number)
            }
          ],
          dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.any(Number) }],
          messagesSent: [{ numMessagesSent: 0, timeStamp: expect.any(Number) }],
          involvementRate: 1,
        }
      }
    );
  });

  test('Dm is removed', () => {
    const dmId = dmCreate(token, []).dmId;
    dmRemove(token, dmId);
    expect(userStats(token)).toStrictEqual(
      {
        userStats: {
          channelsJoined: [{ numChannelsJoined: 0, timeStamp: expect.any(Number) }],
          dmsJoined: [
            {
              numDmsJoined: 0,
              timeStamp: expect.any(Number)
            },
            {
              numDmsJoined: 1,
              timeStamp: expect.any(Number)
            },
            {
              numDmsJoined: 0,
              timeStamp: expect.any(Number)
            },
          ],
          messagesSent: [{ numMessagesSent: 0, timeStamp: expect.any(Number) }],
          involvementRate: 0,
        }
      }
    );
  });
});
