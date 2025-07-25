// Mock for ws module to fix Jest ES module issues
module.exports = jest.fn().mockImplementation(() => ({
  readyState: 1,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
}));