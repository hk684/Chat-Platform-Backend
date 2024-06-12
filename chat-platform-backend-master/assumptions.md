1. when global member joins channel assume that they are added as channel member and not channel owner

2. assuming if a number equal to the amount of messages in the channel is passed into start in channelMessages then an error is also thrown. specification only says error when start is greater than.

3. Assume all userIds are unique.

4. Assume all channelIds are unique.

5. Assume the user who created the channel is the owner of the channel.

6. Spec mentioned that clearV1 "Resets the internal data of the application to the
   initial state", here initial state refers to a dataStore with specified places
   to store user and channel details, however, there're no users nor channels inside the
   places.

7. Assumes that if an owner leaves their own DM, the ownership will be given to the first user in the members array.