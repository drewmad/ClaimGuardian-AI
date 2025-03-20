// Optional: configure or set up a testing framework before each test
import '@testing-library/jest-dom';

// Extend Jest matchers
expect.extend({
  toHaveClass(received, className) {
    const pass = received?.classList?.contains(className);
    if (pass) {
      return {
        message: () => `expected ${received} not to have class "${className}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have class "${className}"`,
        pass: false,
      };
    }
  },
});

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    toString: jest.fn(() => ''),
  }),
  usePathname: () => '/mock-path',
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ 
    data: { user: { name: 'Test User', email: 'test@example.com' } }, 
    status: 'authenticated' 
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
}); 