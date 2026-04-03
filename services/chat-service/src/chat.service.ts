import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { Response } from 'express';
import { DB_POOL } from './database/database.module';
import { LlmService } from './llm.service';
import { WebhookService } from './webhook.service';

@Injectable()
export class ChatService {
  constructor(
    @Inject(DB_POOL) private readonly db: Pool,
    private readonly llm: LlmService,
    private readonly webhook: WebhookService,
  ) {}

  async getOrCreateConversation(agentId: string, conversationId?: string) {
    if (conversationId) {
      const result = await this.db.query(
        'SELECT * FROM conversations WHERE id=$1 AND agent_id=$2',
        [conversationId, agentId],
      );
      if (result.rows.length) return result.rows[0];
    }

    const agent = await this.db.query(
      'SELECT id, webhook_url FROM agents WHERE id=$1',
      [agentId],
    );
    if (!agent.rows.length) throw new NotFoundException('Agent not found');

    const result = await this.db.query(
      'INSERT INTO conversations (agent_id) VALUES ($1) RETURNING *',
      [agentId],
    );
    const conv = result.rows[0];

    // Fire webhook on new conversation
    if (agent.rows[0].webhook_url) {
      this.webhook.fire(agent.rows[0].webhook_url, {
        event: 'conversation.started',
        conversationId: conv.id,
        agentId,
        timestamp: new Date().toISOString(),
      });
    }

    return conv;
  }

  async streamChat(
    agentId: string,
    userMessage: string,
    conversationId: string | undefined,
    res: Response,
  ) {
    // 1. Load agent config
    const agentResult = await this.db.query(
      'SELECT * FROM agents WHERE id=$1',
      [agentId],
    );
    if (!agentResult.rows.length) throw new NotFoundException('Agent not found');
    const agent = agentResult.rows[0];

    // 2. Get/create conversation
    const conv = await this.getOrCreateConversation(agentId, conversationId);

    // 3. Save user message
    await this.db.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1,$2,$3)',
      [conv.id, 'user', userMessage],
    );

    // 4. Load history for context
    const historyResult = await this.db.query(
      `SELECT role, content FROM messages
       WHERE conversation_id=$1 ORDER BY created_at ASC`,
      [conv.id],
    );
    const messages = historyResult.rows.map((r) => ({
      role: r.role as 'user' | 'assistant',
      content: r.content,
    }));

    // 5. Stream LLM response
    const fullContent = await this.llm.streamResponse(
      agent.llm_provider,
      agent.system_prompt,
      parseFloat(agent.temperature),
      messages,
      res,
    );

    // 6. Save assistant message & update stats
    await this.db.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1,$2,$3)',
      [conv.id, 'assistant', fullContent],
    );
    await this.db.query(
      `UPDATE conversations
       SET message_count = message_count + 2,
           last_message  = NOW()
       WHERE id=$1`,
      [conv.id],
    );

    return conv.id;
  }

  async getConversationMessages(conversationId: string) {
    const result = await this.db.query(
      `SELECT role, content, created_at FROM messages
       WHERE conversation_id=$1 ORDER BY created_at ASC`,
      [conversationId],
    );
    return result.rows;
  }
}
