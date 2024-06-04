// const socket = new WebSocket('wss://dfs-odds-extension-11be6b12d681.herokuapp.com/merged_data');

// socket.addEventListener('open', function (event) {
//     console.log('WebSocket is open now.');
// });

// socket.addEventListener('message', function (event) {
//     console.log('Message from server ', event.data);
//     if (event.data === 'update') {
//         // Logic to reload or restart your extension
//         chrome.runtime.reload();
//     }
// });

// socket.addEventListener('close', function (event) {
//     console.log('WebSocket is closed now.');
// });

// socket.addEventListener('error', function (event) {
//     console.error('WebSocket error observed:', event);
// });



chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');

  // Load the merged data from your Flask server
  fetch('https://dfs-odds-extension-11be6b12d681.herokuapp.com/merged_data')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        throw new Error('Fetched data is not an array: ' + JSON.stringify(data));
      }
      console.log('Fetched data:', data);
      chrome.storage.local.set({ oddsData: data }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error setting oddsData in local storage:', chrome.runtime.lastError.message);
        } else {
          console.log('Odds data stored successfully');
        }
      });
    })
    .catch(error => {
      console.error('Error fetching merged data:', error.message);
    });
});

// Function to send message with retries
function sendMessageWithRetries(tabId, message, retries = 5) {
  chrome.tabs.sendMessage(tabId, message, response => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message to content script:', chrome.runtime.lastError.message, chrome.runtime.lastError);
      if (retries > 0) {
        setTimeout(() => {
          sendMessageWithRetries(tabId, message, retries - 1);
        }, 1000); // Retry after 1 second
      }
    } else {
      console.log('Message sent to content script:', response);
    }
  });
}

// Listen for tab updates to resend the data if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Tab updated:', tabId, changeInfo, tab);
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('underdogfantasy.com/pick-em/higher-lower/all/mlb')) {
    console.log('Matched URL:', tab.url);
    chrome.storage.local.get('oddsData', (result) => {
      if (result.oddsData) {
        console.log('Sending odds data to content script:', result.oddsData);
        sendMessageWithRetries(tabId, { type: 'ODDS_DATA', data: result.oddsData });
      } else {
        console.log('No odds data found in storage.');
      }
    });
  }
});
