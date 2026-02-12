import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapKnowledgeBookmark, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('knowledge_bookmarks')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(mapKnowledgeBookmark));
  }

  if (req.method === 'POST') {
    const { articleId } = req.body;
    if (!articleId) return res.status(400).json({ error: 'articleId is required' });

    const row = {
      id: generateId(),
      family_id: familyId,
      article_id: articleId,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('knowledge_bookmarks')
      .upsert(row, { onConflict: 'family_id,article_id' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapKnowledgeBookmark(data));
  }

  if (req.method === 'DELETE') {
    const { articleId } = req.query;
    if (!articleId) return res.status(400).json({ error: 'articleId is required' });

    const { error } = await supabase
      .from('knowledge_bookmarks')
      .delete()
      .eq('family_id', familyId)
      .eq('article_id', articleId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
