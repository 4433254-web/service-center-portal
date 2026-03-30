import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderNumberService {
  generate(sequence: number): string {
    const year = new Date().getFullYear();
    const padded = String(sequence).padStart(6, '0');

    return `SC-${year}-${padded}`;
  }
}
