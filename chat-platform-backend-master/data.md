```javascript
let data = {
  users: [
    {
      uId: 1,
      permissionId: 1,
      nameFirst: 'A',
      nameLast: 'B',
      email: 'z5555555@ad.unsw.edu.au',
      password: '123456',
      handleStr: 'cat',
      tokens: ['133769', '42069'] 
      // 5.7 - A token (to represent a session) for iteration 2 can be as simple a randomly generated number (converted to a string)
      // 5.7 - A secure method of session storage will be created in iteration 3.

      // Example 1 liner generateToken function could look like:
      // const generateToken = () => {(Math.floor(Math.random() * 1000000)).toString()}
      // This will generate a random number between 0 to 999,999 which will be converted to a string
    }
  ],
  channels: [
    {
      nameChannel: 'channel 1',
      isPublic: true,
      channelId: 1,
      messages: [
        {
          messageId: 1,
          message: 'Hello world',
          uId: 1,
          timeSent: 2,
          isPinned: true,
          reacts: []
        }, 
        {
          messageId: 2,
          message: 'ello to you too mate',
          uId: 2,
          timeSent: 2,
          isPinned: true,
          reacts: []
        }
      ],
      ownerMembers: [1],
      allMembers: [1,2],
    }
  ],
  dms:[
    {
      dmId: 1,
      // list of handleStr's of users in dm, should be automatically generated
      dmName: 'ahandle1, bhandle2, chandle3' 
      // uId of owner
      owner: 1, 
      // array of uId's of members in DM, we can access each user's data through userProfile or accessing dataStore itself
      uIds: [1, 2, 3], 
      messages: [
        {
          messageId: 1,
          message: 'Hello World',
          uId: 1,
          timeSent: 1
        },
      ]
    }
  ]
}
 
```
[Optional] short description: 

