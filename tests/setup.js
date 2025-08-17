// Jest setup file for Chrome extension testing

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    openOptionsPage: jest.fn()
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});