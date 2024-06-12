import { findByToken, calculateUtilizationRate } from './implementationHelpers';
import { UsersStats } from './returnTypes';
import { getData } from './dataStore';
import HTTPError from 'http-errors';

/**
 * Fetches the required statistics about the workspace's
 * use of UNSW Memes
 * @param {string} token -unique identifier for user
 * @return {Object} - the workspaceStats object containing channelsExist, dmsExist, messageExist and utilizationRate
 * @throws HTTPError - if invalid token
 */
export function usersStats(token: string): UsersStats {
  if (findByToken(token) === undefined) {
    throw HTTPError(403, 'Invalid token!');
  }
  const workplaceStat = getData().workspaceStats;
  workplaceStat.utilizationRate = calculateUtilizationRate();

  return { workspaceStats: workplaceStat };
}
