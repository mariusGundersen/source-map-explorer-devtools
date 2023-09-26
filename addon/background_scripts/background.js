
/**
Listen for messages from our devtools panel.
*/
console.log('background');

browser.runtime.onConnect.addListener(p => {
  console.log('runtime.onConnect', p);
  p.onMessage.addListener(({ tabId }) => {
    console.log('onMessage.addListener', tabId);
    browser.tabs.onUpdated.addListener((tabId, { status }) => {
      console.log('tab status changed', tabId, status);
      p.postMessage({ event: 'reload', status });
    }, { tabId, properties: ['status'] })
  })
});