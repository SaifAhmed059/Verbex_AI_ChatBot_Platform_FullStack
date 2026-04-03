import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();
  await app.listen(process.env.AUTH_SERVICE_PORT || 4001);
  console.log(`Auth Service running on port ${process.env.AUTH_SERVICE_PORT || 4001}`);
}
bootstrap();
