import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output, ViewChild } from '@angular/core';
import { Memo } from '../../../domain/model/memo';

@Component({
  selector: 'app-memo',
  standalone: true,
  templateUrl: './memo.component.html',
  styleUrl: './memo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoComponent {
  // ボタンとピンが重ならずすべて表示できる最低幅（px）
  private static readonly MIN_WIDTH_PX = 190;
  menuOpen = false;
  @Input({ required: true }) memo!: Memo;
  @Input() editing = false;
  @Output() memoMouseDown = new EventEmitter<MouseEvent>();
  @Output() memoMouseUp = new EventEmitter<MouseEvent>();
  @Output() memoResizeMouseDown = new EventEmitter<MouseEvent>();
  @Output() memoBlur = new EventEmitter<FocusEvent>();
  @Output() editToggle = new EventEmitter<{ el: HTMLElement; event: MouseEvent }>();
  @Output() memoDelete = new EventEmitter<string>();
  @ViewChild('memoBody', { static: true }) memoBody!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  @HostBinding('class.memo') memoClass = true;
  @HostBinding('class.editing') get isEditing(): boolean {
    return this.editing;
  }
  @HostBinding('style.left.px') get left(): number {
    return this.memo.x;
  }
  @HostBinding('style.top.px') get top(): number {
    return this.memo.y;
  }
  @HostBinding('style.min-width.px') minWidth = MemoComponent.MIN_WIDTH_PX;
  @HostBinding('style.width.px') get width(): number {
    return Math.max(this.memo.width, MemoComponent.MIN_WIDTH_PX);
  }
  @HostBinding('style.height.px') get height(): number {
    return this.memo.height;
  }
  @HostBinding('style.position') position = 'absolute';

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.memoMouseDown.emit(event);
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    this.memoMouseUp.emit(event);
  }

  onResizeMouseDown(event: MouseEvent): void {
    this.memoResizeMouseDown.emit(event);
  }

  onBlur(event: FocusEvent): void {
    this.memoBlur.emit(event);
  }

  onEditButton(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.editToggle.emit({ el: this.memoBody.nativeElement, event });
  }

  onDeleteButton(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.memoDelete.emit(this.memo.id);
  }

  onAddImageClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.fileInput?.nativeElement.click();
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input || !input.files || input.files.length === 0) return;
    this.insertImages(Array.from(input.files));
    input.value = '';
  }

  private insertImages(files: File[]): void {
    const body = this.memoBody?.nativeElement;
    if (!body) return;
    files.filter(f => f.type.startsWith('image/')).forEach(f => {
      const url = URL.createObjectURL(f);
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'image';
      img.style.maxWidth = '100%';
      img.style.display = 'block';
      img.style.margin = '6px 0';
      body.appendChild(img);
    });
  }
  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.menuOpen = false;
  }
}
