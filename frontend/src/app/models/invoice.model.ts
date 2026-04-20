export interface InvoiceItem {
  product_id: number;
  product_code: string;
  product_description: string;
  quantity: number;
}

export interface InvoiceItemRequest {
  product_id: number;
  quantity: number;
}

export interface Invoice {
  ID: number;
  number: number;
  status: string;
  items: InvoiceItem[];
}