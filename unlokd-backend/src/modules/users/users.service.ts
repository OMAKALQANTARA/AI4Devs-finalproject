import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

const AVATARS_DIR = path.join(process.cwd(), 'uploads', 'avatars');

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getProfile(userId: number): Promise<UserProfileDto> {
    const user = await this.usersRepository.findProfileById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async updateProfile(userId: number, payload: UpdateProfileDto) {
    const user = await this.usersRepository.findProfileById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.usersRepository.updateProfile(userId, {
      displayName: payload.displayName,
      presenceStatus: payload.presenceStatus,
    });

    return this.getProfile(userId);
  }

  async uploadAvatar(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const user = await this.usersRepository.findProfileById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await fs.mkdir(AVATARS_DIR, { recursive: true });

    const fileName = `avatar-${userId}-${Date.now()}.png`;
    const filePath = path.join(AVATARS_DIR, fileName);

    await sharp(file.buffer)
      .resize(512, 512)
      .png({ quality: 90 })
      .toFile(filePath);

    const avatarUrl = `/uploads/avatars/${fileName}`;
    await this.usersRepository.updateAvatar(userId, avatarUrl);

    await this.deletePreviousAvatar(user.avatarUrl);

    return this.getProfile(userId);
  }

  private async deletePreviousAvatar(avatarUrl: string | null) {
    if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatars/')) {
      return;
    }

    const fileName = avatarUrl.replace('/uploads/avatars/', '');
    const fullPath = path.join(AVATARS_DIR, fileName);

    try {
      await fs.unlink(fullPath);
    } catch {
      // ignore missing file
    }
  }
}
