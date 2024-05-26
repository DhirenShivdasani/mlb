console.log('Content script loaded');

// Add styles for the odds data
const style = document.createElement('style');
style.innerHTML = `
  .odds-comparison {
    margin-top: 10px;
    font-size: 0.9em;
    color: #333;
  }
  .odds-comparison div {
    margin-bottom: 5px;
  }
`;
document.head.appendChild(style);

// Function to insert odds data into the page
function insertOddsData(oddsData) {
  console.log('Inserting odds data:', oddsData);

  const existingOddsElements = document.querySelectorAll('.odds-comparison');
  existingOddsElements.forEach(element => element.remove());

  // Select all player prop bet elements
  const propBetElements = document.querySelectorAll('.styles__overUnderCell__KgzNn');
  console.log('Found propBetElements:', propBetElements);

  propBetElements.forEach((element) => {
    // Avoid duplicate inserts

    const playerNameElement = element.querySelector('h1.styles__playerName__jW6mb[data-testid="player-name"]');
    const propTypeElements = element.querySelectorAll('div.styles__statLine__K1NYh p'); // Adjust as needed

    if (playerNameElement && propTypeElements.length > 0) {
      const playerName = playerNameElement.innerText;

      propTypeElements.forEach((propElement) => {
        const propText = propElement.innerText;
        const match = propText.match(/^(\d+(\.\d+)?)\s+(.*)$/);
        if (match) {
          const propValue = match[1];
          const propType = match[3];

          // Find matching odds data
          const matchingOdds = oddsData.filter(odds => odds.PlayerName === playerName && odds.Prop === propType);

          if (matchingOdds.length > 0) {
            console.log('Found matching odds for player:', playerName, matchingOdds);

            matchingOdds.forEach(match => {
              // Create a new element to display the odds
              const oddsDiv = document.createElement('div');
              oddsDiv.className = 'odds-comparison';
              oddsDiv.innerHTML = `
                <div>${match.Over_Under}</div>
                <div>DraftKings: ${match.draftkings}</div>
                <div>FanDuel: ${match.fanduel}</div>
                <div>MGM: ${match.mgm}</div>
              `;
              propElement.insertAdjacentElement('afterend', oddsDiv);
            });
          }
        }
      });
    }
  });
}


// Add a button to the page to manually trigger the odds data insertion
function addManualTriggerButton() {
  const button = document.createElement('button');
  button.textContent = 'Insert Odds Data';
  button.style.position = 'fixed';
  button.style.top = '10px';
  button.style.right = '10px';
  button.style.zIndex = '1000';
  button.style.padding = '10px 20px';
  button.style.backgroundColor = '#007bff';
  button.style.color = '#fff';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.addEventListener('click', () => {
    chrome.storage.local.get('oddsData', (result) => {
      if (result.oddsData) {
        insertOddsData(result.oddsData);
      } else {
        console.log('No odds data found in storage.');
      }
    });
  });
  document.body.appendChild(button);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in content script:', message);
  if (message.type === 'ODDS_DATA') {
    setTimeout(() => {
      insertOddsData(message.data);
      addManualTriggerButton(); // Add the manual trigger button
    }, 5000); // 5-second delay before inserting odds data
    sendResponse({ status: 'Odds data insertion scheduled' });
  }
});
