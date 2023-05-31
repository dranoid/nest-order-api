export interface IProduct {
  name: string;
  description?: string;
  qty: number;
}

export type orderItem = {
  product: string;
  orderQuantity: number;
};
