import { handleEvent } from './helpers';

browser.runtime.onConnect.addListener(p => {
  let visible = false;
  let currentTabId = undefined;
  let reloadedInBackground = true;

  const onUpdateHandler = (tabId, { status }) => {
    if (visible) {
      p.postMessage({ event: status, tabId });
    } else {
      reloadedInBackground = true;
    }
  }

  p.onDisconnect.addListener(() => {
    if (currentTabId) browser.tabs.onUpdated.removeListener(onUpdateHandler);
  });

  p.onMessage.addListener(handleEvent({
    async onShown({ tabId }) {
      if (!currentTabId) {
        currentTabId = tabId;
        browser.tabs.onUpdated.addListener(onUpdateHandler, { tabId, properties: ['status'] });
      }

      visible = true;

      if (reloadedInBackground) {
        onUpdateHandler(tabId, await browser.tabs.get(tabId));
      }
    },
    onHidden() {
      visible = false;
      reloadedInBackground = false;
    }
  }));
});

