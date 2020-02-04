import nodemailer from 'nodemailer';
import chalk from 'chalk';
import { v4 } from 'uuid';
import { Request } from 'express';
import { redis } from '../redis';

export const createConfirmationUrl = async (userId: number, language: string, reset = false) => {
  const confirmationId = v4();

  // token expires in 1 day
  await redis.set(confirmationId, userId, 'ex', 60 * 60 * 24);

  const url = reset
    ? `${process.env.CLIENT_URI}/password-reset-performed?cid=${confirmationId}&lang=${language}`
    : `${process.env.CLIENT_URI}/confirmation-performed?cid=${confirmationId}&lang=${language}`;

  return url;
};

export const sendConfirmationEmail = async (
  language: string,
  email: string,
  username: string,
  url: string,
  reset = false,
) => {
  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: proccess.env.EMAIL, // generated ethereal user
      pass: proccess.env.EMAIL_PASS, // generated ethereal password
    
  });

  let subject = '';
  let html = '';

  if (reset && language === 'en') {
    subject = 'Hookah Notes - Password reset confirmation';
    html = `<div style="margin:10px auto;max-width:550px;font-size:14px;text-align:center;font-family:Helvetica,sans-serif;">
              <a href="#">
                <img src="https://i.ibb.co/g4PWtZQ/logo-light.png" alt="Hookah Notes Logo" width="124px" height="124px">
              </a>
              <div style="text-align:center;font-family:Helvetica,sans-serif;font-size:22px;font-weight:bold;margin:30px 0;color:#000000;">Hello from Hookah Notes!</div>
              <p style="margin:40px 0">You have initiated password reset for the account with username: <b>${username}</b>.<br>Please, confirm this action by clicking the link below:</p>
              <a href="${url}" style="font-size:16px;background:#7e60fa;padding:12px 70px;width:300px;color:#ffffff;border-radius:6px;text-decoration:none;">Reset password</a>
              <div style="color:#70787d;font-size:12px;margin-top:20px;">This link will expire in 24 hours.</div>
            </div>`;
  } else if (!reset && language === 'en') {
    subject = 'Hookah Notes - Email confirmation';
    html = `<div style="margin:10px auto;max-width:550px;font-size:14px;text-align:center;font-family:Helvetica,sans-serif;">
              <a href="#">
                <img src="https://i.ibb.co/g4PWtZQ/logo-light.png" alt="Hookah Notes Logo" width="124px" height="124px">
              </a>
              <div style="text-align:center;font-family:Helvetica,sans-serif;font-size:22px;font-weight:bold;margin:30px 0;color:#000000;">Hello from Hookah Notes!</div>
              <p style="margin:40px 0">You have created a Hookah Notes account with username: <b>${username}</b>.<br>Please, confirm your email by clicking the link below:</p>
              <a href="${url}" style="font-size:16px;background:#7e60fa;padding:12px 70px;width:300px;color:#ffffff;border-radius:6px;text-decoration:none;">Confirm email</a>
              <div style="color:#70787d;font-size:12px;margin-top:20px;">This link will expire in 24 hours.</div>
            </div>`;
  } else if (reset && language === 'ru') {
    subject = 'Hookah Notes - Подтверждение смены пароля';
    html = `<div style="margin:10px auto;max-width:550px;font-size:14px;text-align:center;font-family:Helvetica,sans-serif;">
              <a href="#">
                <img src="https://i.ibb.co/g4PWtZQ/logo-light.png" alt="Hookah Notes Logo" width="124px" height="124px">
              </a>
              <div style="text-align:center;font-family:Helvetica,sans-serif;font-size:22px;font-weight:bold;margin:30px 0;color:#000000;">Привет от Hookah Notes!</div>
              <p style="margin:40px 0">Вы инициировали смену пароля для аккаунта с именем пользовтеля: <b>${username}</b>.<br>Пожалуйста, подтвердите это действие, перейдя по ссылке ниже:</p>
              <a href="${url}" style="font-size:16px;background:#7e60fa;padding:12px 70px;width:300px;color:#ffffff;border-radius:6px;text-decoration:none;">Сменить пароль</a>
              <div style="color:#70787d;font-size:12px;margin-top:20px;">Эта ссылка станет недействительной через 24 часа.</div>
            </div>`;
  } else if (!reset && language === 'ru') {
    subject = 'Hookah Notes - Подтверждение электронной почты';
    html = `<div style="margin:10px auto;max-width:550px;font-size:14px;text-align:center;font-family:Helvetica,sans-serif;">
              <a href="#">
                <img src="https://i.ibb.co/g4PWtZQ/logo-light.png" alt="Hookah Notes Logo" width="124px" height="124px">
              </a>
              <div style="text-align:center;font-family:Helvetica,sans-serif;font-size:22px;font-weight:bold;margin:30px 0;color:#000000;">Привет от Hookah Notes!</div>
              <p style="margin:40px 0">Вы создали аккунт Hookah Notes с именем пользователя: <b>${username}</b>.<br>Пожалуйста, подтвердите электронную почту перейдя по ссылке ниже:</p>
              <a href="${url}" style="font-size:16px;background:#7e60fa;padding:12px 70px;width:300px;color:#ffffff;border-radius:6px;text-decoration:none;">Подтвердить почту</a>
              <div style="color:#70787d;font-size:12px;margin-top:20px;">Эта ссылка станет недействительной через 24 часа.</div>
            </div>`;
  }

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"HookahNotes" <hookahnotes@gmail.com>', // sender address
    to: email, // list of receivers
    subject: subject, // Subject line
    html: html,
  });

  console.log('Message sent: %s', info.messageId);
};

export const confirm = async (req: Request, language: string) => {
  let ok: boolean;
  let message: string;
  let userId: string | null = null;
  let confirmationId: string;

  const confirmationHeader = req.headers['confirm_action'] as string;
  if (confirmationHeader) {
    confirmationId = confirmationHeader.split(' ')[1];

    userId = await redis.get(confirmationId);
    if (userId) {
      try {
        await redis.del(confirmationId);
        ok = true;
        message = language === 'en' ? 'Successfully confirmed' : 'Подтверждение выполнено';
      } catch (err) {
        console.log(chalk.redBright('Something went wrong:\n' + err));
        ok = false;
        message = language === 'en' ? 'Something went wrong' : 'Что-то пошло не так';
      }
    } else {
      ok = false;
      message = language === 'en' ? 'Сonfirmation ID is invalid' : 'ID подтверждения не действителен';
    }
  } else {
    ok = false;
    message = language === 'en' ? 'No confirmation ID provided' : 'ID подтверждения не предоставлен';
  }

  return {
    ok,
    message,
    userId,
  };
};
