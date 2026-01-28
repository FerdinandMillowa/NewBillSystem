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

        // SSL Configuration for Supabase
        ssl: {
          rejectUnauthorized: false,
        },

        // CRITICAL: Connection Pool Settings for Supabase
        extra: {
          max: 10, // REDUCED - Supabase free tier has limited connections
          min: 1, // Minimum connections

          // Connection timeouts
          connectionTimeoutMillis: 30000, // 30 seconds to establish connection
          idleTimeoutMillis: 30000, // Close idle connections after 30s

          // Keep-alive settings to prevent connection drops
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000, // Send first keep-alive after 10s

          // Application-level statement timeout
          statement_timeout: 60000, // 60 seconds max query time
        },

        // TypeORM-level timeouts
        connectTimeoutMS: 30000,

        // CRITICAL: Retry settings for connection failures
        retryAttempts: 3,
        retryDelay: 3000,

        // Auto-reconnect on connection loss
        autoLoadEntities: true,
        keepConnectionAlive: true,

        // IMPORTANT: Disable connection pooling caching
        cache: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
