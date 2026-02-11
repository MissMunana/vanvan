import pushHandler from './_sync/push.js';
import pullHandler from './_sync/pull.js';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/sync', '');
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'push') return pushHandler(req, res);
  if (segments[0] === 'pull') return pullHandler(req, res);

  return res.status(404).json({ error: 'Not found' });
}
