import supabase from './_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from './_lib/auth-helpers.js';
import { mapChild, mapTask, mapReward, generateId } from './_lib/mappers.js';

const THEME_COLORS = ['#FFB800', '#4ECDC4', '#FF6B6B', '#A8A8E6', '#95E1D3'];

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true,
  screenTime: {
    dailyLimitMinutes: 30,
    lockStartHour: 22,
    lockEndHour: 6,
    enabled: false,
  },
};

function getAgeGroup(age) {
  if (age <= 5) return '3-5';
  if (age <= 8) return '6-8';
  return '9-12';
}

function getAgeFromBirthday(birthday) {
  const birth = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  return years;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { child: childInput, parentPin, tasks: tasksInput, rewards: rewardsInput } = req.body;

  if (!childInput?.name || !childInput?.birthday) {
    return res.status(400).json({ error: 'child.name and child.birthday are required' });
  }

  try {
    const now = new Date().toISOString();
    const age = getAgeFromBirthday(childInput.birthday);
    const childId = generateId();

    // 1. Create child
    const childRow = {
      child_id: childId,
      family_id: familyId,
      name: childInput.name,
      gender: childInput.gender || 'male',
      birthday: childInput.birthday,
      age,
      age_group: getAgeGroup(age),
      avatar: childInput.avatar || '🐱',
      total_points: 0,
      theme_color: THEME_COLORS[0],
      settings: DEFAULT_SETTINGS,
      created_at: now,
    };

    const { data: childData, error: childError } = await supabase
      .from('children')
      .insert(childRow)
      .select()
      .single();

    if (childError) throw childError;

    // 2. Create tasks
    let taskData = [];
    if (tasksInput?.length) {
      const taskRows = tasksInput.map((t) => ({
        task_id: generateId(),
        child_id: childId,
        family_id: familyId,
        name: t.name,
        category: t.category || 'life',
        points: t.points || 5,
        icon: t.icon || '⭐',
        description: t.description || '',
        is_active: t.isActive !== false,
        frequency: t.frequency || 'daily',
        consecutive_days: 0,
        last_completed_date: null,
        completed_today: false,
        stage: 'start',
        total_completions: 0,
        created_at: now,
      }));

      const { data, error } = await supabase.from('tasks').insert(taskRows).select();
      if (error) throw error;
      taskData = data || [];
    }

    // 3. Create rewards
    let rewardData = [];
    if (rewardsInput?.length) {
      const rewardRows = rewardsInput.map((r) => ({
        reward_id: generateId(),
        child_id: childId,
        family_id: familyId,
        name: r.name,
        category: r.category || 'time',
        points: r.points || 10,
        icon: r.icon || '🎁',
        description: r.description || '',
        limit: r.limit || { type: 'unlimited', count: 0 },
        stock: r.stock ?? -1,
        is_active: r.isActive !== false,
        created_at: now,
      }));

      const { data, error } = await supabase.from('rewards').insert(rewardRows).select();
      if (error) throw error;
      rewardData = data || [];
    }

    // 4. Update family settings
    const { data: familyData, error: familyUpdateError } = await supabase
      .from('families')
      .update({
        parent_pin: parentPin || '1234',
        onboarding_completed: true,
        updated_at: now,
      })
      .eq('family_id', familyId)
      .select()
      .single();

    if (familyUpdateError) throw familyUpdateError;

    return res.status(201).json({
      child: mapChild(childData),
      tasks: taskData.map(mapTask),
      rewards: rewardData.map(mapReward),
      family: {
        familyId: familyData.family_id,
        parentPin: familyData.parent_pin,
        onboardingCompleted: familyData.onboarding_completed,
        completionCount: familyData.completion_count,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
