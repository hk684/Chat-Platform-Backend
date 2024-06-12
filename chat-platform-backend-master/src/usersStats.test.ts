import {
  clear,
  authRegister,
  channelJoin,
  channelInvite,
  channelLeave,
  messageSend,
  messageRemove,
  channelsCreate,
  dmCreate,
  dmRemove,
  dmLeave,
  messageSendDm,
  usersStats,
} from './testHelpers';

beforeEach(() => {
  clear();
});

describe('Testing usersStats error cases', () => {
  test('Invalid token', () => {
    const token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
    expect(usersStats(token + 'hello')).toStrictEqual(403);
  });
});

describe('Testing correct return type', () => {
  let token: string;
  beforeEach(() => {
    token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
  });

  test('First user registers, no channels nor dms', () => {
    expect(usersStats(token)).toStrictEqual(
      {
        workspaceStats: {
          channelsExist: [
            {
              numChannelsExist: 0,
              timeStamp: expect.any(Number),
            }
          ],
          dmsExist: [
            {
              numDmsExist: 0,
              timeStamp: expect.any(Number),
            },
          ],
          messagesExist: [
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            }
          ],
          utilizationRate: 0,
        }
      }
    );
  });

  test('Second user registers, 1 channel & 1 dm is already in UNSW Memes', () => {
    channelsCreate(token, 'channel1', true);
    dmCreate(token, []);
    const token2 = authRegister('xm@outlook.com', '1234567', 'Xu', 'Ming').token;
    expect(usersStats(token2)).toStrictEqual(
      {
        workspaceStats: {
          channelsExist: [
            {
              numChannelsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numChannelsExist: 1,
              timeStamp: expect.any(Number),
            }
          ],
          dmsExist: [
            {
              numDmsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numDmsExist: 1,
              timeStamp: expect.any(Number),
            },
          ],
          messagesExist: [
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            }
          ],
          utilizationRate: 1 / 2,
        }
      }
    );
  });

  test('1 channel & 1 dm added to UNSW Memes after second user is registered', () => {
    const token2 = authRegister('xm@outlook.com', '1234567', 'Xu', 'Ming').token;
    channelsCreate(token, 'channel1', true);
    dmCreate(token2, []);
    expect(usersStats(token2)).toStrictEqual(
      {
        workspaceStats: {
          channelsExist: [
            {
              numChannelsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numChannelsExist: 1,
              timeStamp: expect.any(Number),
            }
          ],
          dmsExist: [
            {
              numDmsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numDmsExist: 1,
              timeStamp: expect.any(Number),
            },
          ],
          messagesExist: [
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            }
          ],
          utilizationRate: 1,
        }
      }
    );
  });

  test('Send messages in channels & dms', () => {
    const channelId = channelsCreate(token, 'channel1', true).channelId;
    const dmId = dmCreate(token, []).dmId;
    messageSend(token, channelId, 'Try your best');
    messageSendDm(token, dmId, 'try your best');
    expect(usersStats(token)).toStrictEqual(
      {
        workspaceStats: {
          channelsExist: [
            {
              numChannelsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numChannelsExist: 1,
              timeStamp: expect.any(Number),
            }
          ],
          dmsExist: [
            {
              numDmsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numDmsExist: 1,
              timeStamp: expect.any(Number),
            },
          ],
          messagesExist: [
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numMessagesExist: 1,
              timeStamp: expect.any(Number),
            },
            {
              numMessagesExist: 2,
              timeStamp: expect.any(Number),
            }
          ],
          utilizationRate: 1,
        }
      }
    );
  });

  test('Send messages and remove those messages by messageRemove', () => {
    const channelId = channelsCreate(token, 'channel1', true).channelId;
    const dmId = dmCreate(token, []).dmId;
    const msg1 = messageSend(token, channelId, 'Try your best').messageId;
    const msg2 = messageSendDm(token, dmId, 'try your best').messageId;
    messageRemove(token, msg1);
    messageRemove(token, msg2);
    expect(usersStats(token)).toStrictEqual(
      {
        workspaceStats: {
          channelsExist: [
            {
              numChannelsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numChannelsExist: 1,
              timeStamp: expect.any(Number),
            }
          ],
          dmsExist: [
            {
              numDmsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numDmsExist: 1,
              timeStamp: expect.any(Number),
            },
          ],
          messagesExist: [
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numMessagesExist: 1,
              timeStamp: expect.any(Number),
            },
            {
              numMessagesExist: 2,
              timeStamp: expect.any(Number),
            },
            {
              numMessagesExist: 1,
              timeStamp: expect.any(Number),
            },
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            }
          ],
          utilizationRate: 1,
        }
      }
    );
  });

  test('Remove a dm and its associated messages', () => {
    channelsCreate(token, 'channel1', true);
    const token2 = authRegister('zz@outlook.com', '1234567', 'Z', 'Z').token;
    const dmId = dmCreate(token2, []).dmId;
    messageSendDm(token2, dmId, 'Best of luck');
    messageSendDm(token2, dmId, 'try your best');
    dmRemove(token2, dmId);
    expect(usersStats(token)).toStrictEqual(
      {
        workspaceStats: {
          channelsExist: [
            {
              numChannelsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numChannelsExist: 1,
              timeStamp: expect.any(Number),
            }
          ],
          dmsExist: [
            {
              numDmsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numDmsExist: 1,
              timeStamp: expect.any(Number),
            },
            {
              numDmsExist: 0,
              timeStamp: expect.any(Number),
            },
          ],
          messagesExist: [
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numMessagesExist: 1,
              timeStamp: expect.any(Number),
            },
            {
              numMessagesExist: 2,
              timeStamp: expect.any(Number),
            },
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            }
          ],
          utilizationRate: 1 / 2,
        }
      }
    );
  });

  test('User join a channel via channelJoin', () => {
    const channelId = channelsCreate(token, 'channel1', true).channelId;
    const token2 = authRegister('xm@outlook.com', '1234567', 'Xu', 'Ming').token;
    channelJoin(token2, channelId);
    expect(usersStats(token2)).toStrictEqual(
      {
        workspaceStats: {
          channelsExist: [
            {
              numChannelsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numChannelsExist: 1,
              timeStamp: expect.any(Number),
            }
          ],
          dmsExist: [
            {
              numDmsExist: 0,
              timeStamp: expect.any(Number),
            },
          ],
          messagesExist: [
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            }
          ],
          utilizationRate: 1,
        }
      }
    );
  });

  test('User join a channel via channelInvite', () => {
    const channelId = channelsCreate(token, 'channel1', false).channelId;
    const uId = authRegister('xm@outlook.com', '1234567', 'Xu', 'Ming').authUserId;
    channelInvite(token, channelId, uId);
    expect(usersStats(token)).toStrictEqual(
      {
        workspaceStats: {
          channelsExist: [
            {
              numChannelsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numChannelsExist: 1,
              timeStamp: expect.any(Number),
            }
          ],
          dmsExist: [
            {
              numDmsExist: 0,
              timeStamp: expect.any(Number),
            },
          ],
          messagesExist: [
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            }
          ],
          utilizationRate: 1,
        }
      }
    );
  });

  test('User leave a channel via channelLeave', () => {
    const channelId = channelsCreate(token, 'channel1', false).channelId;
    messageSend(token, channelId, 'yo');
    channelLeave(token, channelId);
    expect(usersStats(token)).toStrictEqual(
      {
        workspaceStats: {
          channelsExist: [
            {
              numChannelsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numChannelsExist: 1,
              timeStamp: expect.any(Number),
            }
          ],
          dmsExist: [
            {
              numDmsExist: 0,
              timeStamp: expect.any(Number),
            },
          ],
          messagesExist: [
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numMessagesExist: 1,
              timeStamp: expect.any(Number),
            }
          ],
          utilizationRate: 0,
        }
      }
    );
  });

  test('User leave a dm via dmLeave', () => {
    const dmId = dmCreate(token, []).dmId;
    messageSendDm(token, dmId, 'yo');
    dmLeave(token, dmId);
    expect(usersStats(token)).toStrictEqual(
      {
        workspaceStats: {
          channelsExist: [
            {
              numChannelsExist: 0,
              timeStamp: expect.any(Number),
            },
          ],
          dmsExist: [
            {
              numDmsExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numDmsExist: 1,
              timeStamp: expect.any(Number),
            },
          ],
          messagesExist: [
            {
              numMessagesExist: 0,
              timeStamp: expect.any(Number),
            },
            {
              numMessagesExist: 1,
              timeStamp: expect.any(Number),
            }
          ],
          utilizationRate: 0,
        }
      }
    );
  });
});
