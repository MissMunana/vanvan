import articlesIndex from './_knowledge/articles/index.js';
import articleById from './_knowledge/articles/[articleId].js';
import bookmarksHandler from './_knowledge/bookmarks/index.js';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/knowledge', '');
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) {
    return res.status(200).json({ status: 'ok', module: 'knowledge' });
  }

  const type = segments[0];

  // /api/knowledge/articles
  if (type === 'articles' && segments.length === 1) return articlesIndex(req, res);

  // /api/knowledge/articles/:articleId
  if (type === 'articles' && segments.length === 2) {
    req.query = { ...req.query, articleId: segments[1] };
    return articleById(req, res);
  }

  // /api/knowledge/bookmarks and /api/knowledge/bookmarks/:articleId
  if (type === 'bookmarks') {
    if (segments.length === 2) {
      req.query = { ...req.query, articleId: segments[1] };
    }
    return bookmarksHandler(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}
