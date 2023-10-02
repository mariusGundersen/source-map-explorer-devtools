import convert from 'convert-source-map';
import { mapKeys } from 'lodash';
import { SourceMapConsumer } from 'source-map';
import wasm from 'source-map/lib/mappings.wasm';
import { detectEOL, getCommonPathPrefix, getFirstRegexMatch, getOccurrencesCount, getSize, mergeRanges } from './helpers.js';
import { generateForHtml } from './html.js';

const UNMAPPED_KEY = '[unmapped]';
const SOURCE_MAP_COMMENT_KEY = '[sourceMappingURL]';
const NO_SOURCE_KEY = '[no source]';
const EOL_KEY = '[EOLs]';

SourceMapConsumer.initialize({
  "lib/mappings.wasm": wasm,
});

export async function getSourceMapInfo() {
  try {
    const jsSources = await browser.devtools.inspectedWindow.eval(`Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s.length)`).then(handleError);
    const cssSources = await browser.devtools.inspectedWindow.eval(`Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(l => l.href).filter(s => s.length)`).then(handleError);

    const contents = await getSourceMapsData([...jsSources, ...cssSources]);

    return generateForHtml(contents.filter(Boolean));
  } catch (error) {
    if (error.isError) {
      console.log(`Devtools error: ${error.code}`);
    } else {
      console.error(error);
    }
  }
}

function getText(url) {
  return fetch(url).then(r => r.text());
}


async function getSourceMapsData(result) {
  return await Promise.all(result.map(async (srcPath) => {
    const srcContent = await getText(srcPath);

    const converter = await convert.fromMapFileSource(srcContent, (filename) => getText(new URL(filename, srcPath)));

    if (!converter) return null;

    const consumer = await new SourceMapConsumer(converter.toJSON());

    const sizes = computeFileSizes(consumer, srcContent);

    const files = adjustSourcePaths(sizes.files);

    // Free Wasm data
    consumer.destroy();

    return {
      bundleName: srcPath,
      files,
      ...sizes
    };
  }));
}
function handleError([result, error]) {
  if (error) throw error;
  return result;
}
const COMMENT_REGEX = convert.commentRegex;
const MAP_FILE_COMMENT_REGEX = convert.mapFileCommentRegex;
/**
 * Extract either source map comment/file
 */
function getSourceMapComment(fileContent) {
  const sourceMapComment = getFirstRegexMatch(COMMENT_REGEX, fileContent) ||
    getFirstRegexMatch(MAP_FILE_COMMENT_REGEX, fileContent) ||
    '';

  // Remove trailing EOLs
  return sourceMapComment.trim();
}
function computeFileSizes(consumer, fileContent) {

  const sourceMapComment = getSourceMapComment(fileContent);
  // Remove inline source map comment, source map file comment and trailing EOLs
  const srcContent = fileContent.replace(sourceMapComment, '').trim();

  const eol = detectEOL(fileContent);
  // Assume only one type of EOL is used
  const lines = srcContent.split(eol);

  const mappingRanges = [];

  const context = {
    generatedLine: -1,
    generatedColumn: -1,
    line: '',
    source: null,
    consumer,
    mapReferenceEOLSources: new Set(),
  };

  consumer.computeColumnSpans();
  consumer.eachMapping(({ source, generatedLine, generatedColumn, lastGeneratedColumn }) => {
    // Columns are 0-based, Lines are 1-based
    const lineIndex = generatedLine - 1;
    const line = lines[lineIndex];

    if (line === undefined) {
      throw new AppError({
        code: 'InvalidMappingLine',
        generatedLine,
        maxLine: lines.length,
      });
    }

    context.generatedLine = generatedLine;
    context.generatedColumn = lastGeneratedColumn || generatedColumn;
    context.line = line;
    context.source = source;

    const start = generatedColumn;
    const end = lastGeneratedColumn === null ? line.length - 1 : lastGeneratedColumn;

    const lineRanges = mappingRanges[lineIndex] || [];

    lineRanges.push({
      start,
      end,
      source: source === null ? NO_SOURCE_KEY : source,
    });

    mappingRanges[lineIndex] = lineRanges;
  });

  let files = {};
  let mappedBytes = 0;

  mappingRanges.forEach((lineRanges, lineIndex) => {
    const line = lines[lineIndex];
    const mergedRanges = mergeRanges(lineRanges);

    mergedRanges.forEach(({ start, end, source }) => {
      const rangeString = line.substring(start, end + 1);
      const rangeByteLength = getSize(rangeString);

      if (!files[source]) {
        files[source] = { size: 0 };
      }

      files[source].size += rangeByteLength;

      mappedBytes += rangeByteLength;
    });
  });

  const sourceMapCommentBytes = getSize(sourceMapComment);
  const eolBytes = getOccurrencesCount(eol, fileContent) * getSize(eol);
  const totalBytes = getSize(fileContent);
  let unmappedBytes;

  files[SOURCE_MAP_COMMENT_KEY] = { size: sourceMapCommentBytes };

  unmappedBytes = totalBytes - mappedBytes - sourceMapCommentBytes - eolBytes;
  files[UNMAPPED_KEY] = { size: unmappedBytes };

  if (eolBytes > 0) {
    files[EOL_KEY] = { size: eolBytes };
  }

  return {
    totalBytes,
    mappedBytes,
    unmappedBytes,
    eolBytes,
    sourceMapCommentBytes,
    files,
  };
}
function adjustSourcePaths(fileSizeMap) {
  const prefix = getCommonPathPrefix(Object.keys(fileSizeMap));
  const length = prefix.length;

  if (length) {
    fileSizeMap = mapKeys(fileSizeMap, (size, source) => source.slice(length));
  }


  return fileSizeMap;
}
