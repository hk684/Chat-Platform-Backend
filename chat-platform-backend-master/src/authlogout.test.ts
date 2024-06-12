import { authLogout, clear, channelsList, authRegister } from './testHelpers';

beforeEach(() => {
  clear();
});

describe('Testing authLogout error case', () => {
  test('Error case 1: Invalid token', () => {
    const token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
    expect(authLogout(token + 'hi')).toStrictEqual(403);
  });
});

describe('Testing authLogout correct return type', () => {
  let token = '';
  beforeEach(() => {
    token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
  });
  test('Correct Return Type', () => {
    expect(authLogout(token)).toStrictEqual({});
  });
  test('Correct functionality', () => {
    authLogout(token);
    expect(channelsList(token)).toStrictEqual(403);
  });
});
