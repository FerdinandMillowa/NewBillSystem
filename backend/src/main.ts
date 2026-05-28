import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Capture the raw request body so the Paychangu webhook controller
    // can validate the SHA-256 HMAC signature against the original bytes.
    rawBody: true,
  });

  // Prefix all routes with /api so they match frontend calls to /api/auth/login,
  // /api/customers, /api/payments etc.
  // The Paychangu webhook and checkout routes are excluded because Paychangu
  // redirects directly to the backend URL without the /api prefix.
  app.setGlobalPrefix('api', {
    exclude: ['paychangu/checkout', 'paychangu/webhook', 'paychangu/result'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

bootstrap();
