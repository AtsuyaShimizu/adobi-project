export interface Memo {
  id: string;
  text: string;
  /** 任意: リッチテキスト用のHTML。画像貼付も保存したい場合に使用 */
  contentHtml?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
