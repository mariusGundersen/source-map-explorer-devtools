const BYTE_SIZES = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
// Bytes
const SIZE_BASE = 1024;

/**
 * Format number of bytes as string
 * Source @see https://stackoverflow.com/a/18650828/388951
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return `0 ${BYTE_SIZES[0]}`;

  const exponent = Math.floor(Math.log(bytes) / Math.log(SIZE_BASE));
  const value = bytes / Math.pow(SIZE_BASE, exponent);

  // `parseFloat` removes trailing zero
  return `${parseFloat(value.toFixed(decimals))} ${BYTE_SIZES[exponent]}`;
}

export function formatPercent(value, total, fractionDigits) {
  return ((100.0 * value) / total).toFixed(fractionDigits);
}

const PATH_SEPARATOR_REGEX = /(\/)/;

/**
 * Find common path prefix
 * Source @see http://stackoverflow.com/a/1917041/388951
 * @param paths List of filenames
 */
export function getCommonPathPrefix(paths) {
  if (paths.length < 2) return '';

  const A = paths.concat().sort();
  const a1 = A[0].split(PATH_SEPARATOR_REGEX);
  const a2 = A[A.length - 1].split(PATH_SEPARATOR_REGEX);
  const L = a1.length;

  let i = 0;

  while (i < L && a1[i] === a2[i]) i++;

  return a1.slice(0, i).join('');
}

export function getFirstRegexMatch(regex, string) {
  const match = string.match(regex);

  return match ? match[0] : null;
}

const LF = '\n';
const CR_LF = '\r\n';

export function detectEOL(content) {
  return content.includes(CR_LF) ? CR_LF : LF;
}

/**
 * Get `subString` occurrences count in `string`
 */
export function getOccurrencesCount(subString, string) {
  let count = 0;
  let position = string.indexOf(subString);
  const subStringLength = subString.length;

  while (position !== -1) {
    count += 1;
    position = string.indexOf(subString, position + subStringLength);
  }

  return count;
}

export function isEOLAtPosition(string, [line, column]) {
  const eol = detectEOL(string);
  const eolLength = eol.length;

  let lineOffset = 0;

  for (let lineIndex = 1; lineIndex < line; lineIndex += 1) {
    lineOffset = string.indexOf(eol, lineOffset);

    if (lineOffset === -1) {
      return false;
    }

    lineOffset += eolLength;
  }

  return string.substr(lineOffset + column, eolLength) === eol;
}

/**
 * Merge consecutive ranges with the same source
 */
export function mergeRanges(ranges) {
  const mergedRanges = [];
  const rangesCount = ranges.length;

  if (rangesCount === 1) {
    return ranges;
  }

  let { start, end, source } = ranges[0];

  for (let i = 1; i < rangesCount; i += 1) {
    const isSourceMatch = ranges[i].source === ranges[i - 1].source;
    const isConsecutive = ranges[i].start - ranges[i - 1].end === 1;

    if (isSourceMatch && isConsecutive) {
      end = ranges[i].end;
    } else {
      mergedRanges.push({ start, end, source });

      ({ start, end, source } = ranges[i]);
    }
  }

  mergedRanges.push({ start, end, source });

  return mergedRanges;
}


const textEncoder = new TextEncoder();
export function getSize(str) {
  // To account unicode measure byte length rather than symbols count
  return textEncoder.encode(str).length;
}