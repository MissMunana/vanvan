import supabase from '../../_lib/supabase-admin.js';
import { mapKnowledgeArticle } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const category = url.searchParams.get('category');
  const ageGroup = url.searchParams.get('ageGroup');
  const search = url.searchParams.get('search');

  let query = supabase
    .from('knowledge_articles')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(100);

  if (category) query = query.eq('category', category);
  if (ageGroup) query = query.eq('age_group', ageGroup);
  if (search) query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // List view: exclude full content to reduce payload
  const articles = (data || []).map(mapKnowledgeArticle).map(({ content, ...rest }) => rest);
  return res.status(200).json(articles);
}
