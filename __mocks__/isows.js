// Mock for isows module to fix Jest ES module issues
module.exports = {
  getNativeWebSocket: jest.fn(),
  WebSocket: jest.fn().mockImplementation(() => ({
    readyState: 1,
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
};