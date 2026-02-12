// Global test setup
jest.setTimeout(30000);

// Mock PrismaService for unit tests
export const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  userSettings: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  blockedUser: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  post: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  membership: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  neighborhood: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  otpRequest: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};
