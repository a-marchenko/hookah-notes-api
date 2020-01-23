import express from 'express';
import chalk from 'chalk';

import { refreshTokens, invalidateTokens } from './services/auth';
import { confirm, createConfirmationUrl, sendConfirmationEmail } from './services/confirmation';
import { User } from './entity/User';

const router = express.Router();

router.put('/refresh_tokens', async (req, res) => {
  const { ok, accessToken, refreshToken, language } = await refreshTokens(req);
  return res
    .status(ok ? 201 : 403)
    .send({ ok: ok, accessToken: accessToken, refreshToken: refreshToken, language: language });
});

router.put('/invalidate_tokens', async (req, res) => {
  const { ok, message } = await invalidateTokens(req);
  return res.status(ok ? 200 : 403).send({ ok: ok, message: message });
});

router.delete('/confirm_email', async (req, res) => {
  const language: string = req.query.lang ? req.query.lang : 'en';
  let { ok, message, userId } = await confirm(req, language);
  if (userId) {
    try {
      await User.update(parseInt(userId, 10), { confirmed: true });
    } catch (err) {
      console.log(chalk.redBright('Something went wrong:\n' + err));
      ok = false;
      message = 'Something went wrong';
    }
  }
  return res.status(ok ? 200 : 403).send({ ok: ok, message: message });
});

router.post('/request_password_reset/:login', async (req, res) => {
  try {
    const login = req.params.login;
    let message: string;
    let user: User | undefined;
    if (login.includes('@')) {
      user = await User.findOne({ where: { email: login } });
    } else {
      user = await User.findOne({ where: { username: login } });
    }
    if (user) {
      await sendConfirmationEmail(
        user.language,
        user.email,
        user.username,
        await createConfirmationUrl(user.id, user.language, true),
        true,
      );
      message = user.language === 'en' ? 'Successfully requsted' : 'Успешно запрошено';
      return res.status(201).send({ ok: true, message: message });
    } else {
      message = 'User not found';
      return res.status(404).send({ ok: false, message: message });
    }
  } catch (err) {
    console.log(chalk.redBright('Something went wrong:\n' + err));
    return res.status(403).send({ ok: false, message: 'Something went wrong' });
  }
});

router.delete('/confirm_password_reset', async (req, res) => {
  const language: string = req.query.lang ? req.query.lang : 'en';
  const { ok, message, userId } = await confirm(req, language);
  return res.status(ok ? 200 : 404).send({ ok: ok, message: message, userId: userId });
});

export default router;
