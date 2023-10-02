import { handleEvent } from './helpers.js';
import { getSourceMapInfo } from './sourcemaps/getSourceMapInfo.js';

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
  const port = browser.runtime.connect({ name: 'source-maps-devtools' });

  port.onMessage.addListener(handleEvent({
    complete() {
      reloadData(currentPanel);
    },
    loading() {
      showLoading(currentPanel);
    }
  }));

  newPanel.onShown.addListener(async (panel) => {
    currentPanel = panel;
    port.postMessage({ event: 'onShown', tabId });
  });

  newPanel.onHidden.addListener(() => {
    currentPanel = undefined;
    port.postMessage({ event: 'onHidden' });
  });
});

async function reloadData(panel) {
  showLoading(panel);
  const result = await getSourceMapInfo();
  showSourcemaps(panel, result);
}

function showSourcemaps(panel, result) {
  panel?.postMessage({
    event: 'complete',
    ...result
  });
}

function showLoading(panel) {
  panel?.postMessage({
    event: 'loading'
  });
}