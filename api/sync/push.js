import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized, methodNotAllowed } from '../_lib/auth-helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { appState, children, tasks, rewards, exchanges, pointLogs, badges, health } = req.body;
  const counts = {};

  try {
    // Update family settings
    if (appState) {
      await supabase.from('families').update({
        parent_pin: appState.parentPin || '1234',
        onboarding_completed: appState.onboardingCompleted || false,
        completion_count: appState.completionCount || 0,
        updated_at: new Date().toISOString(),
      }).eq('family_id', familyId);
    }

    // Upsert children
    if (children?.length) {
      const rows = children.map(c => ({
        child_id: c.childId,
        family_id: familyId,
        name: c.name,
        gender: c.gender,
        birthday: c.birthday,
        age: c.age,
        age_group: c.ageGroup,
        avatar: c.avatar,
        total_points: c.totalPoints,
        theme_color: c.themeColor || null,
        settings: c.settings,
        created_at: c.createdAt,
      }));
      const { error } = await supabase.from('children').upsert(rows, { onConflict: 'child_id' });
      if (error) throw new Error('children: ' + error.message);
      counts.children = rows.length;
    }

    // Upsert tasks
    if (tasks?.length) {
      const rows = tasks.map(t => ({
        task_id: t.taskId,
        child_id: t.childId,
        family_id: familyId,
        name: t.name,
        category: t.category,
        points: t.points,
        icon: t.icon,
        description: t.description || '',
        is_active: t.isActive,
        frequency: t.frequency,
        consecutive_days: t.consecutiveDays,
        last_completed_date: t.lastCompletedDate || null,
        completed_today: t.completedToday,
        stage: t.stage,
        total_completions: t.totalCompletions,
        created_at: t.createdAt,
      }));
      const { error } = await supabase.from('tasks').upsert(rows, { onConflict: 'task_id' });
      if (error) throw new Error('tasks: ' + error.message);
      counts.tasks = rows.length;
    }

    // Upsert rewards
    if (rewards?.length) {
      const rows = rewards.map(r => ({
        reward_id: r.rewardId,
        child_id: r.childId,
        family_id: familyId,
        name: r.name,
        category: r.category,
        points: r.points,
        icon: r.icon,
        description: r.description || '',
        limit: r.limit,
        stock: r.stock,
        is_active: r.isActive,
        created_at: r.createdAt,
      }));
      const { error } = await supabase.from('rewards').upsert(rows, { onConflict: 'reward_id' });
      if (error) throw new Error('rewards: ' + error.message);
      counts.rewards = rows.length;
    }

    // Upsert exchanges
    if (exchanges?.length) {
      const rows = exchanges.map(e => ({
        exchange_id: e.exchangeId,
        child_id: e.childId,
        family_id: familyId,
        reward_id: e.rewardId,
        reward_name: e.rewardName,
        reward_icon: e.rewardIcon,
        points: e.points,
        status: e.status,
        requested_at: e.requestedAt,
        reviewed_at: e.reviewedAt || null,
        reject_reason: e.rejectReason || null,
      }));
      const { error } = await supabase.from('exchanges').upsert(rows, { onConflict: 'exchange_id' });
      if (error) throw new Error('exchanges: ' + error.message);
      counts.exchanges = rows.length;
    }

    // Upsert point logs
    if (pointLogs?.length) {
      const rows = pointLogs.map(l => ({
        log_id: l.logId,
        child_id: l.childId,
        family_id: familyId,
        task_id: l.taskId || null,
        type: l.type,
        points: l.points,
        reason: l.reason,
        emotion: l.emotion || null,
        operator: l.operator,
        created_at: l.createdAt,
      }));
      const { error } = await supabase.from('point_logs').upsert(rows, { onConflict: 'log_id' });
      if (error) throw new Error('point_logs: ' + error.message);
      counts.pointLogs = rows.length;
    }

    // Upsert badges
    if (badges?.length) {
      const rows = badges.map(b => ({
        child_id: b.childId,
        family_id: familyId,
        badge_id: b.badgeId,
        unlocked_at: b.unlockedAt,
      }));
      // Use upsert with the unique constraint on (child_id, badge_id)
      for (const row of rows) {
        await supabase.from('unlocked_badges').upsert(row, {
          onConflict: 'child_id,badge_id',
        });
      }
      counts.badges = rows.length;
    }

    // Upsert health records
    if (health) {
      if (health.growthRecords?.length) {
        const rows = health.growthRecords.map(r => ({
          record_id: r.recordId, child_id: r.childId, family_id: familyId,
          date: r.date, age_in_months: r.ageInMonths,
          height: r.height, weight: r.weight, head_circumference: r.headCircumference,
          bmi: r.bmi, height_percentile: r.heightPercentile,
          weight_percentile: r.weightPercentile, bmi_percentile: r.bmiPercentile,
          note: r.note || '', created_at: r.createdAt,
        }));
        await supabase.from('growth_records').upsert(rows, { onConflict: 'record_id' });
        counts.growthRecords = rows.length;
      }

      if (health.temperatureRecords?.length) {
        const rows = health.temperatureRecords.map(r => ({
          record_id: r.recordId, child_id: r.childId, family_id: familyId,
          temperature: r.temperature, measure_method: r.measureMethod,
          measure_time: r.measureTime, symptoms: r.symptoms,
          note: r.note || '', created_at: r.createdAt,
        }));
        await supabase.from('temperature_records').upsert(rows, { onConflict: 'record_id' });
        counts.temperatureRecords = rows.length;
      }

      if (health.medicationRecords?.length) {
        const rows = health.medicationRecords.map(r => ({
          record_id: r.recordId, child_id: r.childId, family_id: familyId,
          drug_name: r.drugName, generic_name: r.genericName || '',
          dosage_form: r.dosageForm, single_dose: r.singleDose,
          dose_unit: r.doseUnit || 'ml', administration_time: r.administrationTime,
          route: r.route, reason: r.reason || '', note: r.note || '',
          created_at: r.createdAt,
        }));
        await supabase.from('medication_records').upsert(rows, { onConflict: 'record_id' });
        counts.medicationRecords = rows.length;
      }

      if (health.vaccinationRecords?.length) {
        const rows = health.vaccinationRecords.map(r => ({
          record_id: r.recordId, child_id: r.childId, family_id: familyId,
          vaccine_name: r.vaccineName, vaccine_type: r.vaccineType,
          dose_number: r.doseNumber, total_doses: r.totalDoses,
          date: r.date, batch_number: r.batchNumber || '',
          site: r.site || '', vaccinator: r.vaccinator || '',
          reactions: r.reactions || [], note: r.note || '',
          created_at: r.createdAt,
        }));
        await supabase.from('vaccination_records').upsert(rows, { onConflict: 'record_id' });
        counts.vaccinationRecords = rows.length;
      }

      if (health.milestoneRecords?.length) {
        const rows = health.milestoneRecords.map(r => ({
          record_id: r.recordId, child_id: r.childId, family_id: familyId,
          milestone_id: r.milestoneId, status: r.status,
          achieved_date: r.achievedDate || null, note: r.note || '',
          photo_taken: r.photoTaken || false, photo_note: r.photoNote || null,
          created_at: r.createdAt,
        }));
        await supabase.from('milestone_records').upsert(rows, { onConflict: 'record_id' });
        counts.milestoneRecords = rows.length;
      }
    }

    return res.status(200).json({ success: true, counts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
