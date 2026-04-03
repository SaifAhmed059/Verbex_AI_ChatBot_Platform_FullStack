import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LlmService } from './llm.service';
import { WebhookService } from './webhook.service';
import { JwtStrategy } from './jwt.strategy';
import { ApiKeyGuard } from './api-key.guard';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
    }),
    DatabaseModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, LlmService, WebhookService, JwtStrategy, ApiKeyGuard],
})
export class AppModule {}
