// DB row (snake_case) → Client format (camelCase) mappers

export function mapChild(c) {
  return {
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
  }
}

export function mapTask(t) {
  return {
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
  }
}

export function mapReward(r) {
  return {
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
  }
}

export function mapExchange(e) {
  return {
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
  }
}

export function mapPointLog(l) {
  return {
    logId: l.log_id,
    childId: l.child_id,
    taskId: l.task_id,
    type: l.type,
    points: l.points,
    reason: l.reason,
    emotion: l.emotion,
    operator: l.operator,
    createdAt: l.created_at,
  }
}

export function mapBadge(b) {
  return {
    childId: b.child_id,
    badgeId: b.badge_id,
    unlockedAt: b.unlocked_at,
  }
}

export function mapGrowthRecord(r) {
  return {
    recordId: r.record_id, childId: r.child_id, date: r.date,
    ageInMonths: r.age_in_months, height: r.height, weight: r.weight,
    headCircumference: r.head_circumference, bmi: r.bmi,
    heightPercentile: r.height_percentile, weightPercentile: r.weight_percentile,
    bmiPercentile: r.bmi_percentile, note: r.note, createdAt: r.created_at,
  }
}

export function mapTemperatureRecord(r) {
  return {
    recordId: r.record_id, childId: r.child_id, temperature: r.temperature,
    measureMethod: r.measure_method, measureTime: r.measure_time,
    symptoms: r.symptoms, note: r.note, createdAt: r.created_at,
  }
}

export function mapMedicationRecord(r) {
  return {
    recordId: r.record_id, childId: r.child_id, drugName: r.drug_name,
    genericName: r.generic_name, dosageForm: r.dosage_form,
    singleDose: r.single_dose, doseUnit: r.dose_unit,
    administrationTime: r.administration_time, route: r.route,
    reason: r.reason, note: r.note, createdAt: r.created_at,
  }
}

export function mapVaccinationRecord(r) {
  return {
    recordId: r.record_id, childId: r.child_id, vaccineName: r.vaccine_name,
    vaccineType: r.vaccine_type, doseNumber: r.dose_number,
    totalDoses: r.total_doses, date: r.date, batchNumber: r.batch_number,
    site: r.site, vaccinator: r.vaccinator, reactions: r.reactions,
    note: r.note, createdAt: r.created_at,
  }
}

export function mapMilestoneRecord(r) {
  return {
    recordId: r.record_id, childId: r.child_id, milestoneId: r.milestone_id,
    status: r.status, achievedDate: r.achieved_date, note: r.note,
    photoTaken: r.photo_taken, photoNote: r.photo_note, createdAt: r.created_at,
  }
}

export function mapSleepRecord(r) {
  return {
    recordId: r.record_id, childId: r.child_id, date: r.date,
    bedTime: r.bed_time, sleepTime: r.sleep_time,
    wakeTime: r.wake_time, getUpTime: r.get_up_time,
    durationMinutes: r.duration_minutes, naps: r.naps || [],
    totalNapMinutes: r.total_nap_minutes || 0,
    sleepQuality: r.sleep_quality, note: r.note || '',
    createdAt: r.created_at,
  }
}

export function mapEmergencyProfile(r) {
  return {
    profileId: r.profile_id, childId: r.child_id,
    bloodType: r.blood_type || 'unknown', rhFactor: r.rh_factor || 'positive',
    drugAllergies: r.drug_allergies || [],
    foodAllergies: r.food_allergies || [],
    otherAllergies: r.other_allergies || [],
    medicalConditions: r.medical_conditions || [],
    emergencyContacts: r.emergency_contacts || [],
    preferredHospital: r.preferred_hospital || '',
    hospitalAddress: r.hospital_address || '',
    hospitalPhone: r.hospital_phone || '',
    insuranceInfo: r.insurance_info || '',
    note: r.note || '',
    updatedAt: r.updated_at, createdAt: r.created_at,
  }
}

export function mapSafetyChecklistProgress(r) {
  return {
    id: r.id, childId: r.child_id,
    checklistItemId: r.checklist_item_id,
    completed: r.completed,
    completedAt: r.completed_at,
    createdAt: r.created_at,
  }
}

export function mapKnowledgeArticle(a) {
  return {
    articleId: a.article_id, category: a.category, ageGroup: a.age_group,
    title: a.title, summary: a.summary, content: a.content, icon: a.icon,
    tags: a.tags || [], sourceName: a.source_name, sourceLevel: a.source_level,
    sourceUrl: a.source_url, relatedArticleIds: a.related_article_ids || [],
    sortOrder: a.sort_order, isPublished: a.is_published,
    viewCount: a.view_count, createdAt: a.created_at, updatedAt: a.updated_at,
  }
}

export function mapKnowledgeBookmark(b) {
  return {
    id: b.id, familyId: b.family_id, articleId: b.article_id, createdAt: b.created_at,
  }
}

// Client format (camelCase) → DB row (snake_case) mappers

export function childToRow(c, familyId) {
  return {
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
  }
}

export function taskToRow(t, familyId) {
  return {
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
  }
}

export function rewardToRow(r, familyId) {
  return {
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
  }
}

export function exchangeToRow(e, familyId) {
  return {
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
  }
}

export function pointLogToRow(l, familyId) {
  return {
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
  }
}

// ===== Emotion module =====

export function mapMoodRecord(r) {
  return {
    recordId: r.record_id, childId: r.child_id, date: r.date,
    moodValue: r.mood_value, moodEmoji: r.mood_emoji, moodLabel: r.mood_label,
    subEmotion: r.sub_emotion, reason: r.reason,
    journalEntry: r.journal_entry, ageGroup: r.age_group,
    createdAt: r.created_at,
  }
}

export function mapConflictRecord(r) {
  return {
    conflictId: r.conflict_id, childId: r.child_id, date: r.date,
    description: r.description, childFeeling: r.child_feeling,
    parentFeeling: r.parent_feeling, agreements: r.agreements || [],
    status: r.status, note: r.note || '',
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function getToday() {
  return new Date().toISOString().split('T')[0]
}

export function getYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}
