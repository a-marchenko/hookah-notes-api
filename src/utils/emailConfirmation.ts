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
    subject: 'Hookah Notes account confirmation', // Subject line
    html: `<h3>Hello ${username}!</h3><p>Please, confirm your email by clicking the link below:</p><br><a href="${url}">${url}</a>`, // html body
  });

  console.log('Message sent: %s', info.messageId);
};
