import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');

    if (!serviceAccountJson) {
      this.logger.warn('Firebase service account not configured. Push notifications will be disabled.');
      return;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountJson);

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      this.isInitialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  async sendPushNotification(token: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.warn('Firebase not initialized. Skipping push notification.');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent successfully: ${response}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send push notification: ${error.message}`);

      // Handle invalid token
      if (error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token') {
        this.logger.warn(`Invalid push token detected: ${token.substring(0, 20)}...`);
        return false;
      }

      throw error;
    }
  }

  async sendMulticastNotification(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
    if (!this.isInitialized) {
      this.logger.warn('Firebase not initialized. Skipping multicast notification.');
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          if (resp.error.code === 'messaging/registration-token-not-registered' ||
              resp.error.code === 'messaging/invalid-registration-token') {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      this.logger.log(
        `Multicast notification: ${response.successCount} success, ${response.failureCount} failed`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send multicast notification: ${error.message}`);
      throw error;
    }
  }

  async sendToTopic(topic: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.warn('Firebase not initialized. Skipping topic notification.');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Topic notification sent successfully: ${response}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send topic notification: ${error.message}`);
      throw error;
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await admin.messaging().subscribeToTopic(tokens, topic);
      this.logger.log(`Subscribed ${tokens.length} tokens to topic: ${topic}`);
    } catch (error: any) {
      this.logger.error(`Failed to subscribe to topic: ${error.message}`);
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await admin.messaging().unsubscribeFromTopic(tokens, topic);
      this.logger.log(`Unsubscribed ${tokens.length} tokens from topic: ${topic}`);
    } catch (error: any) {
      this.logger.error(`Failed to unsubscribe from topic: ${error.message}`);
    }
  }
}
