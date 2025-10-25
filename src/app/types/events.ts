export interface PriceBreakpoint {
  minQuantity: number;
  priceInCents: number;
}

export type EventStatus = 'open' | 'closed' | 'canceled';

export type EventDocument = {
  maxParticipants: number;
  priceBreakpoints: PriceBreakpoint[];
  status: EventStatus;
  title: string;
  eventDate: string;
  eventLocal: string;
  createdAt: Date;
  updatedAt?: Date;
}

export type EventData = EventDocument & {
  id: string;
  registrationsCount: number;
} 