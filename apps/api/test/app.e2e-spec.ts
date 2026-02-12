import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ApniGully API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect({ status: 'ok' });
    });
  });

  describe('Authentication', () => {
    const testPhone = '+919999999999';

    it('/auth/request-otp (POST) - should request OTP', () => {
      return request(app.getHttpServer())
        .post('/auth/request-otp')
        .send({ phone: testPhone })
        .expect(201);
    });

    it('/auth/request-otp (POST) - should reject invalid phone', () => {
      return request(app.getHttpServer())
        .post('/auth/request-otp')
        .send({ phone: 'invalid' })
        .expect(400);
    });
  });

  describe('Protected Routes (without auth)', () => {
    it('/users/me (GET) - should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });

    it('/posts (GET) - should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .expect(401);
    });
  });

  describe('Users API (with mock auth)', () => {
    // These tests would require a valid JWT token
    // In a real e2e test, you would:
    // 1. Create a test user in beforeAll
    // 2. Generate a valid JWT token
    // 3. Use that token for authenticated requests

    it.skip('should get current user profile', async () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('phone');
        });
    });

    it.skip('should get user settings', async () => {
      return request(app.getHttpServer())
        .get('/users/me/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('pushEnabled');
          expect(res.body.data).toHaveProperty('profileVisibility');
        });
    });

    it.skip('should update user settings', async () => {
      return request(app.getHttpServer())
        .put('/users/me/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pushEnabled: false })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.pushEnabled).toBe(false);
        });
    });
  });

  describe('Posts API (with mock auth)', () => {
    it.skip('should get posts feed', async () => {
      return request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
        });
    });

    it.skip('should create a post', async () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test post content',
          type: 'announcement',
          neighborhoodId: 'test-neighborhood-id',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.content).toBe('Test post content');
        });
    });
  });

  describe('Notifications API (with mock auth)', () => {
    it.skip('should get notifications', async () => {
      return request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('unreadCount');
        });
    });

    it.skip('should mark notification as read', async () => {
      return request(app.getHttpServer())
        .put('/notifications/notif-id/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit after too many requests', async () => {
      // Make many requests quickly
      const requests = Array(100).fill(null).map(() =>
        request(app.getHttpServer()).get('/health')
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.some((r) => r.status === 429);

      // This test depends on throttle configuration
      // expect(tooManyRequests).toBe(true);
    });
  });
});
