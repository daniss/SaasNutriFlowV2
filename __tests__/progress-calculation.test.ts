/**
 * Progress Calculation Tests
 * Tests the real progress calculation logic for weight tracking
 */

// Test the progress calculation function
function calculateProgress(
  initialWeight: number,
  currentWeight: number,
  goalWeight: number
): number {
  // If goal is weight loss (goal < initial)
  if (goalWeight < initialWeight) {
    const totalWeightToLose = initialWeight - goalWeight;
    const weightLost = Math.max(0, initialWeight - currentWeight); // Ensure non-negative
    return Math.min(100, Math.round((weightLost / totalWeightToLose) * 100));
  }
  // If goal is weight gain (goal > initial)
  else if (goalWeight > initialWeight) {
    const totalWeightToGain = goalWeight - initialWeight;
    const weightGained = Math.max(0, currentWeight - initialWeight); // Ensure non-negative
    return Math.min(100, Math.round((weightGained / totalWeightToGain) * 100));
  }
  // If goal equals initial weight (maintenance)
  else {
    return 100;
  }
}

describe('calculateProgress', () => {
  describe('weight loss progress', () => {
    it('calculates 50% progress for halfway to goal', () => {
      const result = calculateProgress(80, 75, 70)
      expect(result).toBe(50)
    })

    it('calculates 0% progress when weight gained instead of lost', () => {
      const result = calculateProgress(80, 85, 70)
      expect(result).toBe(0)
    })

    it('calculates 100% progress when goal reached', () => {
      const result = calculateProgress(80, 70, 70)
      expect(result).toBe(100)
    })

    it('calculates 100% progress when goal exceeded', () => {
      const result = calculateProgress(80, 65, 70)
      expect(result).toBe(100)
    })
  })

  describe('weight gain progress', () => {
    it('calculates 50% progress for halfway to goal', () => {
      const result = calculateProgress(60, 65, 70)
      expect(result).toBe(50)
    })

    it('calculates 0% progress when weight lost instead of gained', () => {
      const result = calculateProgress(60, 55, 70)
      expect(result).toBe(0)
    })

    it('calculates 100% progress when goal reached', () => {
      const result = calculateProgress(60, 70, 70)
      expect(result).toBe(100)
    })

    it('calculates 100% progress when goal exceeded', () => {
      const result = calculateProgress(60, 75, 70)
      expect(result).toBe(100)
    })
  })

  describe('maintenance', () => {
    it('calculates 100% progress for maintenance goal', () => {
      const result = calculateProgress(70, 70, 70)
      expect(result).toBe(100)
    })
  })
})

export { calculateProgress };
