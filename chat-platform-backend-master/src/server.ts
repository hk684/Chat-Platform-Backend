import express, { json, Request, Response } from 'express';
import { usersAllV2 } from './usersAll';
import { authRegisterV3, authLoginV3, authPasswordResetRequest, authPasswordReset } from './auth';
import { echo } from './echo';
import { updateData } from './dataStore';
import { dmCreateV2, dmListV2, dmRemoveV2, dmDetailsV2, dmLeaveV2, dmMessagesV2 } from './dm';
import { clearV1 } from './other';
import { channelsCreateV1, channelsListV1, channelsListAllV1 } from './channels';
import { messageRemoveV1 } from './messageRemoveV1';
import { messageEditV1 } from './messageEditV1';
import { messageSendV1, messageShareV1 } from './messageSend';
import { authLogoutV2 } from './authLogoutv1';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import { messageSendDMV1 } from './messagesendDM';
import { getImage, userProfileSetEmailV2, userProfileSetHandleV2, userProfileSetNameV2, userProfileUploadPhoto, userProfileV3 } from './users';
import { channelDetailsV2, channelJoinV2, channelInviteV2, channelMessagesV2, channelLeaveV1, channelAddOwnerV1, channelRemoveOwnerV1 } from './channel';
import { messagePin, messageUnpin } from './messagePins';
import { messageReact, messageUnreact } from './messageReacts';
import { notificationsGet } from './notificationGet';
import { standupStartV1, standupSendV1, standupActiveV1 } from './standup';
import { search } from './search';
import { messagesendLater } from './messagesendLater';
import { messagesendLaterDM } from './messagesendlaterdm';
import { userStats } from './userStats';
import { usersStats } from './usersStats';
// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// standup routes

app.post('/standup/start/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, length } = req.body;
  return res.json(standupStartV1(token, channelId, length));
});

app.get('/standup/active/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const channelId = req.query.channelId as string;
  return res.json(standupActiveV1(token, parseInt(channelId)));
});

app.post('/standup/send/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, message } = req.body;
  return res.json(standupSendV1(token, channelId, message));
});

// Example get request
app.get('/echo', (req: Request, res: Response, next) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});

// usersAll route
app.get('/users/all/v2', (req: Request, res: Response, next) => {
  const token = req.header('token');
  return res.json(usersAllV2(token));
});

app.put('/user/profile/setname/v2', (req: Request, res: Response, next) => {
  const token = req.header('token');
  const { nameFirst, nameLast } = req.body;
  return res.json(userProfileSetNameV2(token, nameFirst, nameLast));
});

app.put('/user/profile/setemail/v2', (req: Request, res: Response, next) => {
  const token = req.header('token');
  const { email } = req.body;
  return res.json(userProfileSetEmailV2(token, email));
});

app.put('/user/profile/sethandle/v2', (req: Request, res: Response, next) => {
  const token = req.header('token');
  const { handleStr } = req.body;
  return res.json(userProfileSetHandleV2(token, handleStr));
});

// channelsCreate route
app.post('/channels/create/v3', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const name = req.body.name as string;
  const isPublic = req.body.isPublic;
  res.json(channelsCreateV1(token, name, isPublic));
});

// channelsList route
app.get('/channels/list/v3', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  res.json(channelsListV1(token));
});

// channelsListAll route
app.get('/channels/listAll/v3', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  res.json(channelsListAllV1(token));
});

app.put('/message/edit/v2', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const messageId = req.body.messageId;
  const message = req.body.message as string;
  res.json(messageEditV1(token, messageId, message));
});

// messageSend route
app.post('/message/send/v2', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const channelId = req.body.channelId;
  const message = req.body.message as string;
  res.json(messageSendV1(token, channelId, message));
});

// auth routes
app.post('/auth/register/v3', (req: Request, res: Response, next) => {
  const { email, password, nameFirst, nameLast } = req.body;
  res.json(authRegisterV3(email, password, nameFirst, nameLast));
});

app.post('/auth/login/v3', (req: Request, res: Response, next) => {
  const { email, password } = req.body;
  res.json(authLoginV3(email, password));
});
// authLogout route
app.post('/auth/logout/v2', (req: Request, res: Response, next) => {
  const token = req.headers.token as string;
  res.json(authLogoutV2(token));
});

// userProfileV2 route
app.get('/user/profile/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const uId = parseInt(req.query.uId as string);
  res.json(userProfileV3(token, uId));
});

// dmmessagesv1 route
app.get('/dm/messages/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const dmId = parseInt(req.query.dmId as string);
  const start = parseInt(req.query.start as string);
  return res.json(dmMessagesV2(token, dmId, start));
});

app.get('/channel/details/v3', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const channelId = parseInt(req.query.channelId as string);
  return res.json(channelDetailsV2(token, channelId));
});

app.post('/channel/join/v3', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const channelId = req.body.channelId;
  return res.json(channelJoinV2(token, channelId));
});

app.post('/channel/invite/v3', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const { channelId, uId } = req.body;
  return res.json(channelInviteV2(token, channelId, uId));
});

app.get('/channel/messages/v3', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const channelId = parseInt(req.query.channelId as string);
  const start = parseInt(req.query.start as string);
  return res.json(channelMessagesV2(token, channelId, start));
});

app.delete('/message/remove/v2', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const messageId = parseInt(req.query.messageId as string);
  res.json(messageRemoveV1(token, messageId));
});

app.post('/channel/leave/v2', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const channelId = req.body.channelId;
  return res.json(channelLeaveV1(token, channelId));
});

app.post('/channel/addowner/v2', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const { channelId, uId } = req.body;
  return res.json(channelAddOwnerV1(token, channelId, uId));
});

app.post('/channel/removeowner/v2', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const { channelId, uId } = req.body;
  return res.json(channelRemoveOwnerV1(token, channelId, uId));
});

app.delete('/clear/v1', (req: Request, res: Response) => {
  res.json(clearV1());
});

app.post('/dm/create/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const { uIds } = req.body;
    res.json(dmCreateV2(token, uIds));
  } catch (err) {
    next(err);
  }
});

app.get('/dm/list/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    res.json(dmListV2(token));
  } catch (err) {
    next(err);
  }
});

app.delete('/dm/remove/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const dmId = req.query.dmId as string;
    res.json(dmRemoveV2(token, parseInt(dmId)));
  } catch (err) {
    next(err);
  }
});

app.get('/dm/details/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const dmId = req.query.dmId as string;
    res.json(dmDetailsV2(token, parseInt(dmId)));
  } catch (err) {
    next(err);
  }
});

app.post('/dm/leave/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const { dmId } = req.body;
    res.json(dmLeaveV2(token, dmId));
  } catch (err) {
    next(err);
  }
});

app.post('/message/senddm/v2', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const dmId = req.body.dmId;
  const message = req.body.message as string;
  res.json(messageSendDMV1(token, dmId, message));
});

app.post('/auth/passwordreset/request/v1', (req: Request, res: Response) => {
  const email = req.body.email;
  res.json(authPasswordResetRequest(email));
});

app.post('/auth/passwordreset/reset/v1', (req: Request, res: Response) => {
  const { resetCode, newPassword } = req.body;
  res.json(authPasswordReset(resetCode, newPassword));
});

app.post('/message/pin/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const messageId = req.body.messageId;
  res.json(messagePin(token, messageId));
});

app.post('/message/unpin/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const messageId = req.body.messageId;
  res.json(messageUnpin(token, messageId));
});

app.post('/message/react/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const { messageId, reactId } = req.body;
  res.json(messageReact(token, messageId, reactId));
});

app.post('/message/unreact/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const { messageId, reactId } = req.body;
  res.json(messageUnreact(token, messageId, reactId));
});

app.post('/message/share/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const { ogMessageId, message, channelId, dmId } = req.body;
  res.json(messageShareV1(token, ogMessageId, message, channelId, dmId));
});

app.get('/notifications/get/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  res.json(notificationsGet(token));
});

app.get('/search/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const queryStr = req.query.queryStr as string;
  res.json(search(token, queryStr));
});

app.post('/message/sendlater/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const channelId = req.body.channelId;
  const message = req.body.message as string;
  const timeSent = req.body.timeSent;
  res.json(messagesendLater(token, channelId, message, timeSent));
});

app.post('/message/sendlaterdm/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const dmId = req.body.dmId;
  const message = req.body.message as string;
  const timeSent = req.body.timeSent;
  res.json(messagesendLaterDM(token, dmId, message, timeSent));
});

app.get('/user/stats/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  res.json(userStats(token));
});

app.get('/users/stats/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  res.json(usersStats(token));
});

app.post('/user/profile/uploadphoto/v1', async (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { imgUrl, xStart, yStart, xEnd, yEnd } = req.body;
    res.json(await userProfileUploadPhoto(token, imgUrl, xStart, yStart, xEnd, yEnd));
  } catch (err) {
    next(err);
  }
});

app.get('/pfps/*', (req: Request, res: Response) => {
  res.json(getImage(req.path.substring(6)));
});

// Keep this BENEATH route definitions
// handles errors nicely
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  updateData();
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
