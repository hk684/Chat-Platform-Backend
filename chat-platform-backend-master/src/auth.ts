import validator from 'validator';
import { getData, save } from './dataStore';
import { authUserId } from './returnTypes';
import HTTPError from 'http-errors';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

/**
 * Given a registered user's email and password, returns their authUserId value
 * @param {string} email - The email address of the user; used to log in
 * @param {string} password - Password of user; used to login
 * @returns {Object} - returns an error object when email entered does not belong to a user/incorrect password
 * @returns {Object} - returns an object containing token and authUserId if no error is encountered.
 */

export function authLoginV3(email: string, password: string): authUserId {
  const data = getData();
  const hashedPassword = crypto.createHash('sha256').update(password + data.secret).digest('hex');
  const user = getData().users.find(u => u.email === email && u.password === hashedPassword);
  if (user === undefined) {
    throw HTTPError(400, 'Invalid email or password');
  }

  const userId = user.uId;
  const token = generateToken();
  const hashedToken = crypto.createHash('sha256').update(token + data.secret).digest('hex');
  user.tokens.push(hashedToken);
  save();

  return {
    token: token,
    authUserId: userId,
  };
}

/**
  * Registers a new user in dataStore and returns a user id for authorisation
  *
  * @param {String} email - The email address of the user; used to log in
  * @param {String} password - Password of user; used to log in
  * @param {String} nameFirst - User's first name
  * @param {String} nameLast - User's first name
  * @returns {Object} - An object containing the token and user Id of the newly created user if no error is encountered
  * @returns {Object} - returns an error object with key error linked to string 'error'
*/

export function authRegisterV3(email: string, password: string, nameFirst: string, nameLast: string): authUserId {
  if (!validator.isEmail(email + '')) {
    throw HTTPError(400, 'Invalid Email');
  }

  if (password.length < 6) {
    throw HTTPError(400, 'Password must be longer than 6 characters');
  }

  if (nameFirst.length > 50 || nameFirst.length < 1) {
    throw HTTPError(400, 'First name must be between 1 and 50 characters');
  }

  if (nameLast.length > 50 || nameLast.length < 1) {
    throw HTTPError(400, 'Last name must be between 1 and 50 characters');
  }

  const data = getData();

  let handleStr = (nameFirst + nameLast).toLowerCase();
  handleStr = handleStr.replace(/[^A-Za-z0-9]/g, '');
  handleStr = handleStr.substring(0, 20);
  let permissionId: number;
  const uId: number = data.users.length + 1;
  // Create handle
  if (data.users.length !== 0) {
    const originalHandle = handleStr;
    let matchingHandles = 0;
    const handles: string[] = [];
    for (const user of data.users) {
      handles.push(user.handleStr);
      if (user.email === email) {
        throw HTTPError(400, 'Email already in use');
      }
    }
    while (handles.some((element) => element === handleStr)) {
      matchingHandles++;
      handleStr = originalHandle + ((matchingHandles - 1).toString());
    }
    permissionId = 2;
  } else {
    permissionId = 1;
  }
  const hashedPassword = crypto.createHash('sha256').update(password + data.secret).digest('hex');
  const token = generateToken();
  const hashedToken = crypto.createHash('sha256').update(token + data.secret).digest('hex');
  data.users.push({
    uId,
    email,
    permissionId,
    handleStr,
    password: hashedPassword,
    nameFirst,
    nameLast,
    tokens: [hashedToken],
    profileImgUrl: './pfps/default.jpg',
    notifications: [],
    userStats: {
      channelsJoined: [
        {
          numChannelsJoined: 0,
          timeStamp: Math.floor((new Date()).getTime() / 1000)
        }
      ],
      dmsJoined: [
        {
          numDmsJoined: 0,
          timeStamp: Math.floor((new Date()).getTime() / 1000)
        }
      ],
      messagesSent: [
        {
          numMessagesSent: 0,
          timeStamp: Math.floor((new Date()).getTime() / 1000)
        }
      ],
      involvementRate: 0,
    }
  });

  // workspace stats
  if (permissionId === 1) {
    data.workspaceStats.channelsExist.push(
      {
        numChannelsExist: 0,
        timeStamp: Math.floor((new Date()).getTime() / 1000)
      }
    );
    data.workspaceStats.dmsExist.push(
      {
        numDmsExist: 0,
        timeStamp: Math.floor((new Date()).getTime() / 1000)
      }
    );
    data.workspaceStats.messagesExist.push(
      {
        numMessagesExist: 0,
        timeStamp: Math.floor((new Date()).getTime() / 1000)
      }
    );
    data.workspaceStats.utilizationRate = 0;
  }
  save();
  return {
    token: token,
    authUserId: uId
  };
}

// function to generate a new token
function generateToken() {
  const data = getData();
  let newToken = (Math.floor(Math.random() * 1000000)).toString();
  for (const user of data.users) {
    for (const token of user.tokens) {
      if (token === newToken) {
        newToken = generateToken();
      }
    }
  }
  return newToken;
}

/**
 * sends an email to the given email address if it refers to a registered user
 * @param email email address of the user that an email will be sent to
 * @returns empty object on success
 */
export const authPasswordResetRequest = async (email: string) => {
  const user = getData().users.find((user) => user.email === email);
  if (user === undefined) {
    return {};
  }
  user.tokens = [];
  const resetCode = generateToken();
  user.resetCode = crypto.createHash('sha256').update(resetCode + getData().secret).digest('hex');
  save();
  // create reusable transporter object using the default SMTP transport
  // let transporter;
  let transporter;
  try {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        type: 'OAuth2',
        user: '1531testemail@gmail.com',
        clientId: '368644572984-fb4vimu573ckqdrtko6jbdqfjkvpnsfk.apps.googleusercontent.com',
        clientSecret: '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',
        refreshToken: '1//049IZK_sCG150CgYIARAAGAQSNwF-L9IrrhEoEwOt0sKNFUpiNJZX-t2rjazXUotYLgLXlgy_vxHIg-VJ3FS7AswcjrAL3WlaTI4'
      },
    });
  } catch (error) {
    transporter = null;
  }

  // send mail with defined transport object
  if (transporter !== null) {
    try {
      await transporter.sendMail({
        from: '1531testemail@gmail.com', // sender address
        to: email, // list of receivers
        subject: 'UNSW Memes password reset request', // Subject line
        text: `Hello, ${user.nameFirst}\nWe have recieved a request to reset your password. Your password reset code is ${resetCode}. If you did not request a password reset, you can ignore this email.`,
      });
    } catch (error) {
      console.log('Transporter sendEmail error in password reset:', error.message);
    }
  }
  return {};
};

/**
 * given a reset code from users email, changes the users password to the newpassword
 * @param resetCode reset code given from the users email
 * @param newPassword the password that the users password will be set to
 * @returns empty object on success
 */
export const authPasswordReset = (resetCode: string, newPassword: string) => {
  if (newPassword.length < 6) {
    throw HTTPError(400, 'password is too short');
  }
  const hashedResetCode = crypto.createHash('sha256').update(resetCode + getData().secret).digest('hex');
  const user = getData().users.find((u) => u.resetCode === hashedResetCode);
  if (user === undefined) {
    throw HTTPError(400, 'reset code invalid');
  }
  const hashedPassword = crypto.createHash('sha256').update(newPassword + getData().secret).digest('hex');
  user.password = hashedPassword;
  user.resetCode = undefined;
  save();
  return {};
};
