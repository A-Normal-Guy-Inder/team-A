import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ListMeta } from '../../core/api.types';

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly meta = input<ListMeta | null>(null);
  readonly disabled = input(false);

  readonly pageChange = output<number>();
}
