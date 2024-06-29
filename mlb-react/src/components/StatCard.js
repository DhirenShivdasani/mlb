import React from 'react';
import './StatCard.css';

export default function StatCard({ index, odds, showHistoricalData, sport, imageUrl }) {
    const getPropLabel = () => {
        if (sport === 'wnba') {
            return 'WNBA Prop';
        }
        // Default to MLB prop if not WNBA
        return 'MLB Prop';
    };

    return (
        <div key={index} className={`stat-card w-full max-w-lg bg-base-100 shadow-xl mx-auto my-4 ${sport}`}>
            <div className="stat-card-body p-4">
                <div className="flex-center mb-4">
                    <img src={imageUrl} alt={odds.PlayerName} className="object-cover" />
                </div>
                <h2 className="stat-card-title">{odds.PlayerName}</h2>
                <p className="text-gray-300"><strong>Team:</strong> {odds.team} vs. <strong>Opponent:</strong> {odds.opp}</p>

                <div className="divider"></div>
                <div className="prop-odds">
                    <div className="flex text-gray-400">
                        <p><strong>{getPropLabel()}:</strong> {odds.Prop}</p>
                        <p><strong>Over/Under:</strong> {odds.Over_Under}</p>
                    </div>
                    <div className="flex text-gray-400">
                        <p><strong>DraftKings:</strong> {odds.draftkings}</p>
                        <p><strong>FanDuel:</strong> {odds.fanduel}</p>
                    </div>
                    <div className="flex text-gray-400">
                        <p><strong>MGM:</strong> {odds.mgm}</p>
                        <p><strong>BetRivers:</strong> {odds.betrivers}</p>
                    </div>
                    <div className="flex text-gray-400">
                        <p><strong>Implied Prob:</strong> {parseFloat(odds.Implied_Prob).toFixed(2)}%</p>
                    </div>
                </div>
                <div className="divider"></div>
                <div className="card-actions justify-end">
                    <button className="btn btn-primary" onClick={() => showHistoricalData(odds.PlayerName, odds.Prop, odds.Over_Under)}>View Historical Data</button>
                </div>
            </div>
        </div>
    );
}
