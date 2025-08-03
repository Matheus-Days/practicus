export type CheckoutBase = {
  eventId: string; // corresponde ao Document Id de um documento em events
  userId: string; // corresponde ao user UID dos usuários autenticados via Firebase
};

export interface CheckoutDocument extends CheckoutBase {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
  status: 'pending' | 'completed' | 'cancelled';
  // Campos adicionais podem ser adicionados conforme necessário
}

export interface CheckoutContextType {
  checkout: CheckoutDocument | null;
  loading: boolean;
  error: string | null;
  createCheckout: (eventId: string) => Promise<void>;
  refreshCheckout: () => Promise<void>;
  updateCheckout: (updateData: Partial<CheckoutDocument>) => Promise<void>;
} 