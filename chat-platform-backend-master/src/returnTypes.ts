export type react = { reactId: number, uIds: number[], isThisUserReacted: boolean }
export type channelJoin = {error?: string};
export type authLogout = {error?: string};
export type message = {messageId: number, uId: number, message: string, timeSent: number, isPinned: boolean, reacts: react[]}[];
export type messages = {messages: message};
export type messageRemove = {error?: string};
export type channelMessage = {messages: message, start: number, end: number};
export type channelInvite = {error?: string};
export type messageEdit = {error?: string};
export type channelId = { channelId?: number, error: string } | { channelId: number, error?: string }
export type channelList = { channels?: {channelId: number, name: string }[], error: string } | { channels: {channelId: number, name: string }[], error?: string }
export type authUserId = {token?: string, authUserId?: number, error: string} | {token: string, authUserId: number, error?: string}
export type messageSend = { messageId: number, error?: string} | { messageId?: number, error: string};
export type messageShare = { sharedMessageId: number, error?: string } | { sharedMessageId?: number, error: string};
export type profile = {
  uId: number,
  email: string,
  nameFirst: string,
  nameLast: string,
  handleStr: string,
  profileImgUrl: string
};
export type channelProfile = {
  uId: number,
  email: string,
  nameFirst: string,
  nameLast: string,
  handleStr: string
};
export type userProfile = { user: profile, error?: string } | { user?: profile, error: string };
export type usersAll = {users?: {uId: number, email: string, nameFirst: string, nameLast: string, handleStr: string}[], error: string } | {users: {uId: number, email: string, nameFirst: string, nameLast: string, handleStr: string}[], error?: string };
export type channelDetail = {name: string, isPublic: boolean, ownerMembers: channelProfile[], allMembers: channelProfile[], error?: string} | {name?: string, isPublic?: boolean, ownerMembers?: channelProfile[], allMembers?: channelProfile[], error: string};
export type channels = { nameChannel: string, isPublic: boolean, channelId: number, messages: message, ownerMembers: number[], allMembers: number[] };
export type dm = { dmId: number, dmName: string, owner: number, uIds: number[], messages: message}
export type error = { error: string };
export type dmId = { dmId: number };
export type dmCreate = { dmId: number, error?: string } | { dmId?: number, error: string };
export type dmUser = {
  dmId: number,
  name: string
}
export type dms = {
  dms?: dmUser[]
}

export type dmDetails = {name: string, members: channelProfile[], error?: string} | {name?: string, members?: channelProfile[], error: string};

export type messageId = { messageId: number }

export type notification = {
  channelId: number,
  dmId: number,
  notificationMessage: string,
}

export type notifications = { notifications: notification[] };

export type standupActive = {
  isActive: boolean,
  timeFinish: number
}

export type channelsJoined = {
  numChannelsJoined: number,
  timeStamp: number,
}

export type dmsJoined = {
  numDmsJoined: number,
  timeStamp: number,
}

export type messagesSent = {
  numMessagesSent: number,
  timeStamp: number,
}
export type userStat = {
  channelsJoined: channelsJoined[],
  dmsJoined: dmsJoined[],
  messagesSent: messagesSent[],
  involvementRate: number,
}

export type UserStats = { userStats: userStat };

export interface channelsExist {
  numChannelsExist: number,
  timeStamp: number,
}

export interface dmsExist {
  numDmsExist: number,
  timeStamp: number,
}

export interface messagesExist {
  numMessagesExist: number,
  timeStamp: number,
}

export type usersStat = {
  channelsExist: channelsExist[],
  dmsExist: dmsExist[],
  messagesExist: messagesExist[],
  utilizationRate: number,
}

export interface UsersStats { workspaceStats: usersStat }
