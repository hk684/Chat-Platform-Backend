import { usersAll, clear, authRegister } from './testHelpers';
import { profile } from './returnTypes';

beforeEach(() => {
  clear();
});

describe('Testing usersAll error case', () => {
  test('Error case 1: Invalid token', () => {
    const token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
    expect(usersAll(token + 'hi')).toStrictEqual(403);
  });
});

describe('Testing usersAll correct return type', () => {
  let token1 = '';
  let uId1 = 1;
  beforeEach(() => {
    const returnedObject1 = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang');
    token1 = returnedObject1.token;
    uId1 = returnedObject1.authUserId;
  });
  test('Case 1: A single user', () => {
    expect(usersAll(token1)).toStrictEqual(
      {
        users: [
          {
            uId: uId1,
            email: 'hywang@outlook.com',
            nameFirst: 'Hailey',
            nameLast: 'Wang',
            handleStr: 'haileywang'
          }
        ]
      }
    );
  });
  test('Case 2: Multiple users', () => {
    const returnedObject2 = authRegister('liz@outlook.com', '123456', 'Liz', 'Wang');
    const token2 = returnedObject2.token;
    const uId2 = returnedObject2.authUserId;
    const uId3 = authRegister('jaz@outlook.com', '123456', 'Jaz', 'Hong').authUserId;
    const expectedOutput = {
      users: [
        {
          uId: uId1,
          email: 'hywang@outlook.com',
          nameFirst: 'Hailey',
          nameLast: 'Wang',
          handleStr: 'haileywang'
        },
        {
          uId: uId2,
          email: 'liz@outlook.com',
          nameFirst: 'Liz',
          nameLast: 'Wang',
          handleStr: 'lizwang'
        },
        {
          uId: uId3,
          email: 'jaz@outlook.com',
          nameFirst: 'Jaz',
          nameLast: 'Hong',
          handleStr: 'jazhong'
        },
      ],
    };
    expectedOutput.users.sort((a: profile, b: profile) => a.uId - b.uId);
    const actualOutput1 = usersAll(token1);
    actualOutput1.users.sort((a: profile, b: profile) => a.uId - b.uId);
    const actualOutput2 = usersAll(token2);
    actualOutput2.users.sort((a: profile, b: profile) => a.uId - b.uId);
    expect(actualOutput1).toStrictEqual(expectedOutput);
    expect(actualOutput2).toStrictEqual(expectedOutput);
  });
});
