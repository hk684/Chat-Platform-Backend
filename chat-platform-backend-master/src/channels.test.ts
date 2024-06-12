import { authRegister, channelsCreate, channelsList, channelsListAll, clear } from './testHelpers';

type channel = {channelId: number, name: string};

beforeEach(() => {
  clear();
});

describe('Testing channelsCreateV1 Error Cases', () => {
  let token = '';
  beforeEach(() => {
    token = authRegister('Liz@outlook.com', '1234567', 'ABCD', 'EFG').token;
  });
  test('Error Case 1: name is an empty string', () => {
    expect(channelsCreate(token, '', true)).toStrictEqual(400);
  });
  test.each([
    [token, '123456789012345678901', true],
    [token, 'abcdefjhijklmnopqrstuvw', true],
    [token, '                         ', false],
    [token, ' a1@~!~!~?><+==+><?~!~!~@1a ', false],
  ])('Error Case 2: name has more than 20 characters', (token, name, isPublic) => {
    expect(channelsCreate(token, name, isPublic)).toStrictEqual(400);
  });
  test('Error Case 3: token is invalid', () => {
    expect(channelsCreate(token + 'hi', 'channel', true)).toStrictEqual(403);
  });
});

describe('Testing channelsCreateV1 Correct Return Type', () => {
  let token = '';
  beforeEach(() => {
    token = authRegister('Liz@outlook.com', '1234567', 'ABCD', 'EFG').token;
  });
  test('Testing returned object', () => {
    expect(channelsCreate(token, 'channel', true)).toStrictEqual({ channelId: expect.any(Number) });
  });
  test('Creating a public & a private channel', () => {
    const channelId1 = channelsCreate(token, 'channel1', true).channelId;
    const channelId2 = channelsCreate(token, 'channel2', false).channelId;
    const expectedOutput = {
      channels: [
        {
          channelId: channelId1,
          name: 'channel1',
        },
        {
          channelId: channelId2,
          name: 'channel2',
        },
      ]
    };
    expectedOutput.channels.sort((a, b) => a.channelId - b.channelId);
    const actualOutput = channelsList(token);
    actualOutput.channels.sort((a: channel, b: channel) => a.channelId - b.channelId);
    expect(actualOutput).toStrictEqual(expectedOutput);
  });
});

describe('Testing channelsListV1 Error Case', () => {
  test('Invalid token', () => {
    const token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
    channelsCreate(token, 'channels', true);
    expect(channelsList(token + 'hi')).toStrictEqual(403);
  });
});

describe('Testing channelsListV1 Correct Return Type', () => {
  let token = '';
  beforeEach(() => {
    token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
  });

  test('authorised user is not a part of any channels', () => {
    expect(channelsList(token)).toStrictEqual({ channels: [] });
  });

  test('authorised user is a part of a public channel', () => {
    const channelId = channelsCreate(token, 'channel1', true).channelId;
    expect(channelsList(token)).toStrictEqual({
      channels: [
        {
          channelId: channelId,
          name: 'channel1',
        }
      ],
    });
  });

  test('authorised user is a part of a private channel', () => {
    const channelId = channelsCreate(token, 'channel1', false).channelId;
    expect(channelsList(token)).toStrictEqual({
      channels: [
        {
          channelId: channelId,
          name: 'channel1',
        }
      ],
    });
  });

  test('authorised user is a part of multiple channels', () => {
    const channelId1 = channelsCreate(token, 'channel1', false).channelId;
    const channelId2 = channelsCreate(token, 'channel2', true).channelId;
    const channelId3 = channelsCreate(token, 'channel3', true).channelId;
    const expectedOutput = {
      channels: [
        {
          channelId: channelId1,
          name: 'channel1',
        },
        {
          channelId: channelId2,
          name: 'channel2',
        },
        {
          channelId: channelId3,
          name: 'channel3',
        },
      ]
    };
    expectedOutput.channels.sort((a, b) => a.channelId - b.channelId);
    const actualOutput = channelsList(token);
    actualOutput.channels.sort((a: channel, b: channel) => a.channelId - b.channelId);
    expect(expectedOutput).toStrictEqual(actualOutput);
  });

  test('authorised user is only a part of some channels (not all channels)', () => {
    const token2 = authRegister('zzw@outlook.com', '7654321', 'Beck', 'Huang').token;
    const channelId1 = channelsCreate(token, 'channel1', false).channelId;
    const channelId2 = channelsCreate(token, 'channel2', true).channelId;
    const channelId3 = channelsCreate(token2, 'channel3', false).channelId;
    const channelId4 = channelsCreate(token2, 'channel4', true).channelId;

    const expectedOutput1 = {
      channels: [
        {
          channelId: channelId1,
          name: 'channel1',
        },
        {
          channelId: channelId2,
          name: 'channel2',
        },
      ],
    };
    expectedOutput1.channels.sort((a, b) => a.channelId - b.channelId);
    const actualOutput1 = channelsList(token);
    actualOutput1.channels.sort((a: channel, b: channel) => a.channelId - b.channelId);
    expect(actualOutput1).toStrictEqual(expectedOutput1);

    const expectedOutput2 = {
      channels: [
        {
          channelId: channelId3,
          name: 'channel3',
        },
        {
          channelId: channelId4,
          name: 'channel4',
        },
      ],
    };
    expectedOutput2.channels.sort((a, b) => a.channelId - b.channelId);
    const actualOutput2 = channelsList(token2);
    actualOutput2.channels.sort((a: channel, b: channel) => a.channelId - b.channelId);
    expect(actualOutput2).toStrictEqual(expectedOutput2);
  });
});

describe('Testing channelsListAllV1 Error Cases', () => {
  test('Invalid token', () => {
    const token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
    expect(channelsListAll(token + 'hi')).toStrictEqual(403);
  });
});

describe('Testing channelsListAllV1 Correct Return Type', () => {
  let token = '';
  beforeEach(() => {
    token = authRegister('hywang@outlook.com', '1234567', 'Hailey', 'Wang').token;
  });

  test('No channels at all', () => {
    expect(channelsListAll(token)).toStrictEqual({ channels: [] });
  });

  test('One public channel', () => {
    const channelId = channelsCreate(token, 'Channel1', true).channelId;
    expect(channelsListAll(token)).toStrictEqual({
      channels: [
        {
          channelId: channelId,
          name: 'Channel1',
        }
      ],
    });
  });

  test('One private channel', () => {
    const channelId = channelsCreate(token, 'Channel1', false).channelId;
    expect(channelsListAll(token)).toStrictEqual({
      channels: [
        {
          channelId: channelId,
          name: 'Channel1',
        }
      ],
    });
  });

  test('A mix of public and private channels created by a single person', () => {
    const channelId1 = channelsCreate(token, 'Channel1', false).channelId;
    const channelId2 = channelsCreate(token, 'Channel2', true).channelId;
    const channelId3 = channelsCreate(token, 'Channel3', false).channelId;
    const expectedOutput = {
      channels: [
        {
          channelId: channelId1,
          name: 'Channel1',
        },
        {
          channelId: channelId2,
          name: 'Channel2',
        },
        {
          channelId: channelId3,
          name: 'Channel3'
        },
      ],
    };
    expectedOutput.channels.sort((a, b) => a.channelId - b.channelId);
    const actualOutput = channelsListAll(token);
    actualOutput.channels.sort((a: channel, b: channel) => a.channelId - b.channelId);
    expect(actualOutput).toStrictEqual(expectedOutput);
  });

  test('A list of channels created with the same name', () => {
    const channelId1 = channelsCreate(token, 'Channel', true).channelId;
    const channelId2 = channelsCreate(token, 'Channel', true).channelId;
    const channelId3 = channelsCreate(token, 'Channel', false).channelId;
    const expectedOutput = {
      channels: [
        {
          channelId: channelId1,
          name: 'Channel',
        },
        {
          channelId: channelId2,
          name: 'Channel',
        },
        {
          channelId: channelId3,
          name: 'Channel',
        },
      ],
    };
    expectedOutput.channels.sort((a, b) => a.channelId - b.channelId);
    const actualOutput = channelsListAll(token);
    actualOutput.channels.sort((a: channel, b: channel) => a.channelId - b.channelId);
    expect(actualOutput).toStrictEqual(expectedOutput);
  });

  test('A list of channels created by different users', () => {
    const token2 = authRegister('abc@outlook.com', '1234567', 'Zac', 'Hong').token;
    const channelId1 = channelsCreate(token, 'Channel1', true).channelId;
    const channelId2 = channelsCreate(token, 'Channel2', false).channelId;
    const channelId3 = channelsCreate(token2, 'Channel3', true).channelId;
    const channelId4 = channelsCreate(token2, 'Channel4', false).channelId;
    const expectedOutput = {
      channels: [
        {
          channelId: channelId1,
          name: 'Channel1',
        },
        {
          channelId: channelId2,
          name: 'Channel2',
        },
        {
          channelId: channelId3,
          name: 'Channel3',
        },
        {
          channelId: channelId4,
          name: 'Channel4',
        },
      ],
    };
    expectedOutput.channels.sort((a, b) => a.channelId - b.channelId);
    const actualOutput1 = channelsListAll(token);
    actualOutput1.channels.sort((a: channel, b: channel) => a.channelId - b.channelId);
    const actualOutput2 = channelsListAll(token2);
    actualOutput2.channels.sort((a: channel, b: channel) => a.channelId - b.channelId);
    expect(actualOutput1).toStrictEqual(expectedOutput);
    expect(actualOutput2).toStrictEqual(expectedOutput);
  });
});
