import {
  BadRequestException,
  Body,
  Controller,
  Put,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

type RequestWithUser = {
  user: {
    userId: number;
    email: string;
    username: string;
  };
};

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: RequestWithUser) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Put('me')
  async updateMe(
    @Request() req: RequestWithUser,
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @Put('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Solo se permiten imágenes'),
            false,
          );
        }
        return callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Request() req: RequestWithUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    return this.usersService.uploadAvatar(req.user.userId, file);
  }
}
