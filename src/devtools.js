import convert from 'convert-source-map';
import { SourceMapConsumer } from 'source-map';
import wasm from 'source-map/lib/mappings.wasm';
import { detectEOL, getCommonPathPrefix, getFirstRegexMatch, getOccurrencesCount, getSize, mergeRanges } from './helpers.js';
import { generateForHtml } from './html.js';

SourceMapConsumer.initialize({
  "lib/mappings.wasm": wasm,
});
export const UNMAPPED_KEY = '[unmapped]';
export const SOURCE_MAP_COMMENT_KEY = '[sourceMappingURL]';
export const NO_SOURCE_KEY = '[no source]';
export const EOL_KEY = '[EOLs]';

const tabId = browser.devtools.inspectedWindow.tabId;
/**
Create a panel, and add listeners for panel show/hide events.
*/
browser.devtools.panels.create(
  "Sourcemaps",
  "/icons/48.png",
  "/devtools/panel/panel.html"
).then((newPanel) => {
  let currentPanel;
  console.log('create panel');
  const port = browser.runtime.connect({ name: 'source-maps-devtools' });
  port.postMessage({ tabId });

  port.onMessage.addListener(({ event, status }) => {
    console.log('received', event, status);
    if (status === 'complete') reloadData(currentPanel);
    if (status === 'loading') currentPanel?.postMessage({
      type: 'sourcemaps',
      loading: true
    });
  })

  newPanel.onShown.addListener(async (panel) => {
    console.log('panel is being shown', tabId, panel);
    currentPanel = panel;
    await reloadData(panel);
  });

  newPanel.onHidden.addListener(() => {
    console.log('panel is being hidden');
    currentPanel = undefined;
  });
});

async function reloadData(panel) {
  if (!panel) return;
  panel.postMessage({
    type: 'sourcemaps',
    loading: true
  });

  const result = await getSourceMapInfo();

  panel.postMessage({
    type: 'sourcemaps',
    ...result
  });
}


async function getSourceMapInfo() {
  try {
    const getScriptSources = "Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s.length)";
    const result = await browser.devtools.inspectedWindow.eval(getScriptSources).then(handleError);

    const contents = await getSourceMapsData(result);

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
  const sourceMapComment =
    getFirstRegexMatch(COMMENT_REGEX, fileContent) ||
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
  const eolBytes = getOccurrencesCount(eol, srcContent) * getSize(eol);
  const totalBytes = getSize(srcContent);
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
