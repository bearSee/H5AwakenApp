export default function formatDate(date = new Date(), format = 'YYYY-MM-DD') {
  if (['number', 'string'].includes(typeof date)) date = new Date(date);
  if (date instanceof Date) {
    const o = {
      year: date.getFullYear(), // 年份
      'M+': date.getMonth() + 1, // 月份
      'D+': date.getDate(), // 日
      'h+': date.getHours(), // 小时
      'm+': date.getMinutes(), // 分
      's+': date.getSeconds(), // 秒
      'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
      'S+': date.getMilliseconds(), // 毫秒
    };
    // 年份单独处理
    if (/(Y+)/.test(format)) {
      format = format.replace(RegExp.$1, o.year.toString().substr(4 - RegExp.$1.length));
    }
    // 其余按需替换
    /* eslint-disable */
    for (const k in o) {
      if (new RegExp(`(${k})`).test(format)) {
        format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : ((`00${o[k]}`).substr((`${o[k]}`).length)));
      }
    }
  } else {
    return '';
  }
  return format;
}
