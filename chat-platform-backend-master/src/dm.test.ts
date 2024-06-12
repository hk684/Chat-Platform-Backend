import { authRegister, dmCreate, dmList, dmRemove, dmDetails, dmLeave, dmMessages, clear } from './testHelpers';

describe('HTTP Tests for /dm/create/v2', () => {
  beforeEach(() => {
    clear();
  });
  test('0.1 Error: Invalid uId, invalid token', () => {
    const user1 = authRegister('henry@gmail.com', 'examplepassword', 'Henry', 'Lan');
    const uIds = [user1.authUserId, user1.authUserId + 1];
    expect(dmCreate(user1.token, uIds)).toStrictEqual(400);
    expect(dmCreate('invalidtoken', [user1.authUserId])).toStrictEqual(403);
  });
  test('0.2 Error: Duplicate uIds', () => {
    const user1 = authRegister('henry@gmail.com', 'examplepassword', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const uIds = [user2.authUserId, user2.authUserId];
    expect(dmCreate(user1.token, uIds)).toStrictEqual(400);
  });
  test('0.3 Successful dmCreate', () => {
    const user1 = authRegister('henry@gmail.com', 'examplepassword', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const user3 = authRegister('john@gmail.com', 'password', 'John', 'Doe');
    const uIds = [user2.authUserId, user3.authUserId];
    expect(dmCreate(user1.token, uIds)).toStrictEqual({ dmId: expect.any(Number) });
  });
});

describe('HTTP Tests for /dm/list/v2', () => {
  beforeEach(() => {
    clear();
  });
  test('1.1 Error: Invalid token', () => {
    const dms = dmList('invalidtoken');
    expect(dms).toStrictEqual(403);
  });
  test('1.2 Success dmList', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const user3 = authRegister('john@gmail.com', 'password', 'John', 'Doe');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    const dm2 = dmCreate(user1.token, [user3.authUserId]);
    const dms = dmList(user1.token);
    expect(dms).toMatchObject({
      dms: [
        {
          dmId: dm1.dmId,
          name: 'henrylan, joemama',
        },
        {
          dmId: dm2.dmId,
          name: 'henrylan, johndoe',
        }
      ]
    });
    expect(dmList(user2.token)).toMatchObject({
      dms: [
        {
          dmId: dm1.dmId,
          name: 'henrylan, joemama',
        }
      ]
    });
  });
});

describe('HTTP Tests for /dm/remove/v2', () => {
  beforeEach(() => {
    clear();
  });
  test('2.1 Error: dmId is invalid', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmRemove(user1.token, dm1.dmId + 1)).toStrictEqual(400);
  });
  test('2.2 Error: dmId is valid but token does not belong to DM creator', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmRemove(user2.token, dm1.dmId)).toStrictEqual(403);
  });
  test('2.3 Error: dmId is valid but authorised user is not member of DM', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const user3 = authRegister('john@gmail.com', 'password', 'John', 'Doe');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmRemove(user3.token, dm1.dmId)).toStrictEqual(403);
  });
  test('2.4 Error: token is invalid', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmRemove('INVALIDTOKEN', dm1.dmId)).toStrictEqual(403);
  });
  test('3.1 Success dmRemove', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmRemove(user1.token, dm1.dmId)).toStrictEqual({});
  });
  test('3.2 Error: dmRemove twice', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    dmRemove(user1.token, dm1.dmId);
    expect(dmRemove(user1.token, dm1.dmId)).toStrictEqual(400);
  });
});

describe('HTTP Tests for /dm/details/v2', () => {
  beforeEach(() => {
    clear();
  });
  test('4.1 Error: dmId is invalid', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmDetails(user1.token, dm1.dmId + 1)).toStrictEqual(400);
  });
  test('4.2 Error: dmId is valid but authorised user is not member', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const user3 = authRegister('john@gmail.com', 'password', 'John', 'Doe');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmDetails(user3.token, dm1.dmId)).toStrictEqual(403);
  });
  test('4.3 Error: invalid token', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmDetails('invalidtoken', dm1.dmId)).toStrictEqual(403);
  });
  test('5.1 Success dmDetails', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmDetails(user1.token, dm1.dmId)).toStrictEqual(
      {
        name: 'henrylan, joemama',
        members: [
          {
            uId: user2.authUserId,
            email: 'joe@gmail.com',
            nameFirst: 'Joe',
            nameLast: 'Mama',
            handleStr: 'joemama'
          }
        ]
      }
    );
  });
});

describe('HTTP Tests for /dm/leave/v2', () => {
  beforeEach(() => {
    clear();
  });
  test('6.1 invalid token', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmLeave('invalidtoken', dm1.dmId)).toStrictEqual(403);
  });
  test('6.2 invalid dmid', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmLeave(user1.token, dm1.dmId + 1)).toStrictEqual(400);
  });
  test('6.3 valid token and dmid, authorised user does not member of the dm', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const user3 = authRegister('john@gmail.com', 'password', 'John', 'Doe');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmLeave(user3.token, dm1.dmId)).toStrictEqual(403);
  });
  test('7.1 Success dmLeave', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmLeave(user1.token, dm1.dmId)).toStrictEqual({});
  });
  test('7.2 Error: dmLeave twice', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const user3 = authRegister('john@gmail.com', 'password', 'John', 'Doe');
    const dm1 = dmCreate(user1.token, [user2.authUserId, user3.authUserId]);
    dmLeave(user1.token, dm1.dmId);
    expect(dmLeave(user1.token, dm1.dmId)).toStrictEqual(403);
    expect(dmDetails(user2.token, dm1.dmId)).toStrictEqual({
      name: 'henrylan, joemama, johndoe',
      members: [{
        uId: user3.authUserId,
        email: 'john@gmail.com',
        nameFirst: 'John',
        nameLast: 'Doe',
        handleStr: 'johndoe'
      }]
    });
  });
});

describe('HTTP Tests for /dm/messages/v2', () => {
  beforeEach(() => {
    clear();
  });
  test('8.1 invalid token', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmMessages('invalidtoken', dm1.dmId, 0)).toStrictEqual(403);
  });
  test('8.2 invalid dmid', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmMessages(user1.token, dm1.dmId + 1, 0)).toStrictEqual(400);
  });
  test('8.3 start greater than number of msgs', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmMessages(user1.token, dm1.dmId, 999)).toStrictEqual(400);
  });
  test('8.4 valid dmId, authorised user is not member of dm', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const user3 = authRegister('john@gmail.com', 'password', 'John', 'Doe');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmMessages(user3.token, dm1.dmId, 0)).toStrictEqual(403);
  });
  test('9.1 success dmMessages', () => {
    const user1 = authRegister('henry@gmail.com', 'password', 'Henry', 'Lan');
    const user2 = authRegister('joe@gmail.com', 'password', 'Joe', 'Mama');
    const dm1 = dmCreate(user1.token, [user2.authUserId]);
    expect(dmMessages(user1.token, dm1.dmId, 0)).toStrictEqual({ messages: [], start: 0, end: -1 });
  });
});
