export function humanSize(val) { // starts with bytes
    var i = 0;
    var units = 'B KB MB GB'.split(' ');
    while (val > 1024) {
        val = val / 1024;
        i++;
    }
    return Math.max(val, 0.1).toFixed(1) + units[i];
}
export function humanTime(val) { // starts with ms
    var i = 0;
    var units = 'ms s min h d'.split(' ');
    var intervals = [1000, 60, 60, 24];
    while (val >= intervals[i]) {
        val = val / intervals[i];
        i++;
    }
    return Math.max(val, 0.1).toFixed(1) + ' ' + units[i];
}
export function humanCount(val) {
    var i = 0;
    var units = ' K M B T Q'.split(' ');
    while (val >= 1000) {
        val = val / 1000;
        i++;
    }
    return Math.max(val, 0.1).toFixed(1) + units[i];
}