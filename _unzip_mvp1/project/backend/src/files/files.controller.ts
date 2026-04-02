import { Body, Controller, Delete, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Response } from 'express';

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + extname(file.originalname));
      },
    }),
  }))
  upload(
    @UploadedFile() file: any,
    @CurrentUser() user: any,
    @Body('entityType') entityType: 'order' | 'device',
    @Body('entityId') entityId: string,
  ) {
    return this.filesService.upload(file, user, entityType, entityId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) { return this.filesService.getOne(id); }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const file = await this.filesService.getOne(id);
    res.download(file.storageKey, file.originalName);
  }

  @Delete(':id')
  @Roles('admin')
  deleteOne(@Param('id') id: string) { return this.filesService.deleteOne(id); }
}
