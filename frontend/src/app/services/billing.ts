import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface InvoiceItem {
  product_id: number;
  quantity: number;
}

export interface Invoice {
  ID: number;
  number: number;
  status: string;
  items: InvoiceItem[];
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private url = environment.billingUrl;

  constructor(private http: HttpClient) {}

  getInvoices() {
    return this.http.get<Invoice[]>(`${this.url}/invoices`);
  }

  createInvoice(items: InvoiceItem[]) {
    return this.http.post<Invoice>(`${this.url}/invoices`, { items });
  }

  printInvoice(id: number) {
    return this.http.post<Invoice>(`${this.url}/invoices/${id}/print`, {});
  }
}