import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('database.url'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.get('nodeEnv') === 'development',
        logging: configService.get('nodeEnv') === 'development',
        ssl: {
          rejectUnauthorized: false,
        },

        extra: {
          max: parseInt(configService.get('DB_POOL_MAX') || '20', 10),
          min: parseInt(configService.get('DB_POOL_MIN') || '2', 10),
          idleTimeoutMillis: parseInt(
            configService.get('DB_IDLE_TIMEOUT') || '30000',
            10,
          ),
          connectionTimeoutMillis: parseInt(
            configService.get('DB_CONNECTION_TIMEOUT') || '2000',
            10,
          ),
        },
        connectTimeoutMS: 30000, // 30 seconds timeout for initial connection
        retryAttempts: 3,
        retryDelay: 3000,
      }),
    }),
  ],
})
export class DatabaseModule {}
