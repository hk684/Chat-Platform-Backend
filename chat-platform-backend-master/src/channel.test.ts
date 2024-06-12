import { channelJoin, channelInvite, channelMessages, channelDetails, channelsCreate, authRegister, clear, messageSend, channelLeave, channelAddOwner, channelRemoveOwner } from './testHelpers';
import { profile } from './returnTypes';

beforeEach(() => {
  clear();
});
describe('channelJoin basic errors testing', () => {
  let userToken: string;
  let channelId: number;
  let userToken2: string;
  beforeEach(() => {
    userToken = authRegister('muh@buh.com', 'hahahaha', 'hai', 'hello').token;
    channelId = channelsCreate(userToken, 'new channel', true).channelId;
    userToken2 = authRegister('muh2@buh.com', 'hahahaha', 'hai', 'hello').token;
  });

  test('user token does not exist', () => {
    expect(channelJoin(userToken2 + 'a', channelId)).toStrictEqual(403);
  });

  test('channel id does not exist', () => {
    expect(channelJoin(userToken2, channelId + 1)).toStrictEqual(400);
  });

  test('channel id refers to a private channel and user is not a global owner', () => {
    const channel2 = channelsCreate(userToken, 'new channel', false);
    const user2 = authRegister('muh3@buh.com', 'hahahaha', 'hai', 'hello');
    expect(channelJoin(user2.token, channel2.channelId)).toStrictEqual(403);
  });

  test('user is already a member of the channel', () => {
    channelJoin(userToken2, channelId);
    expect(channelJoin(userToken2, channelId)).toStrictEqual(400);
  });
});

describe('channelJoin functionality testing', () => {
  let channelId: number;
  let userToken: string;
  let userId: number;
  beforeEach(() => {
    const user = authRegister('muh@buh.com', 'hahahaha', 'hai', 'hello');
    userToken = user.token;
    userId = user.authUserId;
    channelId = channelsCreate(userToken, 'new channel', true).channelId;
  });
  test('channel join adds user to channel', () => {
    const user2 = authRegister('muh2@buh.com', 'hahahaha', 'hai', 'hello');
    const userToken2 = user2.token;
    const userId2 = user2.authUserId;
    channelJoin(userToken2, channelId);
    expect(channelDetails(userToken, channelId).allMembers).toStrictEqual([{
      uId: userId,
      email: 'muh@buh.com',
      nameFirst: 'hai',
      nameLast: 'hello',
      handleStr: 'haihello'
    }, {
      uId: userId2,
      email: 'muh2@buh.com',
      nameFirst: 'hai',
      nameLast: 'hello',
      handleStr: 'haihello0'
    }]);
  });
});

describe('channelInvite given error cases testing', () => {
  let channelId: number;
  let userToken: string;
  let userId: number;
  let userToken2: string;
  let userId2: number;
  beforeEach(() => {
    const user = authRegister('muh@buh.com', 'hahahaha', 'hai', 'hello');
    userToken = user.token;
    userId = user.authUserId;
    const user2 = authRegister('muh3@buh.com', 'hahahaha', 'hai', 'hello');
    userToken2 = user2.token;
    userId2 = user2.authUserId;
    channelId = channelsCreate(userToken, 'new channel', true).channelId;
  });

  test('user token does not exist', () => {
    expect(channelInvite(userToken2 + 'a', channelId, userId)).toStrictEqual(403);
  });

  test('invited user id does not exist', () => {
    expect(channelInvite(userToken, channelId, userId2 + 1)).toStrictEqual(400);
  });

  test('channel id does not exist', () => {
    expect(channelInvite(userToken, channelId + 1, userId2)).toStrictEqual(400);
  });

  test('invited user is already part of the channel', () => {
    expect(channelInvite(userToken, channelId, userId)).toStrictEqual(400);
  });

  test('auth user is not a member of the channel', () => {
    expect(channelInvite(userToken2, channelId, userId2)).toStrictEqual(403);
  });
});

describe('channelInvite functionality testing', () => {
  let channelId: number;
  let userToken: string;
  let userId2: number;
  let userId: number;
  beforeEach(() => {
    const user = authRegister('muh@buh.com', 'hahahaha', 'hai', 'hello');
    userToken = user.token;
    userId = user.authUserId;
    userId2 = authRegister('muh3@buh.com', 'hahahaha', 'hai', 'hello').authUserId;
    channelId = channelsCreate(userToken, 'new channel', true).channelId;
  });

  test('channel invite adds user to channel', () => {
    channelInvite(userToken, channelId, userId2);
    expect(channelDetails(userToken, channelId).allMembers).toStrictEqual([{
      uId: userId,
      email: 'muh@buh.com',
      nameFirst: 'hai',
      nameLast: 'hello',
      handleStr: 'haihello'
    }, {
      uId: userId2,
      email: 'muh3@buh.com',
      nameFirst: 'hai',
      nameLast: 'hello',
      handleStr: 'haihello0'
    }]);
  });
});

describe('channelMessages given errors and return type testing', () => {
  let channelId: number;
  let userToken: string;
  beforeEach(() => {
    userToken = authRegister('muh@buh.com', 'hahahaha', 'hai', 'hello').token;
    channelId = channelsCreate(userToken, 'new channel', true).channelId;
  });

  test('user token is not valid', () => {
    expect(channelMessages(userToken + 1, channelId, 0)).toStrictEqual(403);
  });

  test('channel id does not exist', () => {
    expect(channelMessages(userToken, channelId + 1, 0)).toStrictEqual(400);
  });

  test('user is not in channel', () => {
    const user2 = authRegister('muh2@buh.com', 'hahahaha', 'hai', 'hello');
    expect(channelMessages(user2.token, channelId, 0)).toStrictEqual(403);
  });

  test('start is greater than total number of messages in the channel', () => {
    expect(channelMessages(userToken, channelId, 2)).toStrictEqual(400);
  });

  test('start is equal to total number of messages in the channel', () => {
    expect(channelMessages(userToken, channelId, 0)).toStrictEqual({ messages: [], start: 0, end: -1 });
  });
});

describe('channelMessages return type testing', () => {
  let channelId: number;
  let userToken: string;
  let userId: number;
  beforeEach(() => {
    const user = authRegister('muh@buh.com', 'hahahaha', 'hai', 'hello');
    userToken = user.token;
    userId = user.authUserId;
    channelId = channelsCreate(userToken, 'new channel', true).channelId;
  });

  test('singular message', () => {
    const messageId = messageSend(userToken, channelId, 'buh').messageId;
    expect(channelMessages(userToken, channelId, 0)).toStrictEqual({
      messages: [{
        messageId: messageId,
        uId: userId,
        message: 'buh',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false
      }],
      start: 0,
      end: -1
    });
  });

  test('52 messages', () => {
    const messageIdArray: number[] = [];
    for (let i = 0; i <= 51; i++) {
      messageIdArray.push(messageSend(userToken, channelId, 'buh').messageId);
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
    expect(channelMessages(userToken, channelId, 0)).toStrictEqual({
      messages: expectedOutput,
      start: 0,
      end: 50
    });
  });
});

describe('Testing channelDetails Error Cases', () => {
  let userToken: string;
  let channelId: number;
  beforeEach(() => {
    userToken = authRegister('Liz@outlook.com', '1234567', 'Liz', 'Hong').token;
    channelId = channelsCreate(userToken, 'channel1', true).channelId;
  });
  test('Error Case 1: channelId does not refer to a valid channel', () => {
    expect(channelDetails(userToken, channelId + 1)).toStrictEqual(400);
  });
  test('Error Case 2: valid channelId but the authorised user is not a member of the channel', () => {
    const userToken2 = authRegister('hy@outlook.com', '123456', 'Libby', 'Hong').token;
    expect(channelDetails(userToken2, channelId)).toStrictEqual(403);
  });
  test('Error Case 3: token is invalid', () => {
    expect(channelDetails(userToken + 1, channelId)).toStrictEqual(403);
  });
});

describe('Testing channelDetails Correct Return Type', () => {
  let userToken: string;
  let userId: number;
  beforeEach(() => {
    const user = authRegister('Liz@outlook.com', '1234567', 'Liz', 'Hong');
    userToken = user.token;
    userId = user.authUserId;
  });
  test('Case 1: Authorised user is the only member of the channel', () => {
    const channelId = channelsCreate(userToken, 'channel1', true).channelId;
    expect(channelDetails(userToken, channelId)).toStrictEqual(
      {
        name: 'channel1',
        isPublic: true,
        ownerMembers: [{
          uId: userId,
          email: 'Liz@outlook.com',
          nameFirst: 'Liz',
          nameLast: 'Hong',
          handleStr: 'lizhong'
        }],
        allMembers: [{
          uId: userId,
          email: 'Liz@outlook.com',
          nameFirst: 'Liz',
          nameLast: 'Hong',
          handleStr: 'lizhong'
        }]
      }
    );
  });

  test('Case 2: Authorised user is a member (but not owner) of a private channel', () => {
    const channelId = channelsCreate(userToken, 'channel1', false).channelId;
    const user2 = authRegister('hy@outlook.com', '7654321', 'Ash', 'Zheng');
    const userId2 = user2.authUserId;
    const userToken2 = user2.token;
    channelInvite(userToken, channelId, userId2);
    const expectedOutput = {
      name: 'channel1',
      isPublic: false,
      ownerMembers: [{
        uId: userId,
        email: 'Liz@outlook.com',
        nameFirst: 'Liz',
        nameLast: 'Hong',
        handleStr: 'lizhong'
      }],
      allMembers: [{
        uId: userId,
        email: 'Liz@outlook.com',
        nameFirst: 'Liz',
        nameLast: 'Hong',
        handleStr: 'lizhong'
      },
      {
        uId: userId2,
        email: 'hy@outlook.com',
        nameFirst: 'Ash',
        nameLast: 'Zheng',
        handleStr: 'ashzheng'
      }]
    };
    expectedOutput.allMembers.sort((a: profile, b: profile) => a.uId - b.uId);
    const actualOutput = channelDetails(userToken2, channelId);
    actualOutput.allMembers.sort((a: profile, b: profile) => a.uId - b.uId);
    expect(actualOutput).toStrictEqual(expectedOutput);
  });

  test('Case 3: Authorised user is a member (but not owner) of a public channel', () => {
    const channelId = channelsCreate(userToken, 'channel1', true).channelId;
    const user2 = authRegister('hy@outlook.com', '7654321', 'Ash', 'Zheng');
    const userId2 = user2.authUserId;
    channelInvite(userToken, channelId, userId2);
    const expectedOutput = {
      name: 'channel1',
      isPublic: true,
      ownerMembers: [{
        uId: userId,
        email: 'Liz@outlook.com',
        nameFirst: 'Liz',
        nameLast: 'Hong',
        handleStr: 'lizhong'
      }],
      allMembers: [{
        uId: userId,
        email: 'Liz@outlook.com',
        nameFirst: 'Liz',
        nameLast: 'Hong',
        handleStr: 'lizhong'
      },
      {
        uId: userId2,
        email: 'hy@outlook.com',
        nameFirst: 'Ash',
        nameLast: 'Zheng',
        handleStr: 'ashzheng'
      }]
    };
    expectedOutput.allMembers.sort((a: profile, b: profile) => a.uId - b.uId);
    const actualOutput = channelDetails(userToken, channelId);
    actualOutput.allMembers.sort((a: profile, b: profile) => a.uId - b.uId);
    expect(actualOutput).toStrictEqual(expectedOutput);
  });

  test('Case 4: Authorised user is the owner of a channel and is not the only member in the channel', () => {
    const channelId = channelsCreate(userToken, 'channel1', false).channelId;
    const userId2 = authRegister('hy@outlook.com', '7654321', 'Ash', 'Zheng').authUserId;
    channelInvite(userToken, channelId, userId2);
    const expectedOutput = {
      name: 'channel1',
      isPublic: false,
      ownerMembers: [{
        uId: userId,
        email: 'Liz@outlook.com',
        nameFirst: 'Liz',
        nameLast: 'Hong',
        handleStr: 'lizhong'
      }],
      allMembers: [{
        uId: userId,
        email: 'Liz@outlook.com',
        nameFirst: 'Liz',
        nameLast: 'Hong',
        handleStr: 'lizhong'
      },
      {
        uId: userId2,
        email: 'hy@outlook.com',
        nameFirst: 'Ash',
        nameLast: 'Zheng',
        handleStr: 'ashzheng'
      }]
    };
    expectedOutput.allMembers.sort((a: profile, b: profile) => a.uId - b.uId);
    const actualOutput = channelDetails(userToken, channelId);
    actualOutput.allMembers.sort((a: profile, b: profile) => a.uId - b.uId);
    expect(actualOutput).toStrictEqual(expectedOutput);
  });
});

describe('channel leave given errors testing', () => {
  let userToken: string;
  let channelId: number;
  beforeEach(() => {
    userToken = authRegister('Liz@outlook.com', '1234567', 'Liz', 'Hong').token;
    channelId = channelsCreate(userToken, 'channel1', true).channelId;
  });
  test('user is not in channel', () => {
    const userToken2 = authRegister('Liz2@outlook.com', '1234567', 'Liz', 'Hong').token;
    expect(channelLeave(userToken2, channelId)).toStrictEqual(403);
  });
  test('channelId does not exist', () => {
    expect(channelLeave(userToken, channelId + 1)).toStrictEqual(400);
  });
  test('invalid token', () => {
    expect(channelLeave(userToken + 'a', channelId)).toStrictEqual(403);
  });
});

describe('channel leave functionality test', () => {
  let userToken: string;
  let channelId: number;
  beforeEach(() => {
    userToken = authRegister('Liz@outlook.com', '1234567', 'Liz', 'Hong').token;
    channelId = channelsCreate(userToken, 'channel1', true).channelId;
  });
  test('channel leave return type on success', () => {
    const userToken2 = authRegister('Liz2@outlook.com', '1234567', 'Liz', 'Hong').token;
    channelJoin(userToken2, channelId);
    expect(channelLeave(userToken2, channelId)).toStrictEqual({});
  });

  test('channel leave removes user from channel', () => {
    channelLeave(userToken, channelId);
    expect(channelDetails(userToken, channelId)).toStrictEqual(403);
  });
});

describe('channnel addowner given error cases', () => {
  let userToken: string;
  let channelId: number;
  let userId2: number;
  let userToken2: string;
  beforeEach(() => {
    userToken = authRegister('Liz@outlook.com', '1234567', 'Liz', 'Hong').token;
    channelId = channelsCreate(userToken, 'channel1', true).channelId;
    const user2 = authRegister('Liz2@outlook.com', '1234567', 'yo', 'mate');
    userId2 = user2.authUserId;
    userToken2 = user2.token;
    channelInvite(userToken, channelId, userId2);
  });
  test('invalid token', () => {
    expect(channelAddOwner(userToken + 'a', channelId, userId2)).toStrictEqual(403);
  });
  test('invalid user id', () => {
    expect(channelAddOwner(userToken, channelId, userId2 + 1)).toStrictEqual(400);
  });
  test('invalid channel id', () => {
    expect(channelAddOwner(userToken, channelId + 1, userId2)).toStrictEqual(400);
  });
  test('uId refers to a user who is not in channel', () => {
    const userId3 = authRegister('Liz3@outlook.com', '1234567', 'hello', 'matey').authUserId;
    expect(channelAddOwner(userToken, channelId, userId3)).toStrictEqual(400);
  });
  test('uId refers to a user who isalready an owner of the channel', () => {
    channelAddOwner(userToken, channelId, userId2);
    expect(channelAddOwner(userToken, channelId, userId2)).toStrictEqual(400);
  });
  test('token refers to user who does not have permissions in channel', () => {
    expect(channelAddOwner(userToken2, channelId, userId2)).toStrictEqual(403);
  });
});

describe('channel addowner implementation test', () => {
  let userToken: string;
  let userId: number;
  let channelId: number;
  let userId2: number;
  beforeEach(() => {
    const user = authRegister('Liz@outlook.com', '1234567', 'Liz', 'Hong');
    userToken = user.token;
    userId = user.authUserId;
    channelId = channelsCreate(userToken, 'channel1', true).channelId;
    userId2 = authRegister('Liz2@outlook.com', '1234567', 'yo', 'mate').authUserId;
    channelInvite(userToken, channelId, userId2);
  });
  test('correct return type on no error', () => {
    expect(channelAddOwner(userToken, channelId, userId2)).toStrictEqual({});
  });
  test('function correctly adds user as an owner', () => {
    channelAddOwner(userToken, channelId, userId2);
    expect(channelDetails(userToken, channelId)).toStrictEqual({
      name: 'channel1',
      isPublic: true,
      ownerMembers: [{
        uId: userId,
        email: 'Liz@outlook.com',
        nameFirst: 'Liz',
        nameLast: 'Hong',
        handleStr: 'lizhong'
      }, {
        uId: userId2,
        email: 'Liz2@outlook.com',
        nameFirst: 'yo',
        nameLast: 'mate',
        handleStr: 'yomate'
      }],
      allMembers: [{
        uId: userId,
        email: 'Liz@outlook.com',
        nameFirst: 'Liz',
        nameLast: 'Hong',
        handleStr: 'lizhong'
      }, {
        uId: userId2,
        email: 'Liz2@outlook.com',
        nameFirst: 'yo',
        nameLast: 'mate',
        handleStr: 'yomate'
      }]
    });
  });
});

describe('channel remove owner given error cases', () => {
  let userToken: string;
  let channelId: number;
  let userId2: number;
  let userToken2: string;
  let userId: number;
  beforeEach(() => {
    const user = authRegister('Liz@outlook.com', '1234567', 'Liz', 'Hong');
    userToken = user.token;
    userId = user.authUserId;

    const user2 = authRegister('Liz2@outlook.com', '1234567', 'yo', 'mate');
    userId2 = user2.authUserId;
    userToken2 = user2.token;

    channelId = channelsCreate(userToken, 'channel1', true).channelId;
    channelInvite(userToken, channelId, userId2);
    channelAddOwner(userToken, channelId, userId2);
  });
  test('invalid token', () => {
    expect(channelRemoveOwner(userToken + 'a', channelId, userId2)).toStrictEqual(403);
  });
  test('invalid user id', () => {
    expect(channelRemoveOwner(userToken, channelId, userId2 + 1)).toStrictEqual(400);
  });
  test('invalid channel id', () => {
    expect(channelRemoveOwner(userToken, channelId + 1, userId2)).toStrictEqual(400);
  });
  test('user id refers to user who is not an owner of the channel', () => {
    channelRemoveOwner(userToken, channelId, userId2);
    expect(channelRemoveOwner(userToken, channelId, userId2)).toStrictEqual(400);
  });
  test('user id refers to the last owner of a channel', () => {
    channelRemoveOwner(userToken, channelId, userId2);
    expect(channelRemoveOwner(userToken, channelId, userId)).toStrictEqual(400);
  });
  test('token refers to user that does not have permissions in the channel', () => {
    channelRemoveOwner(userToken, channelId, userId2);
    expect(channelRemoveOwner(userToken2, channelId, userId)).toStrictEqual(403);
  });
});

describe('channel remove owner implementation tests', () => {
  let userToken: string;
  let channelId: number;
  let userId2: number;
  let userId: number;
  beforeEach(() => {
    const user = authRegister('Liz@outlook.com', '1234567', 'Liz', 'Hong');
    userToken = user.token;
    userId = user.authUserId;

    const user2 = authRegister('Liz2@outlook.com', '1234567', 'yo', 'mate');
    userId2 = user2.authUserId;

    channelId = channelsCreate(userToken, 'channel1', true).channelId;
    channelInvite(userToken, channelId, userId2);
    channelAddOwner(userToken, channelId, userId2);
  });
  test('returns correct type on success', () => {
    expect(channelRemoveOwner(userToken, channelId, userId2)).toStrictEqual({});
  });
  test('correctly removes owner from channel', () => {
    channelRemoveOwner(userToken, channelId, userId2);
    expect(channelDetails(userToken, channelId)).toStrictEqual({
      name: 'channel1',
      isPublic: true,
      ownerMembers: [{
        uId: userId,
        email: 'Liz@outlook.com',
        nameFirst: 'Liz',
        nameLast: 'Hong',
        handleStr: 'lizhong'
      }],
      allMembers: [{
        uId: userId,
        email: 'Liz@outlook.com',
        nameFirst: 'Liz',
        nameLast: 'Hong',
        handleStr: 'lizhong'
      }, {
        uId: userId2,
        email: 'Liz2@outlook.com',
        nameFirst: 'yo',
        nameLast: 'mate',
        handleStr: 'yomate'
      }]
    });
  });
});
