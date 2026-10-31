import {
  Controller, Post, Get, Body, Param, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { IsString, IsOptional } from 'class-validator';
import { ChatService } from './chat.service';

class SendMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Public streaming chat — no auth required.
   * Frontend connects with EventSource / fetch streaming.
   */
  @Post(':agentId/stream')
  async stream(
    @Param('agentId') agentId: string,
    @Body() body: SendMessageDto,
    @Res() res: Response,
  ) {
    await this.chatService.streamChat(
      agentId,
      body.message,
      body.conversationId,
      res,
    );
  }

  /**
   * Get messages for a conversation (public — read-only)
   */
  @Get(':agentId/conversations/:conversationId/messages')
  getMessages(
    @Param('agentId') agentId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.getConversationMessages(conversationId);
  }
}
