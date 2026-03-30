export class ListOrdersQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  masterId?: string;
  receiverId?: string;
  deviceType?: string;
  dateFrom?: string;
  dateTo?: string;
  myOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
