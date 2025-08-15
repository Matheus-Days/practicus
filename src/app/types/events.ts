export interface PriceBreakpoint {
  minQuantity: number;
  priceInCents: number;
}

export type EventStatus = 'open' | 'closed' | 'canceled';

export type EventDocument = {
  maxParticipants?: number;
  currentParticipants?: number;
  priceBreakpoints?: PriceBreakpoint[];
  status?: EventStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EventData = EventDocument & {
  id: string;
} 