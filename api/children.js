import childrenIndex from './_children/index.js';
import childById from './_children/[childId].js';
import childPoints from './_children/[childId]/points.js';
import healthGrowth from './_children/[childId]/health/growth.js';
import healthTemperature from './_children/[childId]/health/temperature.js';
import healthMedication from './_children/[childId]/health/medication.js';
import healthVaccination from './_children/[childId]/health/vaccination.js';
import healthMilestone from './_children/[childId]/health/milestone.js';
import healthSleep from './_children/[childId]/health/sleep.js';
import healthMoods from './_children/[childId]/health/moods.js';
import healthConflicts from './_children/[childId]/health/conflicts.js';
import emergencyProfile from './_children/[childId]/emergency/profile.js';
import emergencyChecklist from './_children/[childId]/emergency/checklist.js';
// Cross-domain list handlers
import tasksIndex from './_tasks/index.js';
import rewardsIndex from './_rewards/index.js';
import exchangesIndex from './_exchanges/index.js';
import pointLogsIndex from './_point-logs/index.js';
import badgesIndex from './_badges/index.js';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/children', '');
  const segments = path.split('/').filter(Boolean);

  // /api/children
  if (segments.length === 0) return childrenIndex(req, res);

  const childId = segments[0];

  // /api/children/:childId
  if (segments.length === 1) {
    req.query = { ...req.query, childId };
    return childById(req, res);
  }

  const resource = segments[1];

  // /api/children/:childId/points
  if (resource === 'points') {
    req.query = { ...req.query, childId };
    return childPoints(req, res);
  }

  // /api/children/:childId/tasks
  if (resource === 'tasks') {
    req.query = { ...req.query, childId };
    return tasksIndex(req, res);
  }

  // /api/children/:childId/rewards
  if (resource === 'rewards') {
    req.query = { ...req.query, childId };
    return rewardsIndex(req, res);
  }

  // /api/children/:childId/exchanges
  if (resource === 'exchanges') {
    req.query = { ...req.query, childId };
    return exchangesIndex(req, res);
  }

  // /api/children/:childId/point-logs
  if (resource === 'point-logs') {
    req.query = { ...req.query, childId };
    return pointLogsIndex(req, res);
  }

  // /api/children/:childId/badges
  if (resource === 'badges') {
    req.query = { ...req.query, childId };
    return badgesIndex(req, res);
  }

  // /api/children/:childId/health/:type
  if (resource === 'health' && segments.length === 3) {
    req.query = { ...req.query, childId };
    const healthType = segments[2];
    if (healthType === 'growth') return healthGrowth(req, res);
    if (healthType === 'temperature') return healthTemperature(req, res);
    if (healthType === 'medication') return healthMedication(req, res);
    if (healthType === 'vaccination') return healthVaccination(req, res);
    if (healthType === 'milestone') return healthMilestone(req, res);
    if (healthType === 'sleep') return healthSleep(req, res);
    if (healthType === 'moods') return healthMoods(req, res);
    if (healthType === 'conflicts') return healthConflicts(req, res);
  }

  // /api/children/:childId/emergency/:type
  if (resource === 'emergency' && segments.length === 3) {
    req.query = { ...req.query, childId };
    const emergencyType = segments[2];
    if (emergencyType === 'profile') return emergencyProfile(req, res);
    if (emergencyType === 'checklist') return emergencyChecklist(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}
