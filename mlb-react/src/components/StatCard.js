import { useState } from "react";
import '../pages/OddsPage.css';


export default function StatCard({ index, odds, showHistoricalData }) {
    return (
        <div key={index} className="card w-full max-w-lg bg-base-100 shadow-xl mx-auto my-4">
            <div className="card-body p-4">
                <h2 className="card-title text-2xl font-bold text-white">{odds.PlayerName}</h2>
                <p className="text-sm text-gray-300"><strong>Team:</strong> {odds.team} vs. <strong>Opponent:</strong> {odds.opp}</p>
                <div className="divider"></div>
                <div className="flex flex-col space-y-2">
                    <div className="flex justify-between text-gray-400">
                        <p><strong>Over/Under:</strong> {odds.Over_Under}</p>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <p><strong>DraftKings:</strong> {odds.draftkings}</p>
                        <p><strong>FanDuel:</strong> {odds.fanduel}</p>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <p><strong>MGM:</strong> {odds.mgm}</p>
                        <p><strong>BetRivers:</strong> {odds.betrivers}</p>
                    </div>
                    <div className="flex justify-between text-gray-400">
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
