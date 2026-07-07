// ============================================================
// tournaments.utils.ts
// Utility helper functions for the Tournament module
// ============================================================

/**
 * Calculates age based on DateOfBirth string (YYYY-MM-DD)
 */
export function calculateAge(dob: string | Date): number {
  const dobDate = new Date(dob);
  const today = new Date();
  
  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validates if DUPR falls within min and max boundaries
 */
export function validateDUPR(dupr: number, minDUPR?: number | null, maxDUPR?: number | null): boolean {
  if (minDUPR !== undefined && minDUPR !== null && dupr < minDUPR) {
    return false;
  }
  if (maxDUPR !== undefined && maxDUPR !== null && dupr > maxDUPR) {
    return false;
  }
  return true;
}

/**
 * Returns the next power of two for a given number
 * e.g., 6 -> 8, 9 -> 16
 */
export function getNextPowerOfTwo(n: number): number {
  if (n <= 0) return 1;
  let p = 1;
  while (p < n) {
    p *= 2;
  }
  return p;
}

/**
 * Shuffles an array in place (Fisher-Yates)
 */
export function shuffleTeams<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Checks if two time intervals overlap.
 * Intervals are defined by start and end Date objects.
 */
export function checkTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && end1 > start2;
}
