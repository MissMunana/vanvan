import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized, methodNotAllowed } from '../_lib/auth-helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  try {
    const [
      { data: family },
      { data: children },
      { data: tasks },
      { data: rewards },
      { data: exchanges },
      { data: pointLogs },
      { data: badges },
      { data: growthRecords },
      { data: temperatureRecords },
      { data: medicationRecords },
      { data: vaccinationRecords },
      { data: milestoneRecords },
    ] = await Promise.all([
      supabase.from('families').select('*').eq('family_id', familyId).single(),
      supabase.from('children').select('*').eq('family_id', familyId),
      supabase.from('tasks').select('*').eq('family_id', familyId),
      supabase.from('rewards').select('*').eq('family_id', familyId),
      supabase.from('exchanges').select('*').eq('family_id', familyId),
      supabase.from('point_logs').select('*').eq('family_id', familyId).order('created_at', { ascending: false }).limit(200),
      supabase.from('unlocked_badges').select('*').eq('family_id', familyId),
      supabase.from('growth_records').select('*').eq('family_id', familyId),
      supabase.from('temperature_records').select('*').eq('family_id', familyId),
      supabase.from('medication_records').select('*').eq('family_id', familyId),
      supabase.from('vaccination_records').select('*').eq('family_id', familyId),
      supabase.from('milestone_records').select('*').eq('family_id', familyId),
    ]);

    // Map DB rows back to client-side format
    const mappedChildren = (children || []).map(c => ({
      childId: c.child_id,
      name: c.name,
      gender: c.gender,
      birthday: c.birthday,
      age: c.age,
      ageGroup: c.age_group,
      avatar: c.avatar,
      totalPoints: c.total_points,
      themeColor: c.theme_color,
      settings: c.settings,
      createdAt: c.created_at,
    }));

    const mappedTasks = (tasks || []).map(t => ({
      taskId: t.task_id,
      childId: t.child_id,
      name: t.name,
      category: t.category,
      points: t.points,
      icon: t.icon,
      description: t.description,
      isActive: t.is_active,
      frequency: t.frequency,
      consecutiveDays: t.consecutive_days,
      lastCompletedDate: t.last_completed_date,
      completedToday: t.completed_today,
      stage: t.stage,
      totalCompletions: t.total_completions,
      createdAt: t.created_at,
    }));

    const mappedRewards = (rewards || []).map(r => ({
      rewardId: r.reward_id,
      childId: r.child_id,
      name: r.name,
      category: r.category,
      points: r.points,
      icon: r.icon,
      description: r.description,
      limit: r.limit,
      stock: r.stock,
      isActive: r.is_active,
      createdAt: r.created_at,
    }));

    const mappedExchanges = (exchanges || []).map(e => ({
      exchangeId: e.exchange_id,
      childId: e.child_id,
      rewardId: e.reward_id,
      rewardName: e.reward_name,
      rewardIcon: e.reward_icon,
      points: e.points,
      status: e.status,
      requestedAt: e.requested_at,
      reviewedAt: e.reviewed_at,
      rejectReason: e.reject_reason,
    }));

    const mappedPointLogs = (pointLogs || []).map(l => ({
      logId: l.log_id,
      childId: l.child_id,
      taskId: l.task_id,
      type: l.type,
      points: l.points,
      reason: l.reason,
      emotion: l.emotion,
      operator: l.operator,
      createdAt: l.created_at,
    }));

    const mappedBadges = (badges || []).map(b => ({
      childId: b.child_id,
      badgeId: b.badge_id,
      unlockedAt: b.unlocked_at,
    }));

    const mappedHealth = {
      growthRecords: (growthRecords || []).map(r => ({
        recordId: r.record_id, childId: r.child_id, date: r.date,
        ageInMonths: r.age_in_months, height: r.height, weight: r.weight,
        headCircumference: r.head_circumference, bmi: r.bmi,
        heightPercentile: r.height_percentile, weightPercentile: r.weight_percentile,
        bmiPercentile: r.bmi_percentile, note: r.note, createdAt: r.created_at,
      })),
      temperatureRecords: (temperatureRecords || []).map(r => ({
        recordId: r.record_id, childId: r.child_id, temperature: r.temperature,
        measureMethod: r.measure_method, measureTime: r.measure_time,
        symptoms: r.symptoms, note: r.note, createdAt: r.created_at,
      })),
      medicationRecords: (medicationRecords || []).map(r => ({
        recordId: r.record_id, childId: r.child_id, drugName: r.drug_name,
        genericName: r.generic_name, dosageForm: r.dosage_form,
        singleDose: r.single_dose, doseUnit: r.dose_unit,
        administrationTime: r.administration_time, route: r.route,
        reason: r.reason, note: r.note, createdAt: r.created_at,
      })),
      vaccinationRecords: (vaccinationRecords || []).map(r => ({
        recordId: r.record_id, childId: r.child_id, vaccineName: r.vaccine_name,
        vaccineType: r.vaccine_type, doseNumber: r.dose_number,
        totalDoses: r.total_doses, date: r.date, batchNumber: r.batch_number,
        site: r.site, vaccinator: r.vaccinator, reactions: r.reactions,
        note: r.note, createdAt: r.created_at,
      })),
      milestoneRecords: (milestoneRecords || []).map(r => ({
        recordId: r.record_id, childId: r.child_id, milestoneId: r.milestone_id,
        status: r.status, achievedDate: r.achieved_date, note: r.note,
        photoTaken: r.photo_taken, photoNote: r.photo_note, createdAt: r.created_at,
      })),
    };

    return res.status(200).json({
      family: family ? {
        familyId: family.family_id,
        parentPin: family.parent_pin,
        onboardingCompleted: family.onboarding_completed,
        completionCount: family.completion_count,
      } : null,
      children: mappedChildren,
      tasks: mappedTasks,
      rewards: mappedRewards,
      exchanges: mappedExchanges,
      pointLogs: mappedPointLogs,
      badges: mappedBadges,
      health: mappedHealth,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
