import indexHandler from './_rewards/index.js';
import batchHandler from './_rewards/batch.js';
import rewardIdHandler from './_rewards/[rewardId].js';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/rewards', '');
  const segments = path.split('/').filter(Boolean);

  // /api/rewards
  if (segments.length === 0) return indexHandler(req, res);

  // /api/rewards/batch
  if (segments[0] === 'batch') return batchHandler(req, res);

  // /api/rewards/:rewardId
  if (segments.length === 1) {
    req.query = { ...req.query, rewardId: segments[0] };
    return rewardIdHandler(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}
