import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { JwtStrategy } from './jwt.strategy';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),
    DatabaseModule,
  ],
  controllers: [AgentController],
  providers: [AgentService, JwtStrategy],
})
export class AppModule {}
