import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  styles: [
    `
      .dialog {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 24px;
        max-width: 380px;
      }
      .title {
        font-size: 15px;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 12px;
      }
      .message {
        font-size: 13px;
        color: var(--text-muted);
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .btn {
        padding: 8px 18px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        font-family: 'DM Sans', sans-serif;
        cursor: pointer;
        border: none;
        transition: all 0.15s;
      }
      .btn-ghost {
        background: transparent;
        color: var(--text-muted);
        border: 1px solid var(--border);
        &:hover {
          color: var(--text);
        }
      }
      .btn-danger {
        background: var(--danger);
        color: #fff;
        &:hover {
          background: #dc2626;
        }
      }
    `,
  ],
  template: `
    <div class="dialog">
      <div class="title">Confirmar exclusão</div>
      <div class="message">{{ data.message }}</div>
      <div class="actions">
        <button class="btn btn-ghost" (click)="close(false)">Cancelar</button>
        <button class="btn btn-danger" (click)="close(true)">Excluir</button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string },
  ) {}

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
