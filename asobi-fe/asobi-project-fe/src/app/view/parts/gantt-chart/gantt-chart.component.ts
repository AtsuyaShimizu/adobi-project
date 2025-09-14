/**
 * GanttChartComponent with simplified horizontal scrolling.
 *
 * プルーンや範囲拡張を廃し、タスクの期間から初期表示範囲を算出する。
 * スクロール時はスクロールバー位置のみ更新し、不要なレイアウト計算を避ける。
 * sticky列幅やヘッダー高さはキャッシュして滑らかなスクロールを実現する。
 */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, fromEvent, Subscription } from 'rxjs';
import { Task } from '../../../domain/model/task';
import { Memo } from '../../../domain/model/memo';
import { MemoComponent } from '../memo/memo.component';

interface TaskView {
  task: Task;
  start: Date;
  end: Date;
  actualKeys: Set<string>;
}

interface FilterState {
  options: string[];
  keyword: string;
  selected: Set<string>;
}

type FilterName = 'type' | 'name' | 'assignee';

@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  imports: [DatePipe, MemoComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.scss',
})
export class GanttChartComponent {
  private static readonly MIN_MEMO_WIDTH_PX = 190;
  @Output() memoDelete = new EventEmitter<string>();
  @Input({ required: true }) tasks: Task[] = [];
  @Input({ required: true }) memos: Memo[] = [];
  @Output() memoChange = new EventEmitter<Memo>();
  @Output() taskClick = new EventEmitter<Task>();
  @Output() progressInput = new EventEmitter<{ task: Task; value: number; date: Date }>();
  @Output() rangeChange = new EventEmitter<{ start: Date; end: Date }>();
  @ViewChild('scrollHost') private scrollHost?: ElementRef<HTMLDivElement>;
  @ViewChild('hScrollbar') private hScrollbar?: ElementRef<HTMLDivElement>;
  @ViewChild('hScrollbarThumb')
  private hScrollbarThumb?: ElementRef<HTMLDivElement>;
  @ViewChild('vScrollbar') private vScrollbar?: ElementRef<HTMLDivElement>;
  @ViewChild('vScrollbarThumb')
  private vScrollbarThumb?: ElementRef<HTMLDivElement>;

  protected readonly emptyRows = Array.from({ length: 100 });
  protected dateRange: Date[] = [];
  private dateKeys: string[] = [];
  protected taskViews: TaskView[] = [];
  protected filterPopup: FilterName | null = null;
  protected filters: Record<FilterName, FilterState> = {
    type: { options: [], keyword: '', selected: new Set<string>() },
    name: { options: [], keyword: '', selected: new Set<string>() },
    assignee: { options: [], keyword: '', selected: new Set<string>() },
  };
  private rangeStart!: Date;
  private rangeEnd!: Date;
  private spanOffset = 0;
  private static readonly PAST_MONTHS = 6;
  private static readonly FUTURE_MONTHS = 12;
  private static readonly SPAN_MONTHS =
    GanttChartComponent.PAST_MONTHS + GanttChartComponent.FUTURE_MONTHS;
  private static readonly CELL_WIDTH = 36;
  private barDrag?: { startX: number; startThumbPos: number };
  private vBarDrag?: { startY: number; startThumbPos: number };
  private dragData?: {
    memo: Memo;
    el: HTMLElement;
    offsetX: number;
    offsetY: number;
    stickyWidth: number;
    headerHeight: number;
  };
  private onMove = (e: MouseEvent) => this.handleDrag(e);
  private onUp = () => this.endDrag();
  private resizeData?: {
    memo: Memo;
    el: HTMLElement;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    stickyWidth: number;
    headerHeight: number;
  };
  private onResizeMove = (e: MouseEvent) => this.handleResize(e);
  private onResizeUp = () => this.endResize();
  private focusedCell?: { x: number; y: number };
  private focusedCellIdx?: { row: number; col: number };
  protected hoveredColIdx: number | null = null;
  protected editingMemoId: string | null = null;
  protected editingCell: { row: number; col: number; task: Task } | null = null;
  protected progressValue = '';
  // オーバーレイ用バー
  protected plannedBars: { id: string; left: number; top: number; width: number; height: number; start: boolean; end: boolean }[] = [];
  protected actualBars: { id: string; left: number; top: number; width: number; height: number; start: boolean; end: boolean; outOfPlan: boolean }[] = [];
  // 初期センタリングが完了するまで非表示にしてチラつきを防止
  protected isReady = false;

  onMemoDelete(id: string): void {
    this.memoDelete.emit(id);
  }
  private isScrolling = false;
  private resizeSub?: Subscription;
  private keySub?: Subscription;
  // 初期レイアウト完了を検知して一度だけ中央寄せするフック
  private contentResizeObs?: ResizeObserver;
  private hasAutoCentered = false;
  // Cached dimensions to reduce layout thrashing during scroll
  private stickyWidthCache = 0;
  private headerHeightCache = 0;
  private rowHeightCache = 24;
  private rowStepCache = 25; // 行の視覚ステップ（高さ+下線）
  // Wheel event handler: Shift+スクロール時のみ横方向へ変換し、それ以外は標準の縦スクロールを許可
  private onWheel = (event: WheelEvent) => {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;
    // Shift キーが押されている場合のみ、縦スクロール量を横スクロールに加算
    if (event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      host.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  };
  private onScrollBound = () => {
    if (this.isScrolling) return;
    this.isScrolling = true;
    requestAnimationFrame(() => {
      this.handleScrollRaf();
      this.isScrolling = false;
    });
  };
  protected readonly monthColors = [
    '#e0f4ff', // Jan: icy blue
    '#e0eaff', // Feb: pale sky
    '#ffe6f0', // Mar: blossom pink
    '#fff0f6', // Apr: cherry pink
    '#e6ffe6', // May: fresh green
    '#fff5e6', // Jun: early summer cream
    '#ffeccc', // Jul: soft orange
    '#fffde6', // Aug: mellow yellow
    '#ffe6cc', // Sep: light ochre
    '#f9f2e6', // Oct: gentle beige
    '#f6ffe6', // Nov: pale leaf
    '#e0f2ff', // Dec: winter blue
  ];
  protected readonly barColors = {
    progress: 'var(--bar-progress, var(--color-primary, #3b82f6))',
    planned: 'var(--bar-planned, rgba(59,130,246,0.25))',
  } as const;

  constructor(private cdr: ChangeDetectorRef) {
    this.updateRange();
  }

  // 初期化：レンジ通知とEscキーでのポップアップ終了を設定
  ngOnInit(): void {
    this.emitRangeChange();
    // Escapeキーでフィルターポップアップを閉じる
    this.keySub = fromEvent<KeyboardEvent>(window, 'keydown').subscribe(
      (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
          if (this.filterPopup) {
            this.filterPopup = null;
            this.cdr.markForCheck();
          }
        }
      },
    );
  }

  // 月ヘッダーのラベル・日数・月番号を算出
  get months(): { label: string; days: number; month: number }[] {
    const result: { label: string; days: number; month: number }[] = [];
    this.dateRange.forEach((d) => {
      const m = d.getMonth() + 1;
      const label = `${d.getFullYear()}-${m.toString().padStart(2, '0')}`;
      const last = result[result.length - 1];
      if (last && last.label === label) last.days++;
      else result.push({ label, days: 1, month: m });
    });
    return result;
  }

  // 当該日が計画（予定）期間内か（進捗とは独立に、開始〜終了まで常に表示）
  isPlanned(view: TaskView, date: Date): boolean {
    return date >= view.start && date <= view.end;
  }

  // 計画バーの開始セルか
  isPlannedStart(view: TaskView, date: Date): boolean {
    return this.isSameDay(date, view.start);
  }

  // 計画バーの終了セルか
  isPlannedEnd(view: TaskView, date: Date): boolean {
    return this.isSameDay(date, view.end);
  }

  // 月初日か
  protected isMonthStart(date: Date): boolean {
    return date.getDate() === 1;
  }

  // 今日か
  protected isToday(date: Date): boolean {
    const t = this.getToday();
    return this.isSameDay(date, t);
  }

  // 週末（土日）か
  protected isWeekend(date: Date): boolean {
    const d = date.getDay();
    return d === 0 || d === 6;
  }

  // View初期化：イベントリスナー設定、スクロールバー初期化、初期位置調整
  ngAfterViewInit(): void {
    // 初期化時に寸法をキャッシュ
    this.updateDimensionCaches();
    const host = this.scrollHost?.nativeElement;
    if (host) {
      host.addEventListener('scroll', this.onScrollBound, {
        passive: true,
      });
      host.addEventListener('wheel', this.onWheel, { passive: false });
    }
    // スクロールバー位置を初期化
    this.updateScrollbarThumb();
    this.updateVScrollbarThumb();
    this.updateOverlayBars();
    // レイアウト変化（コンテンツ幅/ホスト幅の変化）を監視し、初回のみ自動センタリング
    const hostEl = this.scrollHost?.nativeElement;
    if (hostEl && typeof ResizeObserver !== 'undefined') {
      this.contentResizeObs = new ResizeObserver(() => {
        // 次フレームで安定後に判定
        requestAnimationFrame(() => this.maybeAutoCenter());
      });
      this.contentResizeObs.observe(hostEl);
    }
    // リサイズ時に寸法を再計算
    this.resizeSub = fromEvent(window, 'resize')
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.updateDimensionCaches();
        this.updateScrollbarThumb();
        this.updateVScrollbarThumb();
        this.updateOverlayBars();
      });
    // 初期センタリングは ResizeObserver/maybeAutoCenter に任せる
  }

  // 破棄：購読解除・イベントリスナー解除
  ngOnDestroy(): void {
    this.resizeSub?.unsubscribe();
    this.keySub?.unsubscribe();

    const host = this.scrollHost?.nativeElement;
    if (host) {
      host.removeEventListener('wheel', this.onWheel);
      host.removeEventListener('scroll', this.onScrollBound);
    }
    // 監視解除
    this.contentResizeObs?.disconnect();
  }

  // 入力変更：タスク更新に応じてフィルター・ビュー・スクロールを更新
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.buildFilters();
      this.updateTaskViews();
      // 先に寸法キャッシュを更新してからスクロール調整
      this.updateDimensionCaches();
      this.updateOverlayBars();
      // タスクバインド後のレイアウト確定を待って一度だけ中央寄せを保証
      this.maybeAutoCenter();
    }
  }

  // 初期レイアウトの安定を検出したら一度だけ中央寄せする
  private maybeAutoCenter(): void {
    if (this.hasAutoCentered) return;
    const host = this.scrollHost?.nativeElement;
    if (!host) return;
    const stickyWidth = this.getStickyWidth();
    const visible = Math.max(host.clientWidth - stickyWidth, 0);
    const maxScroll = Math.max(host.scrollWidth - host.clientWidth, 0);
    // 水平スクロールが可能で、可視幅も確定しているタイミングを狙う
    if (visible > 0 && maxScroll > 0) {
      this.scrollToToday();
      this.hasAutoCentered = true;
    } else if (visible > 0) {
      // 横スクロールが不要（内容が狭い）でも即時表示に切り替える
      if (!this.isReady) {
        this.isReady = true;
        this.cdr.markForCheck();
      }
    }
  }

  // フィルター候補を構築し、全選択で初期化
  private buildFilters(): void {
    const typeSet = new Set(this.tasks.map((t) => t.type));
    const nameSet = new Set(this.tasks.map((t) => t.name));
    const assigneeSet = new Set(this.tasks.map((t) => t.assignee));
    this.filters.type.options = Array.from(typeSet);
    this.filters.name.options = Array.from(nameSet);
    this.filters.assignee.options = Array.from(assigneeSet);
    this.filters.type.selected = new Set(this.filters.type.options);
    this.filters.name.selected = new Set(this.filters.name.options);
    this.filters.assignee.selected = new Set(this.filters.assignee.options);
    this.filters.type.keyword = '';
    this.filters.name.keyword = '';
    this.filters.assignee.keyword = '';
  }

  // フィルター条件から表示用タスクビューを生成
  private updateTaskViews(): void {
    const filtered = this.tasks.filter(
      (t) =>
        this.filters.type.selected.has(t.type) &&
        this.filters.name.selected.has(t.name) &&
        this.filters.assignee.selected.has(t.assignee),
    );
    this.taskViews = filtered.map((t) => {
      const start = this.toStartOfDay(t.start);
      const end = this.toStartOfDay(t.end);
      // 実績キーセット（Date と 'YYYY-MM-DD' 文字列の両方に対応）
      const actualKeys = new Set<string>(
        (t.actualDates ?? []).map((d) => {
          let asDate: Date;
          if (typeof d === 'string') {
            const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) {
              // ローカル日付として厳密にパース（UTCにしない）
              asDate = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
            } else {
              asDate = new Date(d);
            }
          } else {
            asDate = d;
          }
          return this.formatDateKey(this.toStartOfDay(asDate));
        }),
      );
      return { task: t, start, end, actualKeys };
    });
    // ビューが変わったらバーを再構築
    this.updateOverlayBars();
  }

  // フィルターポップアップの開閉を切り替え
  toggleFilterPopup(name: FilterName, event?: MouseEvent): void {
    // 開く直前のクリックで外側ハンドラに伝播させない
    event?.stopPropagation();
    this.filterPopup = this.filterPopup === name ? null : name;
    // ゾーン非依存 + OnPush 環境での描画反映を確実にする
    this.cdr.markForCheck();
  }

  // フィルターポップアップを閉じる
  closeFilterPopup(): void {
    this.filterPopup = null;
    this.cdr.markForCheck();
  }

  // フィルターの選択変更を反映
  onFilterChange(name: FilterName, option: string, checked: boolean): void {
    const selected = this.filters[name].selected;
    if (checked) selected.add(option);
    else selected.delete(option);
    this.updateTaskViews();
  }

  // キーワード前方一致で候補を絞り込み
  getFilteredOptions(name: FilterName): string[] {
    const { options, keyword } = this.filters[name];
    return options.filter((o) => o.startsWith(keyword));
  }

  // 当該日に実績があるか
  isActual(view: TaskView, date: Date): boolean {
    const key = this.formatDateKey(this.toStartOfDay(date));
    return view.actualKeys.has(key);
  }

  // 実績セグメントの開始/終了
  isActualStart(view: TaskView, date: Date): boolean {
    return this.isActual(view, date) && !this.isActual(view, this.addDays(date, -1));
  }

  isActualEnd(view: TaskView, date: Date): boolean {
    return this.isActual(view, date) && !this.isActual(view, this.addDays(date, 1));
  }

  // 指定日が見える位置に水平スクロールを合わせる（次フレームで中央寄せ）
  public scrollToDate(date: Date): void {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;

    const target = this.toStartOfDay(date);
    // インデックス算出を Date 同士の比較ではなく、正規化キーで行う
    const key = this.formatDateKey(target);
    const idx = this.dateKeys.indexOf(key);
    if (idx < 0) return;

    const align = () => {
      const stickyWidth = this.getStickyWidth();
      const visible = Math.max(host.clientWidth - stickyWidth, 0);
      let left = this.getDateCellLeft(idx);
      if (left === 0) {
        // ターゲットが見つからない/未レイアウト時のフォールバック
        const firstLeft = this.getDateCellLeft(0);
        if (firstLeft > 0) left = firstLeft + idx * GanttChartComponent.CELL_WIDTH;
        else left = stickyWidth + idx * GanttChartComponent.CELL_WIDTH;
      }
      const targetCenter = left + GanttChartComponent.CELL_WIDTH / 2;
      const desired = targetCenter - stickyWidth - visible / 2;
      const maxScroll = Math.max(host.scrollWidth - host.clientWidth, 0);
      host.scrollLeft = Math.min(Math.max(Math.round(desired), 0), maxScroll);
      this.updateScrollbarThumb();
      // 初回センタリング完了。ここで可視化し、以降は自動センタリングしない
      if (!this.isReady) {
        this.isReady = true;
        this.cdr.markForCheck();
      }
      this.hasAutoCentered = true;
    };
    requestAnimationFrame(align);
  }

  // 今日の列が見える位置にスクロール
  public scrollToToday(): void {
    this.scrollToDate(this.getToday());
  }

  // スクロール後の描画更新（水平・垂直スクロールバー）
  private handleScrollRaf(): void {
    this.updateScrollbarThumb();
    this.updateVScrollbarThumb();
  }

  // セルのマウスダウン：フォーカス位置と行列インデックスを記録
  onCellMouseDown(event: MouseEvent, rowIdx: number, colIdx: number): void {
    const host = this.scrollHost?.nativeElement;
    const cell = event.currentTarget as HTMLElement | null;
    if (!host || !cell) return;
    const hostRect = host.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    this.focusedCell = {
      x: cellRect.left - hostRect.left + host.scrollLeft,
      y: cellRect.top - hostRect.top + host.scrollTop,
    };
    this.focusedCellIdx = { row: rowIdx, col: colIdx };
  }

  // 進捗のインライン編集を開始
  startProgressEdit(task: Task, rowIdx: number, colIdx: number): void {
    this.editingCell = { row: rowIdx, col: colIdx, task };
    this.progressValue = '';
  }

  // セルが編集中か
  isEditingCell(rowIdx: number, colIdx: number): boolean {
    return (
      this.editingCell?.row === rowIdx && this.editingCell?.col === colIdx
    );
  }

  // 進捗編集の確定とイベント通知
  commitProgress(): void {
    if (!this.editingCell) return;
    const value = Number(this.progressValue);
    if (!isNaN(value) && value > 0) {
      const date = this.dateRange[this.editingCell.col];
      this.progressInput.emit({ task: this.editingCell.task, value, date });
    }
    this.editingCell = null;
    this.progressValue = '';
  }

  // 最後にフォーカスしたセルのスクロール座標を取得
  getFocusedCellPosition(): { x: number; y: number } | null {
    return this.focusedCell ?? null;
  }

  // 今日列のスクロール座標（メモ作成位置の基準）を取得
  getTodayColumnPosition(): { x: number; y: number } {
    const host = this.scrollHost?.nativeElement;
    if (!host) return { x: 0, y: 0 };
    const headerHeight = this.getHeaderHeight();
    const today = this.getToday();
    const idx = this.dateRange.findIndex((d) => this.isSameDay(d, today));
    const th = host.querySelector<HTMLElement>(`.head-2 th[data-idx="${idx}"]`);
    const x = th ? th.offsetLeft : 0;
    return { x, y: headerHeight };
  }

  // メモドラッグ開始：オフセットと固定領域幅を保持
  onMemoMouseDown(event: MouseEvent, memo: Memo): void {
    if (this.editingMemoId === memo.id) return;
    const el = event.currentTarget as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const stickyWidth = this.getStickyWidth();
    const headerHeight = this.getHeaderHeight();
    this.dragData = {
      memo,
      el,
      offsetX,
      offsetY,
      stickyWidth,
      headerHeight,
    };
    document.addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseup', this.onUp);
    event.preventDefault();
  }

  // 列ホバー開始
  onColumnMouseEnter(colIdx: number): void {
    if (this.hoveredColIdx === colIdx) return;
    this.hoveredColIdx = colIdx;
  }

  // 列ホバー終了
  onColumnMouseLeave(): void {
    if (this.hoveredColIdx === null) return;
    this.hoveredColIdx = null;
  }

  // セルがフォーカス中か
  protected isFocusedCell(row: number, col: number): boolean {
    return this.focusedCellIdx?.row === row && this.focusedCellIdx?.col === col;
  }

  // メモの右下リサイズ開始
  onMemoResizeMouseDown(event: MouseEvent, memo: Memo): void {
    event.stopPropagation();
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement | null;
    const el = handle?.parentElement as HTMLElement | null;
    if (!el) return;
    const stickyWidth = this.getStickyWidth();
    const headerHeight = this.getHeaderHeight();
    this.resizeData = {
      memo,
      el,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: el.offsetWidth,
      startHeight: el.offsetHeight,
      stickyWidth,
      headerHeight,
    };
    document.addEventListener('mousemove', this.onResizeMove);
    document.addEventListener('mouseup', this.onResizeUp);
  }

  // メモフォーカス喪失時：内容とサイズを確定
  onMemoBlur(event: FocusEvent, memo: Memo): void {
    const el = event.target as HTMLElement | null;
    if (!el) return;
    memo.text = el.innerText;
    memo.contentHtml = el.innerHTML;
    memo.width = el.offsetWidth;
    memo.height = el.offsetHeight;
    this.memoChange.emit({ ...memo });
    this.editingMemoId = null;
  }

  // メモクリック終了時：ドラッグでなければ内容とサイズを確定
  onMemoMouseUp(event: MouseEvent, memo: Memo): void {
    if (this.dragData) return;
    const el = event.currentTarget as HTMLElement | null;
    if (!el) return;
    memo.width = el.offsetWidth;
    memo.height = el.offsetHeight;
    memo.text = this.getMemoBodyText(el);
    memo.contentHtml = el.querySelector<HTMLElement>('.memo-body')?.innerHTML ?? memo.contentHtml;
    this.memoChange.emit({ ...memo });
  }

  // メモ編集トグル（クリックで編集開始/既に編集中なら終了）
  protected toggleEdit(memo: Memo, el: HTMLElement, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.editingMemoId === memo.id) {
      el.blur();
      return;
    }
    this.editingMemoId = memo.id;
    setTimeout(() => el.focus());
  }

  // メモドラッグ中の位置更新
  private handleDrag(event: MouseEvent): void {
    if (!this.dragData) return;
    const host = this.scrollHost?.nativeElement;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const {
      offsetX,
      offsetY,
      stickyWidth,
      headerHeight,
      el,
      memo,
    } = this.dragData;
    const x = event.clientX - rect.left + host.scrollLeft - offsetX;
    const y = event.clientY - rect.top + host.scrollTop - offsetY;
    const maxX = host.scrollWidth - el.offsetWidth;
    const maxY = host.scrollHeight - el.offsetHeight;
    memo.x = Math.min(Math.max(x, stickyWidth), maxX);
    memo.y = Math.min(Math.max(y, headerHeight), maxY);
    this.cdr.detectChanges();
  }

  // メモリサイズ中のサイズ更新
  private handleResize(event: MouseEvent): void {
    if (!this.resizeData) return;
    const { el, memo, startX, startY, startWidth, startHeight } =
      this.resizeData;
    const width = startWidth + (event.clientX - startX);
    const height = startHeight + (event.clientY - startY);
    const clampedWidth = Math.max(GanttChartComponent.MIN_MEMO_WIDTH_PX, width);
    el.style.width = `${clampedWidth}px`;
    el.style.height = `${height}px`;
    memo.width = clampedWidth;
    memo.height = el.offsetHeight;
    this.cdr.detectChanges();
  }

  // メモドラッグ終了：内容・サイズを反映しイベント通知
  private endDrag(): void {
    if (!this.dragData) return;
    const { memo, el } = this.dragData;
    memo.width = el.offsetWidth;
    memo.height = el.offsetHeight;
    memo.text = this.getMemoBodyText(el);
    memo.contentHtml = el.querySelector<HTMLElement>('.memo-body')?.innerHTML ?? memo.contentHtml;
    this.memoChange.emit({ ...memo });
    this.dragData = undefined;
    document.removeEventListener('mousemove', this.onMove);
    document.removeEventListener('mouseup', this.onUp);
  }

  // メモリサイズ終了：内容・サイズを反映しイベント通知
  private endResize(): void {
    if (!this.resizeData) return;
    const { memo, el } = this.resizeData;
    memo.width = el.offsetWidth;
    memo.height = el.offsetHeight;
    memo.text = this.getMemoBodyText(el);
    memo.contentHtml = el.querySelector<HTMLElement>('.memo-body')?.innerHTML ?? memo.contentHtml;
    this.memoChange.emit({ ...memo });
    this.resizeData = undefined;
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeUp);
  }

  // メモ本文のプレーンテキストを取得
  private getMemoBodyText(el: HTMLElement): string {
    return el.querySelector<HTMLElement>('.memo-body')?.innerText ?? '';
  }

  // 行クリック：タスクを上位へ通知
  onRowClick(view: TaskView): void {
    this.taskClick.emit(view.task);
  }

  // 固定列の合計幅（キャッシュ値）
  private getStickyWidth(): number {
    // Use cached sticky width to avoid reflow on every scroll
    return this.stickyWidthCache;
  }

  // ヘッダーの合計高さ（キャッシュ値）
  private getHeaderHeight(): number {
    // Use cached header height to avoid reflow on every scroll
    return this.headerHeightCache;
  }

  // 2日付の差日数（切り捨て）
  private diffDays(a: Date, b: Date): number {
    return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }
  // 日付に日数を加算
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  // 今日の日付（0:00固定）を取得
  private getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  // 月を加算
  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }
  // 日付を0:00に正規化
  private toStartOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }
  // 同一日付か
  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  // 表示期間内の全日付配列とキー配列を構築
  private buildDateRange(): void {
    const dates: Date[] = [];
    const keys: string[] = [];
    for (
      let d = new Date(this.rangeStart);
      d <= this.rangeEnd;
      d.setDate(d.getDate() + 1)
    ) {
      const cur = new Date(d);
      dates.push(cur);
      keys.push(this.formatDateKey(cur));
    }
    this.dateRange = dates;
    this.dateKeys = keys;
  }

  // 表示期間の更新（基準：今日から-6～+12ヶ月、オフセット適用）
  private updateRange(): void {
    const today = this.getToday();
    const baseStart = this.addMonths(
      today,
      -GanttChartComponent.PAST_MONTHS,
    );
    const baseEnd = this.addMonths(
      today,
      GanttChartComponent.FUTURE_MONTHS,
    );
    const shift = GanttChartComponent.SPAN_MONTHS * this.spanOffset;
    this.rangeStart = this.addMonths(baseStart, shift);
    this.rangeEnd = this.addMonths(baseEnd, shift);
    this.buildDateRange();
    this.emitRangeChange();
    this.cdr.markForCheck();
    this.updateOverlayBars();
  }

  // 表示期間を1スパン分（18ヶ月）移動
  moveSpan(direction: number): void {
    this.spanOffset += direction;
    this.updateRange();
    this.scrollToDate(this.rangeStart);
    this.updateScrollbarThumb();
  }

  // YYYY-MM-DD の日付キーを生成
  private formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 水平スクロールバー：クリック・ドラッグ開始
  onScrollbarMouseDown(event: MouseEvent): void {
    const host = this.scrollHost?.nativeElement;
    const bar = this.hScrollbar?.nativeElement;
    const thumb = this.hScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return;
    const barRect = bar.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const clickX = event.clientX - barRect.left;
    if (event.target !== thumb) {
      const pos = clickX - thumbRect.width / 2;
      host.scrollLeft = this.positionToScroll(pos);
      this.updateScrollbarThumb();
    }
    const thumbPos = thumbRect.left - barRect.left;
    this.barDrag = { startX: event.clientX, startThumbPos: thumbPos };
    document.addEventListener('mousemove', this.onScrollbarMouseMove);
    document.addEventListener('mouseup', this.onScrollbarMouseUp);
    event.preventDefault();
    event.stopPropagation();
  }

  // 水平スクロールバー：ドラッグ中のスクロール反映
  private onScrollbarMouseMove = (e: MouseEvent): void => {
    if (!this.barDrag) return;
    const host = this.scrollHost?.nativeElement;
    const bar = this.hScrollbar?.nativeElement;
    const thumb = this.hScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return;
    const barRect = bar.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const track = barRect.width - thumbRect.width;
    const deltaX = e.clientX - this.barDrag.startX;
    const pos = Math.min(
      Math.max(this.barDrag.startThumbPos + deltaX, 0),
      track,
    );
    host.scrollLeft = this.positionToScroll(pos);
    this.updateScrollbarThumb();
  };

  // 水平スクロールバー：ドラッグ終了
  private onScrollbarMouseUp = (): void => {
    document.removeEventListener('mousemove', this.onScrollbarMouseMove);
    document.removeEventListener('mouseup', this.onScrollbarMouseUp);
    this.barDrag = undefined;
  };

  // 水平スクロールバーのつまみ位置→スクロール量へ変換
  private positionToScroll(pos: number): number {
    const host = this.scrollHost?.nativeElement;
    const bar = this.hScrollbar?.nativeElement;
    const thumb = this.hScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return 0;
    const track = bar.clientWidth - thumb.clientWidth;
    const maxScroll = host.scrollWidth - host.clientWidth;
    const ratio = track === 0 ? 0 : pos / track;
    return maxScroll * ratio;
  }

  // 水平スクロールバーのつまみサイズと位置を更新
  private updateScrollbarThumb(): void {
    const host = this.scrollHost?.nativeElement;
    const bar = this.hScrollbar?.nativeElement;
    const thumb = this.hScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return;
    const stickyWidth = this.getStickyWidth();
    const visible = host.clientWidth - stickyWidth;
    const total = host.scrollWidth - stickyWidth;
    const barWidth = bar.clientWidth;
    const thumbWidth = total === 0 ? barWidth : (visible / total) * barWidth;
    thumb.style.width = `${thumbWidth}px`;
    const maxScroll = host.scrollWidth - host.clientWidth;
    const track = barWidth - thumbWidth;
    const pos = maxScroll === 0 ? 0 : (host.scrollLeft / maxScroll) * track;
    thumb.style.transform = `translateX(${pos}px)`;
  }

  // 縦スクロールバー: マウスダウン
  onVScrollbarMouseDown(event: MouseEvent): void {
    const host = this.scrollHost?.nativeElement;
    const bar = this.vScrollbar?.nativeElement;
    const thumb = this.vScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return;
    const barRect = bar.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const clickY = event.clientY - barRect.top;
    if (event.target !== thumb) {
      const pos = clickY - thumbRect.height / 2;
      host.scrollTop = this.positionToScrollV(pos);
      this.updateVScrollbarThumb();
    }
    const thumbPos = thumbRect.top - barRect.top;
    this.vBarDrag = { startY: event.clientY, startThumbPos: thumbPos };
    document.addEventListener('mousemove', this.onVScrollbarMouseMove);
    document.addEventListener('mouseup', this.onVScrollbarMouseUp);
    event.preventDefault();
    event.stopPropagation();
  }

  // 縦スクロールバー：ドラッグ中のスクロール反映
  private onVScrollbarMouseMove = (e: MouseEvent): void => {
    if (!this.vBarDrag) return;
    const host = this.scrollHost?.nativeElement;
    const bar = this.vScrollbar?.nativeElement;
    const thumb = this.vScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return;
    const barRect = bar.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const track = barRect.height - thumbRect.height;
    const deltaY = e.clientY - this.vBarDrag.startY;
    const pos = Math.min(Math.max(this.vBarDrag.startThumbPos + deltaY, 0), track);
    host.scrollTop = this.positionToScrollV(pos);
    this.updateVScrollbarThumb();
  };

  // 縦スクロールバー：ドラッグ終了
  private onVScrollbarMouseUp = (): void => {
    document.removeEventListener('mousemove', this.onVScrollbarMouseMove);
    document.removeEventListener('mouseup', this.onVScrollbarMouseUp);
    this.vBarDrag = undefined;
  };

  // 縦スクロールバーのつまみ位置→スクロール量へ変換
  private positionToScrollV(pos: number): number {
    const host = this.scrollHost?.nativeElement;
    const bar = this.vScrollbar?.nativeElement;
    const thumb = this.vScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return 0;
    const track = bar.clientHeight - thumb.clientHeight;
    const maxScroll = host.scrollHeight - host.clientHeight;
    const ratio = track === 0 ? 0 : pos / track;
    return maxScroll * ratio;
  }

  // 縦スクロールバーのつまみサイズと位置を更新
  private updateVScrollbarThumb(): void {
    const host = this.scrollHost?.nativeElement;
    const bar = this.vScrollbar?.nativeElement;
    const thumb = this.vScrollbarThumb?.nativeElement;
    if (!host || !bar || !thumb) return;
    const headerH = this.getHeaderHeight();
    const visible = Math.max(host.clientHeight - headerH, 0);
    const total = Math.max(host.scrollHeight - headerH, 1);
    const barH = bar.clientHeight;
    const thumbH = total === 0 ? barH : (visible / total) * barH;
    thumb.style.height = `${thumbH}px`;
    const maxScroll = host.scrollHeight - host.clientHeight;
    const track = barH - thumbH;
    const pos = maxScroll === 0 ? 0 : (host.scrollTop / maxScroll) * track;
    thumb.style.transform = `translateY(${pos}px)`;
  }

  // 画面1ページ相当で縦スクロール
  scrollVerticalByPage(direction: number): void {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;
    const headerH = this.getHeaderHeight();
    const page = Math.max(host.clientHeight - headerH, 0);
    host.scrollTop += direction * Math.max(page * 0.9, 40);
    this.updateVScrollbarThumb();
  }

  // 表示期間の変更を親へ通知
  private emitRangeChange(): void {
    this.rangeChange.emit({
      start: new Date(this.rangeStart),
      end: new Date(this.rangeEnd),
    });
  }

  // 固定列幅とヘッダー高さを再計算してキャッシュ（スクロール中の再計測抑制）
  private updateDimensionCaches(): void {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;
    // Compute sticky columns width by summing widths of header cells with sticky-left
    const stickyCols = host.querySelectorAll<HTMLElement>('.head-1 .sticky-left');
    this.stickyWidthCache = Array.from(stickyCols).reduce((sum, el) => sum + el.offsetWidth, 0);
    // Compute total header height (two header rows) from thead height
    const header = host.querySelector('thead');
    this.headerHeightCache = header?.offsetHeight ?? 0;
    // 行高とステップ（高さ+ボーダー）を計測
    const rows = host.querySelectorAll('tbody tr');
    const firstRow = rows.item(0) as HTMLElement | null;
    const secondRow = rows.item(1) as HTMLElement | null;
    this.rowHeightCache = firstRow?.clientHeight || this.rowHeightCache;
    if (firstRow && secondRow) {
      const r1 = firstRow.getBoundingClientRect();
      const r2 = secondRow.getBoundingClientRect();
      this.rowStepCache = Math.max(1, Math.round(r2.top - r1.top));
    } else {
      // 下線1pxを想定
      this.rowStepCache = this.rowHeightCache + 1;
    }
  }

  // 行のY座標（0ベース, スクロールコンテンツ座標）
  private getRowTop(row: number): number {
    // ヘッダーの下端を基準に、行高+ボーダー（rowStepCache）で算出
    return this.getHeaderHeight() + row * this.rowStepCache;
  }

  // 列の左端X（0ベース, スクロールコンテンツ座標）
  private getColLeft(idx: number): number {
    // 左固定エリアの総幅 + 日列幅 * インデックス
    const stickyWidth = this.getStickyWidth();
    return stickyWidth + idx * GanttChartComponent.CELL_WIDTH;
  }

  // オーバーレイバーの再構築
  private updateOverlayBars(): void {
    const host = this.scrollHost?.nativeElement;
    if (!host) return;
    const headerH = this.getHeaderHeight();
    const rowH = this.rowHeightCache;
    const barH = 10; // 予定・実績ともに同じ太さ
    const lanePadding = 3; // レーン配置用の上下余白

    const lastIdx = this.dateRange.length - 1;
    if (lastIdx < 0) { this.plannedBars = []; this.actualBars = []; return; }

    const barsPlan: typeof this.plannedBars = [];
    const barsActual: typeof this.actualBars = [];

    // planned/actual bars per row（非重複区間は中央、重複区間は上下レーンに分離）
    const hostEl = this.scrollHost?.nativeElement;
    const rowEls = hostEl?.querySelectorAll('tbody tr') ?? ([] as unknown as NodeListOf<HTMLElement>);
    // 行がまだレンダリングされていないタイミングでは次フレームで再試行
    if (!rowEls || rowEls.length === 0) {
      requestAnimationFrame(() => this.updateOverlayBars());
      return;
    }
    this.taskViews.forEach((view, row) => {
      // clamp indices to visible range
      const sKey = this.formatDateKey(view.start);
      const eKey = this.formatDateKey(view.end);
      const sFind = this.dateKeys.indexOf(sKey);
      const eFind = this.dateKeys.indexOf(eKey);
      const sIdx = sFind === -1 ? 0 : sFind;
      const eIdx = eFind === -1 ? lastIdx : eFind;
      if (sIdx < 0 || eIdx < 0 || sIdx > eIdx) return;
      // 0ベース（行インデックス）で厳密に位置を決める
      const rowTop = this.getRowTop(row);
      const rowHThis = (rowEls && (rowEls as any)[row]?.clientHeight) || rowH;
      const stepH = this.rowStepCache || rowHThis + 1;
      const centerTop = headerH + row * stepH + Math.max((rowHThis - barH) / 2, 0);
      const topLaneTop = headerH + row * stepH + lanePadding;
      const bottomLaneTop = headerH + row * stepH + Math.max(rowHThis - lanePadding - barH, 0);

      // 実績の重複インデックス集合
      const overlapIdx = new Set<number>();
      for (let idx = sIdx; idx <= eIdx; idx++) {
        if (this.isActual(view, this.dateRange[idx])) overlapIdx.add(idx);
      }

      // 実績が一切ない行は、予定を行中央に一本描画して早期リターン
      if (overlapIdx.size === 0) {
        const left = this.getColLeft(sIdx);
        const width = (eIdx - sIdx + 1) * GanttChartComponent.CELL_WIDTH;
        barsPlan.push({ id: `p-${row}-${sIdx}-${eIdx}`, left, top: centerTop, width, height: barH, start: true, end: true });
        return;
      }

      // 予定を重複/非重複で分割して配置
      let segStart: number | null = null;
      let segOverlap: boolean | null = null;
      const flushPlanSeg = (start: number, end: number, overlap: boolean) => {
        const left = this.getColLeft(start);
        const width = (end - start + 1) * GanttChartComponent.CELL_WIDTH;
        const top = overlap ? topLaneTop : centerTop;
        barsPlan.push({ id: `p-${row}-${start}-${end}`, left, top, width, height: barH, start: true, end: true });
      };
      for (let idx = sIdx; idx <= eIdx; idx++) {
        const ov = overlapIdx.has(idx);
        if (segStart === null) {
          segStart = idx; segOverlap = ov;
        } else if (segOverlap !== ov) {
          flushPlanSeg(segStart, idx - 1, segOverlap!);
          segStart = idx; segOverlap = ov;
        }
      }
      if (segStart !== null) flushPlanSeg(segStart, eIdx, segOverlap!);

      // actual segments
      const indices = this.dateRange
        .map((d, i) => ({ i, d }))
        .filter(({ d }) => this.isActual(view, d))
        .map(({ i }) => i);
      // group contiguous
      let aSegStart: number | null = null;
      for (let k = 0; k < indices.length; k++) {
        const cur = indices[k];
        const prev = indices[k - 1];
        if (aSegStart === null) aSegStart = cur;
        if (k === indices.length - 1 || indices[k + 1] !== cur + 1) {
          const segEnd = cur;
          const aLeft = this.getColLeft(aSegStart);
          const aWidth = (segEnd - aSegStart + 1) * GanttChartComponent.CELL_WIDTH;
          const intersectsPlan = !(segEnd < sIdx || aSegStart > eIdx);
          const outOfPlan = !intersectsPlan;
          const aTop = intersectsPlan ? bottomLaneTop : centerTop;
          barsActual.push({ id: `a-${row}-${aSegStart}-${segEnd}` , left: aLeft, top: aTop, width: aWidth, height: barH, start: true, end: true, outOfPlan });
          aSegStart = null;
        }
      }
    });

    this.plannedBars = barsPlan;
    this.actualBars = barsActual;
    this.cdr.markForCheck();
  }

  // 指定インデックスの日付セルの左端オフセットを取得
  private getDateCellLeft(idx: number): number {
    const host = this.scrollHost?.nativeElement;
    if (!host) return 0;
    const th = host.querySelector<HTMLElement>(`.head-2 th[data-idx="${idx}"]`);
    if (!th) return 0;
    // テーブル内のコンテンツ座標系（スクロール左端=0）でのX座標
    const hostRect = host.getBoundingClientRect();
    const thRect = th.getBoundingClientRect();
    return (thRect.left - hostRect.left) + host.scrollLeft;
  }

  // （未使用）
}
