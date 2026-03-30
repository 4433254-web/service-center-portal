export class CreateOrderDto {
  clientId!: string;
  deviceId!: string;
  masterId?: string;
  issueDescription!: string;
  conditionAtAcceptance!: string;
  includedItems?: string;
  estimatedPrice?: number;
  estimatedReadyAt?: string;
  receiverComment?: string;
}
