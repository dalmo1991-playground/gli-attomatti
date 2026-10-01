export interface PublishStatus {
  type: 'success' | 'error';
  msg: string;
  branch?: string;
  commitUrl?: string;
  shortSha?: string;
}

export interface DiffEntry {
  path: string;
  oldVal: any;
  newVal: any;
}

export interface AdminTab {
  id: string;
  label: string;
  icon: any;
  category: 'main' | 'content' | 'tools';
}

export interface RecoverableDraft {
  timestamp: number;
  dateStr: string;
  diffCount: number;
  content: any;
}
