import type { AgeGroupConfig } from '../types'

const AGE_CONFIGS: Record<string, AgeGroupConfig> = {
  '3-5': {
    fontSize: {
      title: '1.5rem',
      body: '1.1rem',
      points: '2.5rem',
      button: '1.1rem',
    },
    buttonSize: '56px',
    iconSize: '48px',
    animationLevel: 'full',
  },
  '6-8': {
    fontSize: {
      title: '1.3rem',
      body: '1rem',
      points: '2.2rem',
      button: '1rem',
    },
    buttonSize: '48px',
    iconSize: '40px',
    animationLevel: 'full',
  },
  '9-12': {
    fontSize: {
      title: '1.2rem',
      body: '0.95rem',
      points: '2rem',
      button: '0.95rem',
    },
    buttonSize: '44px',
    iconSize: '36px',
    animationLevel: 'medium',
  },
}

export function useAgeGroup(ageGroup: string): AgeGroupConfig {
  return AGE_CONFIGS[ageGroup] || AGE_CONFIGS['6-8']
}

export function getAgeGroup(age: number): '3-5' | '6-8' | '9-12' {
  if (age <= 5) return '3-5'
  if (age <= 8) return '6-8'
  return '9-12'
}
