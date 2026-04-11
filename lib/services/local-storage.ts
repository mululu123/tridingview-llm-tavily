// 本地存储服务 - 用于保存历史输入和离线记录

const STORAGE_KEYS = {
  INPUT_HISTORY: "stock_input_history",
  ANALYSIS_HISTORY: "analysis_history",
};

export interface InputHistoryItem {
  value: string;
  timestamp: string;
}

export interface LocalAnalysisRecord {
  id: string;
  type: "stock" | "market_hot";
  stock_code?: string;
  stock_name?: string;
  analysis_result: string;
  created_at: string;
}

/**
 * 保存输入历史
 */
export function saveInputHistory(input: string): void {
  if (typeof window === "undefined") return;

  const history = getInputHistory();

  // 去重：如果已存在则更新时间
  const existingIndex = history.findIndex((h) => h.value === input);
  if (existingIndex >= 0) {
    history.splice(existingIndex, 1);
  }

  // 添加到开头
  history.unshift({
    value: input,
    timestamp: new Date().toISOString(),
  });

  // 保留最近 20 条
  const trimmed = history.slice(0, 20);

  localStorage.setItem(STORAGE_KEYS.INPUT_HISTORY, JSON.stringify(trimmed));
}

/**
 * 获取输入历史
 */
export function getInputHistory(): InputHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.INPUT_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 清空输入历史
 */
export function clearInputHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.INPUT_HISTORY);
}

/**
 * 保存分析记录到本地
 */
export function saveLocalAnalysis(record: LocalAnalysisRecord): void {
  if (typeof window === "undefined") return;

  const history = getLocalAnalysis();

  // 添加到开头
  history.unshift(record);

  // 保留最近 50 条
  const trimmed = history.slice(0, 50);

  localStorage.setItem(STORAGE_KEYS.ANALYSIS_HISTORY, JSON.stringify(trimmed));
}

/**
 * 获取本地分析记录
 */
export function getLocalAnalysis(type?: "stock" | "market_hot"): LocalAnalysisRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.ANALYSIS_HISTORY);
    const records: LocalAnalysisRecord[] = data ? JSON.parse(data) : [];

    if (type) {
      return records.filter((r) => r.type === type);
    }

    return records;
  } catch {
    return [];
  }
}

/**
 * 删除本地分析记录
 */
export function deleteLocalAnalysis(id: string): void {
  if (typeof window === "undefined") return;

  const history = getLocalAnalysis();
  const filtered = history.filter((r) => r.id !== id);

  localStorage.setItem(STORAGE_KEYS.ANALYSIS_HISTORY, JSON.stringify(filtered));
}

/**
 * 清空本地分析记录
 */
export function clearLocalAnalysis(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.ANALYSIS_HISTORY);
}
