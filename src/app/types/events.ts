export interface PriceBreakpoint {
  minQuantity: number;
  priceInCents: number;
}

export interface EventData {
  id: string;
  maxParticipants?: number;
  currentParticipants?: number;
  priceBreakpoints?: PriceBreakpoint[];
  status?: 'open' | 'closed' | 'canceled';
  createdAt?: Date;
  updatedAt?: Date;
} 