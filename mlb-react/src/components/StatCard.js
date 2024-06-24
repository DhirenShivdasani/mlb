import { useState } from "react";
import '../pages/OddsPage.css';

export default function StatCard({ index, odds, showHistoricalData}) {
    console.log(index, odds)
    return (
    <div key={index} className="odds-card">
        <p><strong>Player:</strong> {odds.PlayerName}</p>
        <p><strong>Team:</strong> {odds.team} vs. <strong>Opponent:</strong> {odds.opp}</p>
        <div className="prop-row">
            <p><strong>Prop:</strong> {odds.Prop}</p>
            <p><strong>Over/Under:</strong> {odds.Over_Under}</p>
        </div>
        <div className="prop-row">
            <p><strong>DraftKings:</strong> {odds.draftkings}</p>
            <p><strong>FanDuel:</strong> {odds.fanduel}</p>
        </div>
        <div className="prop-row">
            <p><strong>MGM:</strong> {odds.mgm}</p>
            <p><strong>BetRivers:</strong> {odds.betrivers}</p>
        </div>
        <div className="prop-row">
            <p><strong>Implied Prob:</strong> {parseFloat(odds.Implied_Prob).toFixed(2)}%</p>
        </div>
        <hr />
        <button onClick={() => showHistoricalData(odds.PlayerName, odds.Prop)}>View Historical Data</button>
    </div>
    )
}