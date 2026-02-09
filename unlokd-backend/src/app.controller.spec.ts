import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHealth: jest.fn().mockResolvedValue({
              status: 'ok',
              timestamp: '2026-02-08T00:00:00.000Z',
              services: { db: 'ok', redis: 'ok' },
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health payload', async () => {
      await expect(appController.getHealth()).resolves.toEqual({
        status: 'ok',
        timestamp: '2026-02-08T00:00:00.000Z',
        services: { db: 'ok', redis: 'ok' },
      });
    });
  });
});
