import { clear, channelsCreate, channelDetails, authRegister, userProfile } from './testHelpers';

describe('clear testings', () => {
  test('Testing if clear clears all info in data.users & data.channels', () => {
    const userUd1 = authRegister('Liz@outlook.com', '123456', 'Liz', 'Hong').token;
    const channelId1 = channelsCreate(userUd1, 'channel1', true).channelId;
    clear();
    expect((userProfile(userUd1, userUd1))).toStrictEqual(403);
    expect((channelDetails(userUd1, channelId1))).toStrictEqual(403);
  });
  test('Testing correct return type', () => {
    expect(clear()).toStrictEqual({});
  });
});
