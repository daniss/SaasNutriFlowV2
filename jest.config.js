const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  
  // Handle ES modules and fix Supabase compatibility issues
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((@supabase|isows|ws|@google\/generative-ai)/.*))'
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock problematic ES modules
    '^isows/(.*)$': '<rootDir>/__mocks__/isows.js',
    '^ws$': '<rootDir>/__mocks__/ws.js'
  },
  
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    // Exclude test files from coverage
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    // Exclude config files
    '!**/jest.config.js',
    '!**/jest.setup.js',
    '!**/next.config.mjs',
    '!**/tailwind.config.ts',
    '!**/postcss.config.mjs'
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Add timeout for tests that might take longer
  testTimeout: 30000,
  
  // Verbose output for better debugging
  verbose: true
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config)
