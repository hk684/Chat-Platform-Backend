import fs from 'fs';

export interface channelsJoined {
  numChannelsJoined: number,
  timeStamp: number,
}

export interface dmsJoined {
  numDmsJoined: number,
  timeStamp: number,
}

export interface messagesSent {
  numMessagesSent: number,
  timeStamp: number,
}

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

export interface notification {
  channelId: number,
  dmId: number,
  notificationMessage: string,
}

export interface user {
  uId: number,
  permissionId: number,
  nameFirst: string,
  nameLast: string,
  email: string,
  password: string,
  handleStr: string,
  tokens: string[],
  resetCode?: string,
  profileImgUrl: string,
  notifications: notification[],
  userStats: {
    channelsJoined: channelsJoined[],
    dmsJoined: dmsJoined[],
    messagesSent: messagesSent[],
    involvementRate: number,
  }
}

export interface react {
  reactId: number,
  uIds: number[],
  isThisUserReacted: boolean
}

export interface message {
  messageId: number,
  message: string,
  uId: number,
  timeSent: number,
  isPinned: boolean,
  reacts: react[]
}

interface channel {
  nameChannel: string,
  isPublic: boolean,
  channelId: number,
  messages: message[],
  ownerMembers: number[],
  allMembers: number[],
  standupActive: boolean,
  standupFinish: number | null,
  standupStr: string
}

interface dm {
  dmId: number,
  dmName: string,
  owner: number,
  uIds: number[],
  messages: message[]
}

interface workspaceStats {
  channelsExist: channelsExist[],
  dmsExist: dmsExist[],
  messagesExist: messagesExist[],
  utilizationRate: number,
}

interface dataStore {
  users: user[],
  channels: channel[],
  dms: dm[],
  workspaceStats: workspaceStats,
  maxId: number,
  lastDmId: number,
  secret: string,
}

// YOU SHOULD MODIFY THIS OBJECT BELOW
let data : dataStore = {
  users: [],
  channels: [],
  dms: [],
  workspaceStats: {
    channelsExist: [],
    dmsExist: [],
    messagesExist: [],
    utilizationRate: 0,
  },
  maxId: 0,
  lastDmId: 0,
  secret: 'T13BAEROSECRETHASH'
};

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1

/*
  Example usage
      let store = getData()
      console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

      names = store.names

      names.pop()
      names.push('Jake')

      console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
      setData(store)
  */

// Use getData() to access the data
function getData() {
  return data;
}

// saves the current data object to database.json. will overwrite any previous changes in database.json.
function save() {
  const jsonString = JSON.stringify(data);
  fs.writeFileSync('./src/database.json', jsonString);
  // data = newData;
}

/**
 * replaces the datastore with the newdata object passed into it
 * @param newData object containing the data that data will be replaced with
 */
function setData(newData: dataStore) {
  data = newData;
  save();
}

// sets the internal data object to the contents of database.json
// will overwrite any changes made in the internal data object
function updateData() {
  if (fs.existsSync('./src/database.json')) {
    data = JSON.parse(String(fs.readFileSync('./src/database.json')));
  }
  setData(data);
}
export { getData, setData, save, updateData };
