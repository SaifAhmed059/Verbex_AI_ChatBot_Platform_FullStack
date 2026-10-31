import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
  imports: [PassportModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
