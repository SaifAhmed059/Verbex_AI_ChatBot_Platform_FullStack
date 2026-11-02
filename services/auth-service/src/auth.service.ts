import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';
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
      'INSERT INTO users (email, password_hash, auth_provider) VALUES ($1, $2, $3) RETURNING id, email, created_at',
      [dto.email, hash, 'local'],
    );
    const user = result.rows[0];
    const tokens = await this.generateTokens(user.id, user.email);
    return { user: { id: user.id, email: user.email }, ...tokens };
  }

  async login(dto: LoginDto) {
    const result = await this.db.query(
      'SELECT id, email, password_hash, auth_provider FROM users WHERE email = $1',
      [dto.email],
    );
    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = result.rows[0];
    if (!user.password_hash) {
      throw new UnauthorizedException(
        `This account was created with ${user.auth_provider || 'OAuth'}. Please sign in with that provider.`,
      );
    }
    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: { id: user.id, email: user.email }, ...tokens };
  }

  async googleAuth(credential: string) {
    if (!credential) {
      throw new BadRequestException('Google credential token required');
    }
    try {
      let data: any;
      try {
        const response = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
          { timeout: 8000 },
        );
        data = response.data;
      } catch {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credential}` },
          timeout: 8000,
        });
        data = response.data;
      }

      if (!data?.email) {
        throw new UnauthorizedException('Unable to retrieve email from Google');
      }

      return this.findOrCreateOAuthUser({
        email: data.email,
        provider: 'google',
        providerId: data.sub,
        avatarUrl: data.picture,
      });
    } catch (err: any) {
      console.error('Google OAuth verification failed:', err.message);
      throw new UnauthorizedException(
        err.response?.data?.error_description || 'Invalid Google credential token',
      );
    }
  }

  async githubAuth(code: string) {
    if (!code) {
      throw new BadRequestException('GitHub authorization code required');
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn('GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not set; falling back to demo github flow');
      return this.demoOAuth('github');
    }

    try {
      const tokenRes = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        { headers: { Accept: 'application/json' }, timeout: 8000 },
      );

      const accessToken = tokenRes.data.access_token;
      if (!accessToken) {
        throw new UnauthorizedException('Failed to exchange code for GitHub token');
      }

      const userRes = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 8000,
      });

      let email = userRes.data.email;
      if (!email) {
        const emailsRes = await axios.get('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 8000,
        });
        const primary = emailsRes.data.find((e: any) => e.primary);
        email = primary ? primary.email : `${userRes.data.login}@users.noreply.github.com`;
      }

      return this.findOrCreateOAuthUser({
        email,
        provider: 'github',
        providerId: String(userRes.data.id),
        avatarUrl: userRes.data.avatar_url,
      });
    } catch (err: any) {
      console.error('GitHub OAuth failed:', err.message);
      throw new UnauthorizedException('GitHub authentication failed');
    }
  }

  async demoOAuth(provider: 'google' | 'github') {
    const email = provider === 'google' ? 'demo.google.user@verbex.ai' : 'demo.github.user@verbex.ai';
    return this.findOrCreateOAuthUser({
      email,
      provider,
      providerId: `demo_${provider}_${Date.now()}`,
    });
  }

  private async findOrCreateOAuthUser(data: {
    email: string;
    provider: string;
    providerId?: string;
    avatarUrl?: string;
  }) {
    const existing = await this.db.query(
      'SELECT id, email, auth_provider FROM users WHERE email = $1',
      [data.email],
    );

    let user: { id: string; email: string };

    if (existing.rows.length > 0) {
      user = existing.rows[0];
      await this.db.query(
        'UPDATE users SET auth_provider = $1, provider_id = COALESCE($2, provider_id), avatar_url = COALESCE($3, avatar_url), updated_at = NOW() WHERE id = $4',
        [data.provider, data.providerId || null, data.avatarUrl || null, user.id],
      );
    } else {
      const result = await this.db.query(
        'INSERT INTO users (email, auth_provider, provider_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, email, created_at',
        [data.email, data.provider, data.providerId || null, data.avatarUrl || null],
      );
      user = result.rows[0];
    }

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
      'SELECT id, email, auth_provider, avatar_url, created_at FROM users WHERE id = $1',
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
      secret: process.env.JWT_REFRESH_SECRET || 'changeme_refresh',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
  }

  async refreshTokens(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'changeme_refresh',
      });
      return this.generateTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
