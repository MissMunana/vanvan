import registerHandler from './_auth/register.js';
import loginHandler from './_auth/login.js';
import passkeyListHandler from './_auth/passkey/list.js';
import passkeyDeleteHandler from './_auth/passkey/delete.js';
import passkeyRegisterOptionsHandler from './_auth/passkey/register-options.js';
import passkeyRegisterVerifyHandler from './_auth/passkey/register-verify.js';
import passkeyLoginOptionsHandler from './_auth/passkey/login-options.js';
import passkeyLoginVerifyHandler from './_auth/passkey/login-verify.js';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/auth', '');
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'register') return registerHandler(req, res);
  if (segments[0] === 'login') return loginHandler(req, res);

  if (segments[0] === 'passkey') {
    const sub = segments[1];
    if (sub === 'list') return passkeyListHandler(req, res);
    if (sub === 'delete') return passkeyDeleteHandler(req, res);
    if (sub === 'register-options') return passkeyRegisterOptionsHandler(req, res);
    if (sub === 'register-verify') return passkeyRegisterVerifyHandler(req, res);
    if (sub === 'login-options') return passkeyLoginOptionsHandler(req, res);
    if (sub === 'login-verify') return passkeyLoginVerifyHandler(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}
