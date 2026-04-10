// 股票搜索服务 - 输入验证和格式化

/**
 * 验证并格式化股票代码
 * 支持输入: 纯代码(600519)、带前缀(sh600519)、名称
 */
export function parseStockInput(input: string): { code: string; name?: string } | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  // 提取数字部分
  const digits = trimmed.replace(/\D/g, "");

  // 如果是6位数字，认为是股票代码
  if (digits.length === 6) {
    return { code: digits };
  }

  // 如果有4-6位数字，尝试补全
  if (digits.length >= 4 && digits.length < 6) {
    // 根据首位数字补全
    const firstDigit = digits[0];
    if (firstDigit === "6") {
      return { code: digits.padStart(6, "0") }; // 沪市
    } else if (firstDigit === "0" || firstDigit === "3") {
      return { code: digits.padStart(6, "0") }; // 深市
    }
  }

  // 非数字输入，当作名称返回
  if (digits.length === 0) {
    return { code: "", name: trimmed };
  }

  // 默认当作代码处理
  if (digits.length > 6) {
    return { code: digits.slice(0, 6) };
  }

  return { code: digits };
}

/**
 * 获取股票名称 (从 TradingView 数据中获取)
 */
export async function getStockInfo(input: string): Promise<{ code: string; name: string } | null> {
  const parsed = parseStockInput(input);

  if (!parsed) {
    return null;
  }

  // 如果输入的是名称，需要通过 API 查询代码
  // 这里简化处理：名称输入时，code 为空，后续由 TradingView API 返回
  if (!parsed.code && parsed.name) {
    // 返回名称，让调用方处理
    return { code: "", name: parsed.name };
  }

  return { code: parsed.code, name: parsed.name || "" };
}
