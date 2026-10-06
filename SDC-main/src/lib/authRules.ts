/**
 * SDC Authentication & Authorization Rules
 * 
 * 1. University Emails:
 *    - Domain strictly matches: @goa.paruluniversity.ac.in
 *    - Classified as University Member.
 * 
 * 2. External Emails (e.g. @gmail.com or other universities):
 *    - All other domains are classified as External Members.
 * 
 * 3. Password Requirements:
 *    - Minimum length: 8 characters.
 */

export interface EmailClassification {
  isUniversity: boolean
  isExternal: boolean
  suggestedRole: 'admin' | 'member'
  memberType: 'university' | 'external'
  badgeLabel: string
  description: string
}

export function isUniversityEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false
  const clean = email.trim().toLowerCase()
  const atIndex = clean.lastIndexOf('@')
  if (atIndex === -1) return false
  const domain = clean.slice(atIndex + 1)

  return domain === 'goa.paruluniversity.ac.in'
}

export function classifyEmail(email: string): EmailClassification {
  const isUniv = isUniversityEmail(email)

  if (isUniv) {
    return {
      isUniversity: true,
      isExternal: false,
      suggestedRole: 'member',
      memberType: 'university',
      badgeLabel: '🎓 Parul University Goa Member',
      description: 'Official Parul University Goa Campus student / faculty',
    }
  }

  // External (e.g. Gmail, Outlook, Yahoo from other universities)
  return {
    isUniversity: false,
    isExternal: true,
    suggestedRole: 'member',
    memberType: 'external',
    badgeLabel: '🌐 External Member (Other Campus / Guest)',
    description: 'External builder access from other colleges & tech communities',
  }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long.',
    }
  }
  return { valid: true }
}
