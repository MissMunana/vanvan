import growthIndex from './_health/growth/index.js';
import growthRecord from './_health/growth/[recordId].js';
import temperatureIndex from './_health/temperature/index.js';
import temperatureRecord from './_health/temperature/[recordId].js';
import medicationIndex from './_health/medication/index.js';
import medicationRecord from './_health/medication/[recordId].js';
import vaccinationIndex from './_health/vaccination/index.js';
import vaccinationRecord from './_health/vaccination/[recordId].js';
import milestoneIndex from './_health/milestone/index.js';
import sleepIndex from './_health/sleep/index.js';
import sleepRecord from './_health/sleep/[recordId].js';
import emergencyProfileIndex from './_health/emergency-profile/index.js';
import emergencyChecklistIndex from './_health/emergency-checklist/index.js';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/health', '');
  const segments = path.split('/').filter(Boolean);

  // /api/health — health check
  if (segments.length === 0) {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }

  const type = segments[0];
  const recordId = segments[1];

  // /api/health/:type
  if (segments.length === 1) {
    if (type === 'growth') return growthIndex(req, res);
    if (type === 'temperature') return temperatureIndex(req, res);
    if (type === 'medication') return medicationIndex(req, res);
    if (type === 'vaccination') return vaccinationIndex(req, res);
    if (type === 'milestone') return milestoneIndex(req, res);
    if (type === 'sleep') return sleepIndex(req, res);
    if (type === 'emergency-profile') return emergencyProfileIndex(req, res);
    if (type === 'emergency-checklist') return emergencyChecklistIndex(req, res);
  }

  // /api/health/:type/:recordId
  if (segments.length === 2) {
    req.query = { ...req.query, recordId };
    if (type === 'growth') return growthRecord(req, res);
    if (type === 'temperature') return temperatureRecord(req, res);
    if (type === 'medication') return medicationRecord(req, res);
    if (type === 'vaccination') return vaccinationRecord(req, res);
    if (type === 'sleep') return sleepRecord(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}
