import { getData, save } from './dataStore';
import { findByToken } from './implementationHelpers';
import { userProfile } from './returnTypes';
import request from 'sync-request';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import validator from 'validator';
import HTTPError from 'http-errors';

/**
 * changes the first and last name of the user to the arguements given
 *
 * @param {string} token token that refers to the user that is having their name changed
 * @param {string} nameFirst string that the users first name will be set to
 * @param {string} nameLast string that the users last name will be set to
 * @returns {object} returns error if an error occurs and an empty object on success
 */
export function userProfileSetNameV2(token: string, nameFirst: string, nameLast: string): { error?: string } {
  if (nameFirst.length > 50 || nameFirst.length < 1 || nameLast.length > 50 || nameLast.length < 1) {
    throw HTTPError(400, 'names must be between 1 and 50 characters long');
  }
  const user = findByToken(token);
  if (user !== undefined) {
    user.nameFirst = nameFirst;
    user.nameLast = nameLast;
    save();
    return {};
  } else {
    throw HTTPError(403, 'Invalid token');
  }
}

/**
 * changes the email of a user to the string passed into the argument
 *
 * @param token token that refers to the user that is having their email changed
 * @param email string that the users email will be set to
 * @returns {object} empty object on success, object containing key error if an error occurs
 */
export function userProfileSetEmailV2(token: string, email: string): { error?: string } {
  if (!validator.isEmail(email)) {
    throw HTTPError(400, 'Invalid email');
  }
  if (getData().users.some((user) => user.email === email)) {
    throw HTTPError(400, 'Email already in use');
  }
  const user = findByToken(token);
  if (user !== undefined) {
    user.email = email;
    save();
    return {};
  } else {
    throw HTTPError(403, 'Invalid token');
  }
}

/**
 * changes the handle of the users profile to the string passed in
 *
 * @param token token that refers to the user that is having their handle changed
 * @param handleStr string that the users handle will be set to
 * @returns {object} empty object on success, object containing key error if an error occurs
 */
export function userProfileSetHandleV2(token: string, handleStr: string): { error?: string } {
  if (handleStr.match(/[^A-Za-z0-9]/g) !== null) {
    throw HTTPError(400, 'handle can only have alphanumerica characters!');
  }
  if (handleStr.length > 20 || handleStr.length < 3) {
    throw HTTPError(400, 'handle must be between 3 and 20 characters long');
  }
  if (getData().users.some((user) => user.handleStr === handleStr)) {
    throw HTTPError(400, 'handle already taken');
  }
  const user = findByToken(token);
  if (user !== undefined) {
    user.handleStr = handleStr;
    save();
    return {};
  } else {
    throw HTTPError(403, 'Token is invalid');
  }
}

/**
 * returns details about a user given a token and user id
 *
 * @param token token that refers to the user performing the action
 * @param uId id of the user being viewed
 * @returns {object} object containing key error if an error occurs
 * @returns {object} object containing a profile object on success
 */
export function userProfileV3(token: string, uId: number): userProfile {
  const data = getData();

  // token is invalid
  const authUser = findByToken(token);
  if (authUser === undefined) {
    throw HTTPError(403, 'invalid token');
  }

  // uId does not refer to valid user
  const user = data.users.find(u => u.uId === uId);
  if (user === undefined) {
    throw HTTPError(400, 'invalid uId');
  }

  return {
    user: {
      uId: uId,
      email: user.email,
      nameFirst: user.nameFirst,
      nameLast: user.nameLast,
      handleStr: user.handleStr,
      profileImgUrl: user.profileImgUrl
    }
  };
}

export const userProfileUploadPhoto = async (token: string, imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number) => {
  const user = findByToken(token);
  if (user === undefined) {
    throw HTTPError(403, 'invalid token');
  }
  const res = request('GET', imgUrl);
  if (res.statusCode !== 200) {
    throw HTTPError(400, 'error occured when downloading image');
  }
  if (xEnd <= xStart || yEnd <= yStart) {
    throw HTTPError(400, 'end is smaller than or equal to start');
  }
  const body = res.getBody();
  const filename = crypto.createHash('sha256').update(user.uId.toString()).digest('hex');
  fs.writeFileSync('./pfps/temp.jpg', body, { flag: 'w' });
  user.profileImgUrl = `/pfps/${filename}.jpg`;
  save();
  const image = sharp('./pfps/temp.jpg');
  const width = await image.metadata().then((metadata) => {
    return metadata.width;
  });
  const height = await image.metadata().then((metadata) => {
    return metadata.height;
  });
  if (xEnd > width || xStart > width || yEnd > height || yStart > height) {
    throw HTTPError(400, 'dimensions out of bounds of image');
  }
  const format = await image.metadata().then((metadata) => {
    return metadata.format;
  });
  if (format !== 'jpeg') {
    throw HTTPError(400, 'only jpeg images allowed');
  }
  await image.extract({ left: xStart, top: yStart, width: xEnd - xStart, height: yEnd - yStart }).toFile(`./pfps/${filename}.jpg`);
  return {};
};

export const getImage = (url: string) => {
  return fs.readFileSync(`./pfps/${url}`);
};
