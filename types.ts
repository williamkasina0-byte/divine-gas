
export type GasBrand = string;

export type PaymentMethod = 'MPESA' | 'CARD_ON_DELIVERY' | 'CASH_ON_DELIVERY';

export interface GasProduct {
  id: string;
  brand: GasBrand;
  size: string;
  price: number;
  deposit: number; // Added field for cylinder deposit
  image: string;
}

export interface OrderItem extends GasProduct {
  quantity: number;
  purchaseType: 'refill' | 'new';
  finalPrice: number;
  note?: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DISPATCHED = 'DISPATCHED',
  ARRIVING = 'ARRIVING',
  COMPLETED = 'COMPLETED'
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  customerName: string;
  phone: string;
  location: string;
  paymentMethod: PaymentMethod;
  timestamp: number;
}
