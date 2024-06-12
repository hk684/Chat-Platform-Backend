import { setData } from './dataStore';
/**
 * clears all data from dataStore
 *
 * @returns {Object} returns empty object
 */
function clearV1(): object {
  setData({
    users: [],
    channels: [],
    dms: [],
    workspaceStats: {
      channelsExist: [],
      dmsExist: [],
      messagesExist: [],
      utilizationRate: 0,
    },
    lastDmId: 0,
    maxId: 0,
    secret: 'T13BAEROSECRETHASH',
  });
  return {};
}
export { clearV1 };
