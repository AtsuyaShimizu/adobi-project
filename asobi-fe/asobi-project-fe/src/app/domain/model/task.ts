export interface Task {
  id: string;
  type: string; // classification
  name: string;
  detail: string;
  assignee: string;
  start: Date;
  end: Date;
  progress: number; // 0-100
  /**
   * 実績が投入された日付の配列（任意）。
   * - Date もしくは 'YYYY-MM-DD' 文字列の混在を許容。
   * - 存在しない場合は実績バーは表示されません。
   */
  actualDates?: (Date | string)[];
}
