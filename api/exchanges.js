import indexHandler from './_exchanges/index.js';
import pendingHandler from './_exchanges/pending.js';
import reviewHandler from './_exchanges/[exchangeId]/review.js';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/exchanges', '');
  const segments = path.split('/').filter(Boolean);

  // /api/exchanges
  if (segments.length === 0) return indexHandler(req, res);

  // /api/exchanges/pending
  if (segments[0] === 'pending') return pendingHandler(req, res);

  // /api/exchanges/:exchangeId/review
  if (segments.length === 2 && segments[1] === 'review') {
    req.query = { ...req.query, exchangeId: segments[0] };
    return reviewHandler(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}
