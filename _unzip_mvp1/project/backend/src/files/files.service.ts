import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async upload(file: any, user: any, entityType: 'order' | 'device', entityId: string) {
    if (!entityType || !entityId) throw new BadRequestException('entityType and entityId required');
    const saved = await this.prisma.file.create({
      data: {
        entityType, entityId,
        storageBucket: 'local',
        storageKey: file.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: user.id,
      },
    });
    return { id: saved.id, entityType: saved.entityType, entityId: saved.entityId,
      originalName: saved.originalName, storageKey: saved.storageKey, size: saved.fileSize, mimeType: saved.mimeType };
  }

  async getOne(id: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async deleteOne(id: string) {
    return this.prisma.file.delete({ where: { id } });
  }
}
