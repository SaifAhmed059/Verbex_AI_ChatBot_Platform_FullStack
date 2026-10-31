import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AgentService } from './agent.service';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  // ── Protected routes ──────────────────────────────────────
  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Request() req, @Body() dto: CreateAgentDto) {
    return this.agentService.create(req.user.userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Request() req) {
    return this.agentService.findAll(req.user.userId);
  }

  @Get('analytics')
  @UseGuards(AuthGuard('jwt'))
  analytics(@Request() req) {
    return this.agentService.getAnalytics(req.user.userId);
  }

  // ── Public route (no auth) ────────────────────────────────
  @Get('public/:id')
  findPublic(@Param('id') id: string) {
    return this.agentService.findPublic(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Request() req, @Param('id') id: string) {
    return this.agentService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Request() req, @Param('id') id: string) {
    return this.agentService.remove(id, req.user.userId);
  }

  @Get(':id/conversations')
  @UseGuards(AuthGuard('jwt'))
  conversations(@Request() req, @Param('id') id: string) {
    return this.agentService.getConversations(id, req.user.userId);
  }
}
