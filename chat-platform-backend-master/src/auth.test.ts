import { clear, authRegister, authLogin, authPasswordResetRequest, channelsCreate, authPasswordReset } from './testHelpers';

beforeEach(() => {
  clear();
});

describe('HTTP Tests for authRegisterV1 return type and error testing', () => {
  test.each([
    { email: 'buh@muh.com', password: 'abeushun', nameFirst: 'hmm', nameLast: 'noo' }
  ])('register returns a number', ({ email, password, nameFirst, nameLast }) => {
    expect(authRegister(email, password, nameFirst, nameLast)).toStrictEqual({
      token: expect.any(String),
      authUserId: expect.any(Number)
    });
  });

  test.each([
    { email: '@'.repeat(10), password: 'abeushun', nameFirst: 'hmm', nameLast: 'noo' },
    { email: 'not a valid email', password: 'abeushun', nameFirst: 'hmm', nameLast: 'noo' },
    { email: 'rat '.repeat(15), password: 'abeushun', nameFirst: 'hmm', nameLast: 'noo' }
  ])('invalid email', ({ email, password, nameFirst, nameLast }) => {
    expect(authRegister(email, password, nameFirst, nameLast)).toStrictEqual(400);
  });

  test.each([
    { email: 'buh@muh.com', password: 'a', nameFirst: 'hmm', nameLast: 'noo' },
    { email: 'buh@muh2.com', password: ' ', nameFirst: 'hmm', nameLast: 'noo' },
    { email: 'buh@muh3.com', password: '...', nameFirst: 'hmm', nameLast: 'noo' }
  ])('password too short', ({ email, password, nameFirst, nameLast }) => {
    expect(authRegister(email, password, nameFirst, nameLast)).toStrictEqual(400);
  });

  test.each([
    { email: 'buh@muh4.com', password: 'abeushun', nameFirst: '', nameLast: 'noo' }
  ])('first name is empty', ({ email, password, nameFirst, nameLast }) => {
    expect(authRegister(email, password, nameFirst, nameLast)).toStrictEqual(400);
  });

  test.each([
    { email: 'buh@muh5.com', password: 'abeushun', nameFirst: 'hmm', nameLast: '' }
  ])('last name is empty', ({ email, password, nameFirst, nameLast }) => {
    expect(authRegister(email, password, nameFirst, nameLast)).toStrictEqual(400);
  });

  test.each([
    { email: 'buh@muh5.com', password: 'abeushun', nameFirst: 'hmm', nameLast: 'noo' }
  ])('two users with same email', ({ email, password, nameFirst, nameLast }) => {
    authRegister('buh@muh5.com', 'burhent', 'oh nooo', 'thats right!');
    expect(authRegister(email, password, nameFirst, nameLast)).toStrictEqual(400);
  });

  test.each([
    { email: 'buh@muh6.com', password: 'abeushun', nameFirst: ('a').repeat(51), nameLast: 'noo' },
    { email: 'buh@muh7.com', password: 'abeushun', nameFirst: 'hmm', nameLast: ('a').repeat(51) },
    { email: 'buh@muh8.com', password: 'abeushun', nameFirst: ('a').repeat(51), nameLast: ('a').repeat(51) }
  ])('either name is larger than 50 characters long', ({ email, password, nameFirst, nameLast }) => {
    expect(authRegister(email, password, nameFirst, nameLast)).toStrictEqual(400);
  });
});

describe('authLoginV1 return type and error testing', () => {
  beforeEach(() => {
    authRegister('buh@muh.com', 'abeushun', 'ow oh oucch', 'aargh');
  });
  test('email entered does not belong to a user', () => {
    expect(authLogin('buh@no.no', 'abeushun')).toStrictEqual(400);
  });
  test('incorrect password', () => {
    expect(authLogin('buh@muh.com', 'mmmmmmmmm')).toStrictEqual(400);
  });
  test('authloginV1 returns a number on successful login', () => {
    expect(authLogin('buh@muh.com', 'abeushun')).toStrictEqual({ token: expect.any(String), authUserId: expect.any(Number) });
  });
});

describe('auth password reset', () => {
  test('auth password reset request logs the user out for all sessions', () => {
    const token1 = authRegister('david.dai@student.unsw.edu.au', 'ejafsgd', 'hello', 'mate').token;
    const token2 = authLogin('david.dai@student.unsw.edu.au', 'ejafsgd').token;
    const token3 = authLogin('david.dai@student.unsw.edu.au', 'ejafsgd').token;
    const token4 = authLogin('david.dai@student.unsw.edu.au', 'ejafsgd').token;
    authPasswordResetRequest('david.dai@student.unsw.edu.au');
    expect(channelsCreate(token1, 'buh', false)).toStrictEqual(403);
    expect(channelsCreate(token2, 'buh', false)).toStrictEqual(403);
    expect(channelsCreate(token3, 'buh', false)).toStrictEqual(403);
    expect(channelsCreate(token4, 'buh', false)).toStrictEqual(403);
  });
  test('auth password reset request does not throw error when email is incorrect', () => {
    authPasswordResetRequest('david.dai@student.unsw.edu.au');
  });
  test('auth password reset reset password too short', () => {
    authRegister('david.dai@student.unsw.edu.au', 'ejafsgd', 'hello', 'mate');
    expect(authPasswordReset('idk', 'idk')).toStrictEqual(400);
  });
  test('auth password reset reset invalid reset code', () => {
    authRegister('david.dai@student.unsw.edu.au', 'ejafsgd', 'hello', 'mate');
    expect(authPasswordReset('idk', 'afsgdfhj')).toStrictEqual(400);
  });
});
