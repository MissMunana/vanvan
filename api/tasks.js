import indexHandler from './_tasks/index.js';
import batchHandler from './_tasks/batch.js';
import taskIdHandler from './_tasks/[taskId].js';
import completeHandler from './_tasks/[taskId]/complete.js';
import undoHandler from './_tasks/[taskId]/undo.js';
import confirmHandler from './_tasks/[taskId]/confirm.js';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/tasks', '');
  const segments = path.split('/').filter(Boolean);

  // /api/tasks
  if (segments.length === 0) return indexHandler(req, res);

  // /api/tasks/batch
  if (segments[0] === 'batch') return batchHandler(req, res);

  // /api/tasks/:taskId
  if (segments.length === 1) {
    req.query = { ...req.query, taskId: segments[0] };
    return taskIdHandler(req, res);
  }

  // /api/tasks/:taskId/complete
  if (segments.length === 2 && segments[1] === 'complete') {
    req.query = { ...req.query, taskId: segments[0] };
    return completeHandler(req, res);
  }

  // /api/tasks/:taskId/undo
  if (segments.length === 2 && segments[1] === 'undo') {
    req.query = { ...req.query, taskId: segments[0] };
    return undoHandler(req, res);
  }

  // /api/tasks/:taskId/confirm
  if (segments.length === 2 && segments[1] === 'confirm') {
    req.query = { ...req.query, taskId: segments[0] };
    return confirmHandler(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}
