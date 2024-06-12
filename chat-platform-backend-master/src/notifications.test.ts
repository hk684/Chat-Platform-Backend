import {
  clear,
  channelsCreate,
  dmCreate,
  notificationsGet,
  messageReact,
  messageUnreact,
  messageSend,
  messageEdit,
  messageRemove,
  messageSendDm,
  authRegister,
  dmLeave,
  dmDetails,
  channelInvite,
  channelLeave,
  userProfile,
  // messageShare,
  standupStart,
  standupSend
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

describe('Error case', () => {
  test('Invalid token', () => {
    const token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
    expect(notificationsGet(token + 'hi')).toStrictEqual(403);
  });
});

describe('Notification happened in channel', () => {
  let globalUID = 0;
  let globalToken = '';
  let channelId = 0;
  let userId1 = 0;
  let userToken1 = '';
  beforeEach(() => {
    const globalOwner = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    globalUID = globalOwner.authUserId;
    globalToken = globalOwner.token;
    channelId = channelsCreate(globalToken, 'channel1', true).channelId;
    const user1 = authRegister('zh@outlook.com', '1234567', 'Zac', 'Hong');
    userId1 = user1.authUserId;
    userToken1 = user1.token;
    channelInvite(globalToken, channelId, userId1);
  });

  test('No notifications', () => {
    expect(notificationsGet(globalToken)).toStrictEqual({ notifications: [] });
  });

  test('Tag: A single Tag', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    messageSend(globalToken, channelId, 'Welcome to COMM1180 @' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('Tag: Multiple tags, one tag per message', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    messageSend(globalToken, channelId, 'Welcome to COMM1180 @' + userHandle);
    messageSend(globalToken, channelId, '@' + userHandle + ' Congrats on your achievements');
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: @' + userHandle + ' Congrats on'
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('Tag: Multiple tags in a single message (each tag tags a distinct person)', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    const user2 = authRegister('ww@outlook.com', '1234567', 'W', 'W');
    const userId2 = user2.authUserId;
    const userToken2 = user2.token;
    const userHandle2: string = userProfile(globalToken, userId2).user.handleStr;
    channelInvite(globalToken, channelId, userId2);
    messageSend(globalToken, channelId, 'Welcome to COMM1180 @' + userHandle + '@' + userHandle2);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
    expect(notificationsGet(userToken2)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('Tag: Invalid handle', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    messageSend(globalToken, channelId, 'Welcome to COMM1180 @' + userHandle + '1');
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('Tag: User is not added to the channel', () => {
    const user2 = authRegister('ww@outlook.com', '1234567', 'W', 'W');
    const userId2 = user2.authUserId;
    const userToken2 = user2.token;
    const userHandle2: string = userProfile(globalToken, userId2).user.handleStr;
    messageSend(globalToken, channelId, 'Welcome to COMM1180 @' + userHandle2);
    expect(notificationsGet(userToken2)).toStrictEqual({ notifications: [] });
  });

  test('Tag: User was in the channel, but is removed', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    channelLeave(userToken1, channelId);
    messageSend(globalToken, channelId, 'Welcome to COMM1180 @' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('Tag: User tag themselves', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    messageSend(userToken1, channelId, 'Welcome to COMM1180 @' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: userHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('Tag: Same valid tag appears multiple times in a single message', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    messageSend(globalToken, channelId, 'Welcome to COMM1180 @' + userHandle + '@' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('Tag: Messages are edited to contain tags', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    const messageId = messageSend(globalToken, channelId, 'Welcome to COMM1180 ').messageId;
    messageEdit(globalToken, messageId, 'Welcome to COMM1180 @' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('Tag: Messages are edited to tag a different person', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    const user2 = authRegister('ww@outlook.com', '1234567', 'W', 'W');
    const userId2 = user2.authUserId;
    const userToken2 = user2.token;
    const userHandle2: string = userProfile(globalToken, userId2).user.handleStr;
    channelInvite(globalToken, channelId, userId2);
    const messageId = messageSend(globalToken, channelId, 'Welcome to COMM1180 @' + userHandle).messageId;
    messageEdit(globalToken, messageId, 'Welcome to COMM1180 @' + userHandle2);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
    expect(notificationsGet(userToken2)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('Tag: Messages are edited so that tags remains unchanged, but content is changed', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    const messageId = messageSend(globalToken, channelId, 'Welcome to COMM1180 @' + userHandle).messageId;
    messageEdit(globalToken, messageId, 'Welcome to COMP1531 @' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMP1531 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  // test commented out because message/share is not implemented
  /*
  test('Tag: message/share optional message contains tags', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    const messageId = messageSend(globalToken, channelId, 'Welcome to COMM1180 ').messageId;
    messageShare(globalToken, messageId, '@' + userHandle, channelId, -1);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: expect.any(string),
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: expect.any(string),
          }
        ]
      }
    );
  });
  */

  test('Tag: tagged message is edited', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    const messageId = messageSend(globalToken, channelId, 'Welcome to COMM1180 @' + userHandle).messageId;
    messageEdit(globalToken, messageId, 'Welcome to COMM1180 Everyone!');
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('Tag: tagged message is removed', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    const messageId = messageSend(globalToken, channelId, 'Welcome to COMM1180 @' + userHandle).messageId;
    messageRemove(globalToken, messageId);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' tagged you in channel1: Welcome to COMM1180 '
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('React: React to a message', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const messageId = messageSend(globalToken, channelId, 'Welcome to COMM1170!').messageId;
    messageReact(userToken1, messageId, 1);
    expect(notificationsGet(globalToken)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: userHandle + ' reacted to your message in channel1',
          }
        ]
      }
    );
  });

  test('React: React to a message then message is unreacted', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const messageId = messageSend(globalToken, channelId, 'Welcome to COMM1170!').messageId;
    messageReact(userToken1, messageId, 1);
    messageUnreact(userToken1, messageId, 1);
    expect(notificationsGet(globalToken)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: userHandle + ' reacted to your message in channel1',
          }
        ]
      }
    );
  });

  test('React: user is no longer in the channel', () => {
    const messageId = messageSend(userToken1, channelId, 'Bye guys!').messageId;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    channelLeave(userToken1, channelId);
    messageReact(globalToken, messageId, 1);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          }
        ]
      }
    );
  });

  test('Add to channel: Add a user to the channel', () => {
    const user2 = authRegister('ww@outlook.com', '1234567', 'W', 'W');
    const userId2 = user2.authUserId;
    const userToken2 = user2.token;
    const globalHandle = userProfile(globalToken, globalUID).user.handleStr;
    channelInvite(globalToken, channelId, userId2);
    expect(notificationsGet(userToken2)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          },
        ]
      }
    );
  });
});

describe('Notification happened in DM', () => {
  let globalUID = 0;
  let globalToken = '';
  let dmId = 0;
  let userId1 = 0;
  let userToken1 = '';
  let dmName = '';
  beforeEach(() => {
    const globalOwner = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    globalUID = globalOwner.authUserId;
    globalToken = globalOwner.token;
    const user1 = authRegister('zh@outlook.com', '1234567', 'Zac', 'Hong');
    userId1 = user1.authUserId;
    userToken1 = user1.token;
    dmId = dmCreate(globalToken, [userId1]).dmId;
    dmName = dmDetails(globalToken, dmId).name;
  });

  test('Tag: A single Tag', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    messageSendDm(globalToken, dmId, 'Welcome to COMM1180 @' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' tagged you in ' + dmName + ': Welcome to COMM1180 '
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
  });

  test('Tag: Multiple tags, one tag per message', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    messageSendDm(globalToken, dmId, 'Welcome to COMM1180 @' + userHandle);
    messageSendDm(globalToken, dmId, '@' + userHandle + ' Congrats on your achievements');
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' tagged you in ' + dmName + ': @' + userHandle + ' Congrats on'
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' tagged you in ' + dmName + ': Welcome to COMM1180 '
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
  });

  test('Tag: Multiple tags in a single message (each tag tags a distinct person)', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    messageSendDm(globalToken, dmId, 'Welcome to COMM1180 @' + userHandle + '@' + globalHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' tagged you in ' + dmName + ': Welcome to COMM1180 '
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
    expect(notificationsGet(globalToken)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' tagged you in ' + dmName + ': Welcome to COMM1180 '
          },
        ]
      }
    );
  });

  test('Tag: Invalid handle', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    messageSendDm(globalToken, dmId, 'Welcome to COMM1180 @' + userHandle + '1');
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
  });

  test('Tag: User is not added to the DM', () => {
    const user2 = authRegister('ww@outlook.com', '1234567', 'W', 'W');
    const userId2 = user2.authUserId;
    const userToken2 = user2.token;
    const userHandle2: string = userProfile(globalToken, userId2).user.handleStr;
    messageSendDm(globalToken, dmId, 'Welcome to COMM1180 @' + userHandle2);
    expect(notificationsGet(userToken2)).toStrictEqual({ notifications: [] });
  });

  test('Tag: User was in the DM, but is removed', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    dmLeave(userToken1, dmId);
    messageSendDm(globalToken, dmId, 'Welcome to COMM1180 @' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
  });

  test('Tag: User tag themselves', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    messageSendDm(userToken1, dmId, 'Welcome to COMM1180 @' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: userHandle + ' tagged you in ' + dmName + ': Welcome to COMM1180 '
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
  });

  test('Tag: Same valid tag appears multiple times in a single message', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    messageSendDm(globalToken, dmId, 'Welcome to COMM1180 @' + userHandle + '@' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' tagged you in ' + dmName + ': Welcome to COMM1180 '
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
  });

  test('Tag: Messages are edited to contain tags', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    const messageId = messageSendDm(globalToken, dmId, 'Welcome to COMM1180 ').messageId;
    messageEdit(globalToken, messageId, 'Welcome to COMM1180 @' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' tagged you in ' + dmName + ': Welcome to COMM1180 '
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
  });

  // test commented out because message/share is not implemented
  /*
  test('Tag: message/share optional message contains tags', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    const messageId = messageSendDm(globalToken, dmId, 'Welcome to COMM1180 ').messageId;
    messageShare(globalToken, messageId, '@' + userHandle, -1, dmId);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: expect.any(string)
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
  });
  */

  test('Tag: tagged message is edited', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    const messageId = messageSendDm(globalToken, dmId, 'Welcome to COMM1180 @' + userHandle).messageId;
    messageEdit(globalToken, messageId, 'Welcome to COMM1180 Everyone!');
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' tagged you in ' + dmName + ': Welcome to COMM1180 '
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
  });

  test('Tag: tagged message is removed', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    const messageId = messageSendDm(globalToken, dmId, 'Welcome to COMM1180 @' + userHandle).messageId;
    messageRemove(globalToken, messageId);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' tagged you in ' + dmName + ': Welcome to COMM1180 '
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
  });

  test('React: React to a message', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const messageId = messageSendDm(globalToken, dmId, 'Welcome to COMM1170!').messageId;
    messageReact(userToken1, messageId, 1);
    expect(notificationsGet(globalToken)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: userHandle + ' reacted to your message in ' + dmName,
          }
        ]
      }
    );
  });

  test('React: React to a message then message is unreacted', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const messageId = messageSendDm(globalToken, dmId, 'Welcome to COMM1170!').messageId;
    messageReact(userToken1, messageId, 1);
    messageUnreact(userToken1, messageId, 1);
    expect(notificationsGet(globalToken)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: userHandle + ' reacted to your message in ' + dmName,
          }
        ]
      }
    );
  });

  test('React: user is no longer in the DM', () => {
    const messageId = messageSendDm(userToken1, dmId, 'Bye guys!').messageId;
    const globalHandle: string = userProfile(globalToken, globalUID).user.handleStr;
    dmLeave(userToken1, dmId);
    messageReact(globalToken, messageId, 1);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          }
        ]
      }
    );
  });
});

describe('Notification during & after standup', () => {
  let globalToken = '';
  let globalUID = 0;
  let channelId = 0;
  let userId1 = 0;
  let userToken1 = '';
  beforeEach(() => {
    const globalOwner = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    globalToken = globalOwner.token;
    globalUID = globalOwner.authUserId;
    channelId = channelsCreate(globalToken, 'channel1', true).channelId;
    const user1 = authRegister('zh@outlook.com', '1234567', 'Zac', 'Hong');
    userId1 = user1.authUserId;
    userToken1 = user1.token;
    channelInvite(globalToken, channelId, userId1);
  });

  test('Tag: DM message send notification to user despite during stand up', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const dmId = dmCreate(globalToken, [userId1]).dmId;
    const dmName = dmDetails(globalToken, dmId).name;
    const globalHandle = userProfile(globalToken, globalUID).user.handleStr;
    standupStart(globalToken, channelId, 3);
    messageSendDm(globalToken, dmId, "Hey bro how's it going? @" + userHandle);
    // notification send during standup
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' tagged you in ' + dmName + ": Hey bro how's it goi",
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: globalHandle + ' added you to ' + dmName,
          },
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          },
        ]
      }
    );
  });

  test('Tag: No standup message notification sent to user during & after standup', () => {
    const userHandle: string = userProfile(userToken1, userId1).user.handleStr;
    const globalHandle = userProfile(globalToken, globalUID).user.handleStr;
    standupStart(globalToken, channelId, 2);
    standupSend(globalToken, channelId, 'YO @' + userHandle);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          },
        ]
      }
    );
    sleep(3);
    expect(notificationsGet(userToken1)).toStrictEqual(
      {
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: globalHandle + ' added you to channel1',
          },
        ]
      }
    );
  });
});
