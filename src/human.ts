export function humanSize(val) { // starts with bytes
    var i = 0;
    var units = 'B KB MB GB'.split(' ');
    while (val > 1024) {
        val = val / 1024;
        i++;
    }
    return Math.max(val, 0.1).toFixed(1) + units[i];
}