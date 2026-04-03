import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { SignupDto, LoginDto } from './dto/auth.dto';
import { DB_POOL } from './database/database.module';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_POOL) private readonly db: Pool,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.db.query(
      'SELECT id FROM users WHERE email = $1',
      [dto.email],
    );
    if (existing.rows.length > 0) {
      throw new ConflictException('Email already in use');
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const result = await this.db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [dto.email, hash],
    );
    const user = result.rows[0];
    const tokens = await this.generateTokens(user.id, user.email);
    return { user: { id: user.id, email: user.email }, ...tokens };
  }

  async login(dto: LoginDto) {
    const result = await this.db.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [dto.email],
    );
    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: { id: user.id, email: user.email }, ...tokens };
  }

  async generateApiKey(userId: string) {
    const existing = await this.db.query(
      'SELECT key_prefix FROM api_keys WHERE user_id = $1',
      [userId],
    );
    if (existing.rows.length > 0) {
      return { message: 'API key already exists', prefix: existing.rows[0].key_prefix };
    }

    const rawKey = `vx_${uuidv4().replace(/-/g, '')}`;
    const hash = await bcrypt.hash(rawKey, 10);
    const prefix = rawKey.substring(0, 8);

    await this.db.query(
      'INSERT INTO api_keys (user_id, key_hash, key_prefix) VALUES ($1, $2, $3)',
      [userId, hash, prefix],
    );

    return { apiKey: rawKey, prefix, message: 'Copy this key now — it will not be shown again' };
  }

  async validateApiKey(apiKey: string) {
    const prefix = apiKey.substring(0, 8);
    const result = await this.db.query(
      'SELECT ak.user_id, u.email FROM api_keys ak JOIN users u ON u.id = ak.user_id WHERE ak.key_prefix = $1',
      [prefix],
    );
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const valid = await bcrypt.compare(apiKey, row.key_hash);
    if (!valid) return null;

    return { userId: row.user_id, email: row.email };
  }

  async getProfile(userId: string) {
    const result = await this.db.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [userId],
    );
    if (result.rows.length === 0) throw new UnauthorizedException();
    const keyResult = await this.db.query(
      'SELECT key_prefix, created_at FROM api_keys WHERE user_id = $1',
      [userId],
    );
    return {
      ...result.rows[0],
      apiKey: keyResult.rows[0] || null,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
  }

  async refreshTokens(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      return this.generateTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
