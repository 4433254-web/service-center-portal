import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { OrdersService } from './orders.service';
import { DocumentsService } from '../documents/documents.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Post()
  @Roles('admin', 'receiver', 'master')
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.ordersService.create(body, user);
  }

  @Get()
  @Roles('admin', 'receiver', 'manager', 'master')
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.ordersService.findAll(user, query);
  }

  @Get(':id')
  @Roles('admin', 'receiver', 'manager', 'master')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('admin', 'receiver', 'master')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.ordersService.update(id, body, user);
  }

  @Delete(':id')
  @Roles('admin', 'receiver')
  delete(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }

  @Post(':id/status')
  @Roles('admin', 'receiver', 'master')
  changeStatus(
    @Param('id') id: string,
    @Body() body: { toStatus: string; comment?: string },
    @CurrentUser() user: any,
  ) {
    return this.ordersService.changeStatus(id, body, user);
  }

  @Get(':id/status-history')
  @Roles('admin', 'receiver', 'manager', 'master')
  getStatusHistory(@Param('id') id: string) {
    return this.ordersService.getStatusHistory(id);
  }

  @Get(':id/comments')
  @Roles('admin', 'receiver', 'manager', 'master')
  getComments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getComments(id, user);
  }

  @Post(':id/comments')
  @Roles('admin', 'receiver', 'master')
  addComment(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.ordersService.addComment(id, body, user);
  }

  @Get(':id/documents')
  @Roles('admin', 'receiver', 'manager', 'master')
  getDocuments(@Param('id') id: string) {
    return this.ordersService.getDocuments(id);
  }

  @Post(':id/documents/receipt')
  @Roles('admin', 'receiver')
  generateReceipt(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.generateReceipt(id, user);
  }

  @Get(':id/files')
  @Roles('admin', 'receiver', 'manager', 'master')
  getFiles(@Param('id') id: string) {
    return this.ordersService.getFiles(id);
  }

  @Get(':id/photos')
  @Roles('admin', 'receiver', 'manager', 'master')
  getPhotos(@Param('id') id: string) {
    return this.ordersService.getPhotos(id);
  }

  @Post(':id/photos')
  @Roles('admin', 'receiver', 'master')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(process.cwd(), 'uploads', 'order-photos');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only images allowed'), false);
    },
  }))
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('comment') comment: string,
    @Body('stage') stage: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.addPhoto(id, file, comment, stage, user);
  }

  @Delete(':id/photos/:photoId')
  @Roles('admin', 'receiver', 'master')
  deletePhoto(@Param('photoId') photoId: string, @CurrentUser() user: any) {
    return this.ordersService.deletePhoto(photoId, user);
  }

  @Post(':id/transfer')
  @Roles('admin', 'receiver', 'manager')
  transferOrder(
    @Param('id') id: string,
    @Body('toLocationId') toLocationId: string,
    @Body('comment') comment: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.transferOrder(id, toLocationId, comment, user);
  }

  @Patch(':id/master')
  @Roles('admin', 'receiver')
  assignMaster(
    @Param('id') id: string,
    @Body('masterUserId') masterUserId: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.assignMaster(id, masterUserId, user);
  }
}
