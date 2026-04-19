import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [`
    nav {
      display: flex;
      align-items: center;
      padding: 0 32px;
      height: 56px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      gap: 32px;
    }
    .brand {
      font-family: 'DM Mono', monospace;
      font-size: 15px;
      font-weight: 500;
      color: var(--accent);
      letter-spacing: -0.02em;
      text-decoration: none;
      margin-right: auto;
    }
    a.link {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.15s;
      &:hover { color: var(--text); background: var(--surface-2); }
      &.active { color: var(--accent); background: rgba(16,185,129,0.08); }
    }
    main { padding: 40px 32px; max-width: 1100px; margin: 0 auto; }
  `],
  template: `
    <nav>
      <a class="brand" routerLink="/">korp_nf</a>
      <a class="link" routerLink="/products" routerLinkActive="active">Produtos</a>
      <a class="link" routerLink="/invoices" routerLinkActive="active">Notas Fiscais</a>
    </nav>
    <main><router-outlet /></main>
  `
})
export class App {}