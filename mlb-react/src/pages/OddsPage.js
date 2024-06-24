import React, { useState, useEffect } from 'react';
import Chart from 'chart.js/auto';
import './OddsPage.css'; // Create this CSS file to hold the styles
import StatCard from '../components/StatCard';

const OddsPage = () => {
    const [oddsData, setOddsData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [lastUpdated, setLastUpdated] = useState('N/A');
    const [historicalData, setHistoricalData] = useState([]);
    const [historicalChart, setHistoricalChart] = useState(null);
    const [filters, setFilters] = useState({
        playerName: '',
        teamOpponent: '',
        propType: 'all',
        sortBy: 'default',
    });

    useEffect(() => {
        fetchOdds();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, oddsData]);

    const fetchOdds = async () => {
        const response = await fetch('/merged_data');
        const data = await response.json();
        setOddsData(data);
        updateLastUpdated();
    };

    const applyFilters = () => {
        let filtered = oddsData;

        if (filters.playerName) {
            filtered = filtered.filter(odds => odds.PlayerName.toLowerCase().includes(filters.playerName.toLowerCase()));
        }

        if (filters.teamOpponent) {
            filtered = filtered.filter(odds => `${odds.team} vs. ${odds.opp}`.toLowerCase().includes(filters.teamOpponent.toLowerCase()));
        }

        if (filters.propType !== 'all') {
            filtered = filtered.filter(odds => odds.Prop === filters.propType);
        }

        if (filters.sortBy === 'impliedProbAsc') {
            filtered.sort((a, b) => parseFloat(a.Implied_Prob) - parseFloat(b.Implied_Prob));
        } else if (filters.sortBy === 'impliedProbDesc') {
            filtered.sort((a, b) => parseFloat(b.Implied_Prob) - parseFloat(a.Implied_Prob));
        }

        setFilteredData(filtered);
    };

    const updateLastUpdated = () => {
        const now = new Date();
        const formattedTime = now.toLocaleString('en-US', {
            hour12: true,
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        setLastUpdated(`Last updated: ${formattedTime}`);
    };

    const showHistoricalData = async (playerName, prop) => {
        const response = await fetch(`/get_historical_data?player_name=${playerName}&prop=${prop}`);
        const data = await response.json();
        setHistoricalData(data);

        const timestamps = data.map(item => new Date(item.timestamp).toLocaleString());
        const draftkings = data.map(item => parseFloat(item.draftkings));
        const fanduel = data.map(item => parseFloat(item.fanduel));
        const mgm = data.map(item => parseFloat(item.mgm));
        const betrivers = data.map(item => parseFloat(item.betrivers));

        if (historicalChart) {
            historicalChart.destroy();
        }

        const newChart = new Chart(document.getElementById('historicalChart'), {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [
                    {
                        label: 'DraftKings',
                        data: draftkings,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        fill: false
                    },
                    {
                        label: 'FanDuel',
                        data: fanduel,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        fill: false
                    },
                    {
                        label: 'MGM',
                        data: mgm,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        fill: false
                    },
                    {
                        label: 'BetRivers',
                        data: betrivers,
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                        fill: false
                    }
                ]
            },
            options: {
                scales: {
                    x: { display: true, title: { display: true, text: 'Date' } },
                    y: { display: true, title: { display: true, text: 'Odds' } }
                }
            }
        });

        setHistoricalChart(newChart);
        document.getElementById('historicalModal').style.display = 'block';
    };

    const closeHistoricalModal = () => {
        document.getElementById('historicalModal').style.display = 'none';
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value
        });
    };

    return (
        <div>
            <div className="header">
                <h1>Live Odds Tracker</h1>
                <div className="last-updated" id="last-updated">{lastUpdated}</div>
            </div>
            <div id="notification">New data available. Please refresh the page.</div>
            <div className="filters">
                <div className="filter">
                    <label htmlFor="player-name">Filter by Player:</label>
                    <input
                        type="text"
                        id="player-name"
                        name="playerName"
                        placeholder="Enter player name"
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="filter">
                    <label htmlFor="team-opponent">Filter by Game:</label>
                    <input
                        type="text"
                        id="team-opponent"
                        name="teamOpponent"
                        placeholder="Enter team vs opponent"
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="filter">
                    <label htmlFor="prop-type">Filter by Prop:</label>
                    <select id="prop-type" name="propType" onChange={handleFilterChange}>
                        <option value="all">All</option>
                        <option value="Runs">Runs</option>
                        <option value="Strikeouts">Strikeouts</option>
                        <option value="Total Bases">Total Bases</option>
                    </select>
                </div>
                <div className="filter">
                    <label htmlFor="sort-by">Sort by:</label>
                    <select id="sort-by" name="sortBy" onChange={handleFilterChange}>
                        <option value="default">Default</option>
                        <option value="impliedProbAsc">Implied Prob % (Low to High)</option>
                        <option value="impliedProbDesc">Implied Prob % (High to Low)</option>
                    </select>
                </div>
            </div>
            <div id="odds-container">
                {filteredData.map((odds, index) => (
                    <StatCard odds= {odds} index = {index} showHistoricalData = {showHistoricalData}/>
                ))}
            </div>
            <div id="historicalModal">
                <canvas id="historicalChart"></canvas>
                <button onClick={closeHistoricalModal}>Close</button>
            </div>
        </div>
    );
};

export default OddsPage;
