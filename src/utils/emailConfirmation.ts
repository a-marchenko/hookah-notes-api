import nodemailer from 'nodemailer';
import { v4 } from 'uuid';
import { redis } from '../redis';

export const createConfirmationUrl = async (userId: number) => {
  const token = v4();

  // token expires in 1 day
  await redis.set(token, userId, 'ex', 60 * 60 * 24);

  const url = `${process.env.CLIENT_URI}/user/confirm/${token}`;

  return url;
};

export const sendConfirmationEmail = async (email: string, username: string, url: string) => {
  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'hookahnotes@gmail.com', // generated ethereal user
      pass: 'N;a+Vbf7sPGD9t_P', // generated ethereal password
    },
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"HookahNotes" <hookahnotes@gmail.com>', // sender address
    to: email, // list of receivers
    subject: 'Hookah Notes email confirmation', // Subject line
    html: `<div style="margin:10px auto;max-width:550px;font-size:14px;text-align:center;font-family:Helvetica,sans-serif;"><a href="#"><img src="https://i.ibb.co/2W40VKP/favicon.png" width="124px" height="124px"></a><div style="text-align:center;font-family:Helvetica,sans-serif;font-size:22px;font-weight:bold;margin:30px 0;color:#000000;">Hello from Hookah Notes!</div><p style="margin:40px 0">You have created a Hookah Notes account with username: <b>${username}</b>.<br>Please, confirm your email by clicking the link below:</p><a href="${url}" style="font-size:16px;background:#5f4591;padding:10px 70px;width:300px;color:#ffffff;border-radius:20px;text-decoration:none;">Confirm Your Email</a><div style="color:#70787d;font-size:12px;margin-top:20px;">This link will expire in 24 hours.</div></div>`, // html body
  });

  console.log('Message sent: %s', info.messageId);
};
