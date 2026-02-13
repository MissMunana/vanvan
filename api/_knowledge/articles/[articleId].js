import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, unauthorized } from '../../_lib/auth-helpers.js';
import { mapKnowledgeArticle } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { articleId } = req.query;

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('article_id', articleId)
    .eq('is_published', true)
    .single();

  if (error) return res.status(404).json({ error: 'Article not found' });

  // Increment view count atomically via RPC, non-blocking
  supabase.rpc('increment_view_count', { target_article_id: articleId }).catch(() => {});

  return res.status(200).json(mapKnowledgeArticle(data));
}
