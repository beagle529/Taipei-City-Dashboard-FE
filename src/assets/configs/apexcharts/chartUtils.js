/**
 * 共用座標軸數值格式化工具
 *
 * 規則：
 *  - 整數 → 直接顯示（不帶小數點）
 *  - 浮點數 → 最多 2 位小數（去除多餘的 0）
 *  - 絕對值 >= 10000 → 縮寫成 k（千）
 *  - 若有 unit → 在數字後加一空格與單位
 */
export function fmtAxisVal(val, unit = "") {
    if (val === null || val === undefined || isNaN(val)) return "";
    let n;
    if (Math.abs(val) >= 10000) {
        n = (val / 1000).toFixed(1) + "k";
    } else if (val === Math.trunc(val)) {
        n = val;                          // 整數，不加小數點
    } else {
        n = parseFloat(val.toFixed(2));   // 最多 2 位小數
    }
    return unit ? `${n} ${unit}` : String(n);
}
