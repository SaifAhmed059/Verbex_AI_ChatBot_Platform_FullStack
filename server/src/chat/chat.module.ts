import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LlmService } from './llm.service';
import { WebhookService } from './webhook.service';
import { ApiKeyGuard } from './api-key.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, LlmService, WebhookService, ApiKeyGuard],
  exports: [ChatService],
})
export class ChatModule {}
