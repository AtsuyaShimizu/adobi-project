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
  @Input({ required: true }) memo!: Memo;
  @Input() editing = false;
  @Output() memoMouseDown = new EventEmitter<MouseEvent>();
  @Output() memoMouseUp = new EventEmitter<MouseEvent>();
  @Output() memoResizeMouseDown = new EventEmitter<MouseEvent>();
  @Output() memoBlur = new EventEmitter<FocusEvent>();
  @Output() editToggle = new EventEmitter<{ el: HTMLElement; event: MouseEvent }>();
  @ViewChild('memoBody', { static: true }) memoBody!: ElementRef<HTMLDivElement>;

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
  @HostBinding('style.width.px') get width(): number {
    return this.memo.width;
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
    this.editToggle.emit({ el: this.memoBody.nativeElement, event });
  }
}

