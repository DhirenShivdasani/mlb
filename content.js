// const ws = new WebSocket('ws://dfs-odds-extension-11be6b12d681.herokuapp.com/merged_data');

// ws.onmessage = (event) => {
//     if (event.data === 'update') {
//         console.log('Data updated, reloading extension...');
//         // Reload the extension or trigger necessary updates
//         location.reload();
//     }
// };

// ws.onopen = () => {
//     console.log('Connected to WebSocket server');
// };

// ws.onclose = () => {
//     console.log('Disconnected from WebSocket server');
// };


// console.log('Content script loaded');
// Increase the limit of max listeners


// Add styles for the odds data and tooltip
const style = document.createElement('style');
style.innerHTML = `
  .odds-comparison {
    display: none;
    position: absolute;
    background: #fff;
    border: 1px solid #ccc;
    padding: 10px;
    font-size: 0.9em;
    color: #333;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  .odds-symbol {
    margin-left: 10px;
    cursor: pointer;
    color: red;
    font-size: 1.5em; /* Increase the font size for a bigger icon */
  }
`;

document.head.appendChild(style);

// Function to insert odds data into the page
function insertOddsDataUnderdog(oddsData) {
  console.log('Inserting odds data:', oddsData);

  const existingOddsElements = document.querySelectorAll('.odds-comparison');
  existingOddsElements.forEach(element => element.remove());

  const existingSymbols = document.querySelectorAll('.odds-symbol');
  existingSymbols.forEach(symbol => symbol.remove());

  // Select all player prop bet elements
  const propBetElements = document.querySelectorAll('.styles__overUnderCell__KgzNn');

  propBetElements.forEach((element) => {
    const playerNameElement = element.querySelector('h1.styles__playerName__Coe_G[data-testid="player-name"]');
    const propTypeElements = element.querySelectorAll('div.styles__currentStat__S6U2b div');
    
    if (playerNameElement && propTypeElements.length > 0) {
      const playerName = playerNameElement.innerText;

      propTypeElements.forEach((propElement) => {
        const propText = propElement.innerText.trim(); // Ensure no leading/trailing whitespace

        let propValue = null;
        let propType = null;

        // Check if propText is a number followed by text or just text
        if (/^\d+(\.\d+)?\s+[\s\S]+$/.test(propText)) {
          const match = propText.match(/^(\d+(\.\d+)?)(?:\s+)([\s\S]+)$/);
          if (match) {
            propValue = match[1];
            propType = match[3].trim();
          }
        } else {
          // Handle cases where propText is only text
          propType = propText;
          // Log the propType
        }

        if (propType) {
          const matchingOdds = oddsData.filter(odds => odds.PlayerName === playerName && odds.Prop === propType);

          if (matchingOdds.length > 0) {

            // Create a symbol to indicate available odds data
            const symbol = document.createElement('span');
            symbol.className = 'odds-symbol';
            symbol.innerHTML = 'ℹ️';

            const oddsDiv = document.createElement('div');
            oddsDiv.className = 'odds-comparison';
            oddsDiv.style.display = 'none'; // Initially hidden
            oddsDiv.style.position = 'absolute';
            oddsDiv.style.backgroundColor = '#fff';
            oddsDiv.style.border = '1px solid #ccc';
            oddsDiv.style.padding = '10px';
            oddsDiv.style.zIndex = '1000';

            matchingOdds.forEach(match => {
              oddsDiv.innerHTML += `
                <div>${match.Over_Under}</div>
                <div>DraftKings: ${match.draftkings}</div>
                <div>FanDuel: ${match.fanduel}</div>
                <div>MGM: ${match.mgm}</div>
                <div>BetRivers: ${match.betrivers}</div>
                <br>
              `;
            });

            symbol.addEventListener('mouseover', () => {
              oddsDiv.style.display = 'block';
              const rect = symbol.getBoundingClientRect();
              oddsDiv.style.top = `${rect.top + window.scrollY + 20}px`;
              oddsDiv.style.left = `${rect.left + window.scrollX}px`;
            });

            symbol.addEventListener('mouseout', () => {
              oddsDiv.style.display = 'none';
            });

            propElement.insertAdjacentElement('afterend', symbol);
            document.body.appendChild(oddsDiv);
          }
        }
      });
    }
  });
}

function insertOddsDataPrizePicks(oddsData) {
  console.log('Inserting odds data for PrizePicks:', oddsData);

  const existingOddsElements = document.querySelectorAll('.odds-comparison');
  existingOddsElements.forEach(element => element.remove());

  const existingSymbols = document.querySelectorAll('.odds-symbol');
  existingSymbols.forEach(symbol => symbol.remove());

  const propBetElements = document.querySelectorAll('li[id^="test-projection-li"]');
  console.log('Found propBetElements:', propBetElements);

  propBetElements.forEach((element) => {
    const playerNameElement = element.querySelector('#test-player-name');
    const propContainerElements = element.querySelectorAll('.flex.justify-center.gap-2.self-end.py-2');
    console.log(propContainerElements);

    if (playerNameElement && propContainerElements.length > 0) {
      const playerName = playerNameElement.innerText;

      propContainerElements.forEach((containerElement) => {
        const propValueElement = containerElement.querySelector('.flex.flex-1.items-center.pr-2');
        const propTypeElement = containerElement.querySelector('.self-center .text-left.text-xs.font-medium');

        const propValue = propValueElement ? propValueElement.innerText.trim() : null;
        const propType = propTypeElement ? propTypeElement.innerText.trim() : null;

        console.log('Prop Value:', propValue);
        console.log('Prop Type:', propType);

        if (propType) {
          const matchingOdds = oddsData.filter(odds => odds.PlayerName === playerName && odds.Prop === propType);

          if (matchingOdds.length > 0) {
            console.log('Found matching odds for player:', playerName, matchingOdds);

            const symbol = document.createElement('span');
            symbol.className = 'odds-symbol';
            symbol.innerHTML = 'ℹ️';

            const oddsDiv = document.createElement('div');
            oddsDiv.className = 'odds-comparison';
            oddsDiv.style.display = 'none';
            oddsDiv.style.position = 'absolute';
            oddsDiv.style.backgroundColor = '#fff';
            oddsDiv.style.border = '1px solid #ccc';
            oddsDiv.style.padding = '10px';
            oddsDiv.style.zIndex = '1000';

            matchingOdds.forEach(match => {
              oddsDiv.innerHTML += `
                <div>${match.Over_Under}</div>
                <div>DraftKings: ${match.draftkings}</div>
                <div>FanDuel: ${match.fanduel}</div>
                <div>MGM: ${match.mgm}</div>
                <div>BetRivers: ${match.betrivers}</div>
                <br>
              `;
            });

            symbol.addEventListener('mouseover', () => {
              oddsDiv.style.display = 'block';
              const rect = symbol.getBoundingClientRect();
              oddsDiv.style.top = `${rect.top + window.scrollY + 20}px`;
              oddsDiv.style.left = `${rect.left + window.scrollX}px`;
            });

            symbol.addEventListener('mouseout', () => {
              oddsDiv.style.display = 'none';
            });

            containerElement.insertAdjacentElement('afterend', symbol);
            document.body.appendChild(oddsDiv);
          }
        }
      });
    }
  });
}


document.addEventListener('click', (event) => {
  const url = window.location.href;
  console.log(url)
  const isUnderdog = url.includes('underdogfantasy.com');
  const isPrizePicks = url.includes('prizepicks.com');

  if (isUnderdog) {
    const propElement = event.target.closest('.styles__overUnderCell__KgzNn');
    const gameElement = event.target.closest('.styles__headerRow__jgOPy.styles__accordionHeaderRow__XHEcc');
    if (propElement || gameElement) {
      chrome.storage.local.get('oddsData', (result) => {
        if (result.oddsData) {
          insertOddsDataUnderdog(result.oddsData);
        } else {
          console.log('No odds data found in storage.');
        }
      });
    }
  } else if (isPrizePicks) {
    const propElement = event.target.closest('li[id^="test-projection-li"]');
    const statButton = event.target.closest('.stat');
    if (propElement || statButton) {
      chrome.storage.local.get('oddsData', (result) => {
        if (result.oddsData) {
          insertOddsDataPrizePicks(result.oddsData);
        } else {
          console.log('No odds data found in storage.');
        }
      });
    }
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in content script:', message);
  const url = window.location.href;
  const isUnderdog = url.includes('underdogfantasy.com');
  const isPrizePicks = url.includes('prizepicks.com');

  if (message.type === 'ODDS_DATA') {
    setTimeout(() => {
      if (isUnderdog) {
        insertOddsDataUnderdog(message.data);
      } else if (isPrizePicks) {
        insertOddsDataPrizePicks(message.data);
      }
    }, 5000); // 5-second delay before inserting odds data
    sendResponse({ status: 'Odds data insertion scheduled' });
  }
});
