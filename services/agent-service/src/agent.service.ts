import {
  Injectable, Inject, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB_POOL } from './database/database.module';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@Injectable()
export class AgentService {
  constructor(@Inject(DB_POOL) private readonly db: Pool) {}

  async create(userId: string, dto: CreateAgentDto) {
    const result = await this.db.query(
      `INSERT INTO agents (user_id, name, system_prompt, temperature, llm_provider, webhook_url)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [userId, dto.name, dto.systemPrompt, dto.temperature, dto.llmProvider || 'openai', dto.webhookUrl || null],
    );
    return result.rows[0];
  }

  async findAll(userId: string) {
    const result = await this.db.query(
      `SELECT a.*,
         COUNT(DISTINCT c.id)       AS total_conversations,
         COALESCE(SUM(c.message_count), 0) AS total_messages,
         MAX(c.last_message)        AS last_activity
       FROM agents a
       LEFT JOIN conversations c ON c.agent_id = a.id
       WHERE a.user_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async findOne(id: string, userId: string) {
    const result = await this.db.query(
      `SELECT a.*,
         COUNT(DISTINCT c.id)       AS total_conversations,
         COALESCE(SUM(c.message_count), 0) AS total_messages,
         MAX(c.last_message)        AS last_activity
       FROM agents a
       LEFT JOIN conversations c ON c.agent_id = a.id
       WHERE a.id = $1
       GROUP BY a.id`,
      [id],
    );
    if (!result.rows.length) throw new NotFoundException('Agent not found');
    const agent = result.rows[0];
    if (agent.user_id !== userId) throw new ForbiddenException();
    return agent;
  }

  async findPublic(id: string) {
    const result = await this.db.query(
      'SELECT id, name, system_prompt, temperature, llm_provider, webhook_url FROM agents WHERE id = $1',
      [id],
    );
    if (!result.rows.length) throw new NotFoundException('Agent not found');
    return result.rows[0];
  }

  async update(id: string, userId: string, dto: UpdateAgentDto) {
    await this.findOne(id, userId);
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.name !== undefined)         { fields.push(`name=$${idx++}`);          values.push(dto.name); }
    if (dto.systemPrompt !== undefined) { fields.push(`system_prompt=$${idx++}`); values.push(dto.systemPrompt); }
    if (dto.temperature !== undefined)  { fields.push(`temperature=$${idx++}`);   values.push(dto.temperature); }
    if (dto.llmProvider !== undefined)  { fields.push(`llm_provider=$${idx++}`);  values.push(dto.llmProvider); }
    if (dto.webhookUrl !== undefined)   { fields.push(`webhook_url=$${idx++}`);   values.push(dto.webhookUrl); }

    if (!fields.length) return this.findOne(id, userId);
    fields.push(`updated_at=NOW()`);
    values.push(id);

    const result = await this.db.query(
      `UPDATE agents SET ${fields.join(',')} WHERE id=$${idx} RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.db.query('DELETE FROM agents WHERE id=$1', [id]);
    return { message: 'Agent deleted' };
  }

  async getConversations(agentId: string, userId: string) {
    await this.findOne(agentId, userId);
    const result = await this.db.query(
      `SELECT c.id, c.started_at, c.last_message, c.message_count,
         (SELECT content FROM messages WHERE conversation_id=c.id ORDER BY created_at ASC LIMIT 1) AS first_message
       FROM conversations c
       WHERE c.agent_id = $1
       ORDER BY c.last_message DESC`,
      [agentId],
    );
    return result.rows;
  }

  async getAnalytics(userId: string) {
    const result = await this.db.query(
      `SELECT
         a.id, a.name,
         COUNT(DISTINCT c.id)              AS total_conversations,
         COALESCE(SUM(c.message_count), 0) AS total_messages,
         MAX(c.last_message)               AS last_activity
       FROM agents a
       LEFT JOIN conversations c ON c.agent_id = a.id
       WHERE a.user_id = $1
       GROUP BY a.id
       ORDER BY total_conversations DESC`,
      [userId],
    );
    return result.rows;
  }
}
