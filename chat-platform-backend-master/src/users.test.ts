import { userProfile, clear, authRegister, userProfileSetName, userProfileSetEmail, userProfileSetHandle, userProfileUploadPhoto } from './testHelpers';

beforeEach(() => {
  clear();
});

describe('Testing Error Cases', () => {
  test('check for invalid token', () => {
    const userId1 = authRegister('example@gmail.com', 'password', 'example1', 'example2').token;
    expect((userProfile(userId1 + 1, userId1))).toStrictEqual(403);
  });

  test('check if token Error cases', () => {
    const userId1 = authRegister('example@gmail.com', 'password', 'example1', 'example2').token;
    expect((userProfile(userId1, userId1 + 1))).toStrictEqual(400);
  });
});

describe('User Profile Testing for valid cases', () => {
  test("Viewing a person's own profile", () => {
    const user1 = authRegister('example2@gmail.com', 'password', 'example1', 'example2');
    const userToken = user1.token;
    const userId1 = user1.authUserId;
    expect((userProfile(userToken, userId1))).toStrictEqual({
      user: {
        uId: userId1,
        email: 'example2@gmail.com',
        nameFirst: 'example1',
        nameLast: 'example2',
        handleStr: 'example1example2',
        profileImgUrl: expect.any(String)
      }
    });
  });
  test("Viewing another person's profile", () => {
    const user1 = authRegister('example2@gmail.com', 'password', 'example1', 'example2');
    // const userToken = user1.token;
    const userId1 = user1.authUserId;
    const user2 = authRegister('example3@gmail.com', 'password1', 'example3', 'example4');
    const userToken2 = user2.token;
    expect((userProfile(userToken2, userId1))).toStrictEqual({
      user: {
        uId: userId1,
        email: 'example2@gmail.com',
        nameFirst: 'example1',
        nameLast: 'example2',
        handleStr: 'example1example2',
        profileImgUrl: expect.any(String),
      }
    });
  });
});

describe('/user/profile/setname error cases', () => {
  let token: string;
  beforeEach(() => {
    token = authRegister('example@gmail.com', 'password', 'example1', 'example2').token;
  });
  test('namefirs longer than 50 characters', () => {
    expect(userProfileSetName(token, ('a').repeat(510), 'a')).toStrictEqual(400);
  });

  test('namelast longer than 50 characters', () => {
    expect(userProfileSetName(token, 'a', ('a').repeat(510))).toStrictEqual(400);
  });

  test('namefirst empty', () => {
    expect(userProfileSetName(token, '', 'a')).toStrictEqual(400);
  });

  test('namelast empty', () => {
    expect(userProfileSetName(token, 'a', '')).toStrictEqual(400);
  });

  test('invalid token', () => {
    expect(userProfileSetName(token + 'a', 'a', 'a')).toStrictEqual(403);
  });
});

describe('/user/profile/setname functionality test', () => {
  let token: string;
  let userId: number;
  beforeEach(() => {
    const user = authRegister('example@gmail.com', 'password', 'example1', 'example2');
    token = user.token;
    userId = user.authUserId;
  });
  test('names are changed', () => {
    userProfileSetName(token, 'abuh', 'buunerf');
    expect(userProfile(token, userId)).toStrictEqual({
      user: {
        uId: userId,
        email: 'example@gmail.com',
        nameFirst: 'abuh',
        nameLast: 'buunerf',
        handleStr: 'example1example2',
        profileImgUrl: expect.any(String),
      }
    });
  });
});

describe('/user/profile/setemail error cases', () => {
  let token: string;
  beforeEach(() => {
    token = authRegister('example@gmail.com', 'password', 'example1', 'example2').token;
  });

  test('invalid email', () => {
    expect(userProfileSetEmail(token, 'aljksdfgd')).toStrictEqual(400);
  });

  test('invalid token', () => {
    expect(userProfileSetEmail(token + 'a', 'buj@lol.com')).toStrictEqual(403);
  });

  test('email taken by another user', () => {
    authRegister('example2@gmail.com', 'password2', 'example1', 'example2');
    expect(userProfileSetEmail(token, 'example2@gmail.com')).toStrictEqual(400);
  });
});

describe('/user/profile/setemail functionality test', () => {
  let token: string;
  let userId: number;
  beforeEach(() => {
    const user = authRegister('example@gmail.com', 'password', 'example1', 'example2');
    token = user.token;
    userId = user.authUserId;
  });
  test('email is changed', () => {
    userProfileSetEmail(token, 'abuh@gmail.com');
    expect(userProfile(token, userId)).toStrictEqual({
      user: {
        uId: userId,
        email: 'abuh@gmail.com',
        nameFirst: 'example1',
        nameLast: 'example2',
        handleStr: 'example1example2',
        profileImgUrl: expect.any(String),
      }
    });
  });
});

describe('/user/profile/sethandle error cases', () => {
  let token: string;
  beforeEach(() => {
    token = authRegister('example@gmail.com', 'password', 'example1', 'example2').token;
  });
  test('handle shorter thatn 3 characters', () => {
    expect(userProfileSetHandle(token, 'a')).toStrictEqual(400);
  });

  test('handle longer than 20 characters', () => {
    expect(userProfileSetHandle(token, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toStrictEqual(400);
  });

  test('handle taken by another user', () => {
    authRegister('example2@gmail.com', 'password2', 'lol', 'lmao');
    expect(userProfileSetHandle(token, 'lollmao')).toStrictEqual(400);
  });

  test('handle not alphanumeric', () => {
    expect(userProfileSetHandle(token, '😃🤓😩😶🫠😳💀')).toStrictEqual(400);
  });

  test('invalid token', () => {
    expect(userProfileSetHandle(token + 'a', 'goodhandle')).toStrictEqual(403);
  });
});

describe('/user/profile/handle functionality test', () => {
  let token: string;
  let userId: number;
  beforeEach(() => {
    const user = authRegister('example@gmail.com', 'password', 'example1', 'example2');
    token = user.token;
    userId = user.authUserId;
  });
  test('handle is changed', () => {
    userProfileSetHandle(token, 'lmaolmao');
    expect(userProfile(token, userId)).toStrictEqual({
      user: {
        uId: userId,
        email: 'example@gmail.com',
        nameFirst: 'example1',
        nameLast: 'example2',
        handleStr: 'lmaolmao',
        profileImgUrl: expect.any(String),
      }
    });
  });
});

describe('user profile set image given error cases', () => {
  let token: string;
  beforeEach(() => {
    const user = authRegister('example@gmail.com', 'password', 'example1', 'example2');
    token = user.token;
  });
  test('usertoken invalid', async () => {
    expect(userProfileUploadPhoto(token + 'a', '', 1, 2, 34, 5)).toStrictEqual(403);
  });
  test('imgUrl returns an error on request', async () => {
    expect(await userProfileUploadPhoto(token, 'https://lichess.org/blahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblah', 1, 2, 2, 3)).toStrictEqual(400);
  });
  test.each([
    { xStart: 75, yStart: 0, xEnd: 79, yEnd: 70 },
    { xStart: 0, yStart: 71, xEnd: 74, yEnd: 89 },
  ])('dimensions out of range of image', async ({ xStart, yStart, xEnd, yEnd }) => {
    // image dimensions 74x70
    const imgUrl = 'http://pikmin.wiki.gallery/images/f/f0/121.jpg';
    expect(await userProfileUploadPhoto(token, imgUrl, xStart, yStart, xEnd, yEnd)).toStrictEqual(400);
  });

  test.each([
    { xStart: 30, yStart: 0, xEnd: 15, yEnd: 70 },
    { xStart: 0, yStart: 30, xEnd: 74, yEnd: 15 },
    { xStart: 30, yStart: 0, xEnd: 30, yEnd: 70 },
    { xStart: 0, yStart: 30, xEnd: 74, yEnd: 30 },
  ])('end is less than or equal to start', async({ xStart, yStart, xEnd, yEnd }) => {
    // image dimensions 74x70
    const imgUrl = 'http://pikmin.wiki.gallery/images/f/f0/121.jpg';
    expect(await userProfileUploadPhoto(token, imgUrl, xStart, yStart, xEnd, yEnd)).toStrictEqual(400);
  });

  test('image is not a jpg', async () => {
    // image dimensions 40x40
    const imgUrl = 'http://pikmin.wiki.gallery/images/b/b3/Breadbug_icon.png';
    expect(await userProfileUploadPhoto(token, imgUrl, 0, 0, 40, 40));
  });
});

describe('user profile set image success', () => {
  let token: string;
  let userId: number;
  beforeEach(() => {
    const user = authRegister('example@gmail.com', 'password', 'example1', 'example2');
    token = user.token;
    userId = user.authUserId;
  });
  test('user profile image actually changes', async() => {
    const oldImage = userProfile(token, userId).user.profileImgUrl;
    // image dimensions 74x70
    const imgUrl = 'http://pikmin.wiki.gallery/images/f/f0/121.jpg';
    await userProfileUploadPhoto(token, imgUrl, 0, 0, 60, 60);
    expect(userProfile(token, userId).user.profileImgUrl).not.toEqual(oldImage);
  });
});
