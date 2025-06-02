// 曜日を取得して営業状況を判定
export function isStoreOpenToday(closedDays: string[], temporaryClosed?: boolean): boolean {
  // 臨時休業の場合
  if (temporaryClosed) {
    return false;
  }

  // 日本時間で現在の曜日を取得
  const tokyoTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const dayOfWeek = tokyoTime.getDay();
  
  // 曜日の名前を取得
  const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const todayName = dayNames[dayOfWeek];

  // 定休日に今日が含まれているか確認
  return !closedDays.includes(todayName);
}