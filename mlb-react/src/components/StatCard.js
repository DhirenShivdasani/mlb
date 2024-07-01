import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as regularHeart } from '@fortawesome/free-regular-svg-icons';
import { faHeart as solidHeart } from '@fortawesome/free-solid-svg-icons';
import { requestNotificationPermission } from '../firebase';
import './StatCard.css';

export default function StatCard({ index, odds, showHistoricalData, sport, imageUrl, favorites, setFavorites }) {
  const [fcmToken, setFcmToken] = useState('');

  useEffect(() => {
    const fetchToken = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
      }
    };
    fetchToken();
  }, []);

  const isFavorite = favorites[sport]?.includes(odds.PlayerName + odds.Prop + odds.Over_Under);

  const toggleFavorite = async () => {
    const updatedFavorites = isFavorite
      ? favorites[sport].filter(fav => fav !== odds.PlayerName + odds.Prop + odds.Over_Under)
      : [...favorites[sport], odds.PlayerName + odds.Prop + odds.Over_Under];

    setFavorites(prevFavorites => ({ ...prevFavorites, [sport]: updatedFavorites }));

    try {
      const url = isFavorite ? '/remove_favorite_prop' : '/favorite_prop';
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fcm_token: fcmToken,
          sport,
          player_name: odds.PlayerName,
          prop: odds.Prop,
          over_under: odds.Over_Under,
        }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error updating favorite prop:', error);
    }
  };

  const getPropLabel = () => {
    return sport === 'wnba' ? 'WNBA Prop' : 'MLB Prop';
  };

  return (
    <div key={index} className={`stat-card w-full max-w-lg bg-base-100 shadow-xl mx-auto my-4 ${sport}`}>
      <div className="stat-card-body p-4 relative">
        <div className="flex-center mb-4">
          <img src={imageUrl} alt={odds.PlayerName} className="object-cover" />
        </div>
        <FontAwesomeIcon
          icon={isFavorite ? solidHeart : regularHeart}
          onClick={toggleFavorite}
          className={`favorite-icon ${isFavorite ? 'favorite' : ''}`}
        />
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
