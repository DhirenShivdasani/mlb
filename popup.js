document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['oddsData'], function(result) {
      const oddsDiv = document.getElementById('odds');
      const oddsData = result.oddsData;

      if (oddsData) {
          oddsDiv.innerHTML = ''; // Clear the loading message

          oddsData.forEach(bet => {
              const betDiv = document.createElement('div');
              betDiv.className = 'odds';

              betDiv.innerHTML = `
                  <div><strong>${bet.PlayerName} (${bet.team} vs. ${bet.opp})</strong></div>
                  <div>Prop: ${bet.Prop} - ${bet.Over_Under}</div>
                  <div>DraftKings: ${bet.draftkings}</div>
                  <div>FanDuel: ${bet.fanduel}</div>
                  <div>MGM: ${bet.mgm}</div>
              `;

              oddsDiv.appendChild(betDiv);
          });
      } else {
          oddsDiv.textContent = 'No odds data available';
      }
  });
});
