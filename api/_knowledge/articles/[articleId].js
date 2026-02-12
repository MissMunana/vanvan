import supabase from '../../_lib/supabase-admin.js';
import { mapKnowledgeArticle } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { articleId } = req.query;

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('article_id', articleId)
    .eq('is_published', true)
    .single();

  if (error) return res.status(404).json({ error: 'Article not found' });

  // Increment view count non-blocking
  supabase.from('knowledge_articles')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('article_id', articleId)
    .then(() => {});

  return res.status(200).json(mapKnowledgeArticle(data));
}
