/**
 * Progress Calculation Tests
 * Tests the real progress calculation logic for weight tracking
 */

// Test the progress calculation function
function calculateProgress(initialWeight: number, currentWeight: number, goalWeight: number): number {
  // If goal is weight loss (goal < initial)
  if (goalWeight < initialWeight) {
    const totalWeightToLose = initialWeight - goalWeight
    const weightLost = Math.max(0, initialWeight - currentWeight) // Ensure non-negative
    return Math.min(100, Math.round((weightLost / totalWeightToLose) * 100))
  }
  // If goal is weight gain (goal > initial)
  else if (goalWeight > initialWeight) {
    const totalWeightToGain = goalWeight - initialWeight
    const weightGained = Math.max(0, currentWeight - initialWeight) // Ensure non-negative
    return Math.min(100, Math.round((weightGained / totalWeightToGain) * 100))
  }
  // If goal equals initial weight (maintenance)
  else {
    return 100
  }
}

// Test cases
console.log("=== Weight Loss Progress Tests ===")
console.log("Initial: 80kg, Current: 75kg, Goal: 70kg")
console.log("Progress:", calculateProgress(80, 75, 70) + "%") // Should be 50%

console.log("Initial: 80kg, Current: 85kg, Goal: 70kg (weight gained instead of lost)")
console.log("Progress:", calculateProgress(80, 85, 70) + "%") // Should be 0%

console.log("Initial: 80kg, Current: 70kg, Goal: 70kg (goal reached)")
console.log("Progress:", calculateProgress(80, 70, 70) + "%") // Should be 100%

console.log("Initial: 80kg, Current: 65kg, Goal: 70kg (exceeded goal)")
console.log("Progress:", calculateProgress(80, 65, 70) + "%") // Should be 100%

console.log("\n=== Weight Gain Progress Tests ===")
console.log("Initial: 60kg, Current: 65kg, Goal: 70kg")
console.log("Progress:", calculateProgress(60, 65, 70) + "%") // Should be 50%

console.log("Initial: 60kg, Current: 55kg, Goal: 70kg (weight lost instead of gained)")
console.log("Progress:", calculateProgress(60, 55, 70) + "%") // Should be 0%

console.log("Initial: 60kg, Current: 70kg, Goal: 70kg (goal reached)")
console.log("Progress:", calculateProgress(60, 70, 70) + "%") // Should be 100%

console.log("Initial: 60kg, Current: 75kg, Goal: 70kg (exceeded goal)")
console.log("Progress:", calculateProgress(60, 75, 70) + "%") // Should be 100%

console.log("\n=== Maintenance Tests ===")
console.log("Initial: 70kg, Current: 70kg, Goal: 70kg (maintenance)")
console.log("Progress:", calculateProgress(70, 70, 70) + "%") // Should be 100%

export { calculateProgress }
