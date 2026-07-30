import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ListMeta } from '../../core/api.types';

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (meta(); as m) {
      @if (m.totalPages > 1) {
        <div class="pagination">
          <button
            type="button"
            class="pagination-btn"
            (click)="pageChange.emit(m.page - 1)"
            [disabled]="disabled() || !m.hasPrevPage"
          >
            ‹ Prev
          </button>

          <span class="pagination-info">
            Page {{ m.page }} of {{ m.totalPages }}
            <span class="pagination-total"> • {{ m.total }} total</span>
          </span>

          <button
            type="button"
            class="pagination-btn"
            (click)="pageChange.emit(m.page + 1)"
            [disabled]="disabled() || !m.hasNextPage"
          >
            Next ›
          </button>
        </div>
      }
    }
  `,
})
export class Pagination {
  readonly meta = input<ListMeta | null>(null);
  readonly disabled = input(false);

  readonly pageChange = output<number>();
}
