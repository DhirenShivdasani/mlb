import React, { useState, useEffect } from 'react';
import Chart from 'chart.js/auto';
import './OddsPage.css';
import StatCard from '../components/StatCard';


const OddsPage = ({ updateLastUpdated }) => {
    const [oddsData, setOddsData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [historicalData, setHistoricalData] = useState([]);
    const [historicalChart, setHistoricalChart] = useState(null);
    const [filters, setFilters] = useState({
        playerName: '',
        teamOpponent: '',
        propType: 'all',
        sortBy: 'default',
    });
    const [dataFilter, setDataFilter] = useState(10);

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
        updateLastUpdated(formatDate(new Date()));
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

    const formatDate = (date) => {
        return date.toLocaleString('en-US', {
            hour12: true,
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const showHistoricalData = async (playerName, prop) => {
        const encodedPlayerName = encodeURIComponent(playerName);
        const encodedProp = encodeURIComponent(prop);
        
        const url = `/get_historical_data?player_name=${encodedPlayerName}&prop=${encodedProp}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error fetching historical data: ${response.statusText}`);
            const data = await response.json();
            setHistoricalData(data);

            updateChart(data);
            document.getElementById('historicalModal').style.display = 'block';
        } catch (error) {
            console.error(error.message);
        }
    };

    const updateChart = (data) => {
        const extractOddsValue = (value) => {
            const parts = value.split(' ');
            return parts.length > 1 ? parseFloat(parts[1]) : null;
        };

        const filteredData = data.slice(-dataFilter);
        const timestamps = filteredData.map(item => new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        const draftkings = filteredData.map(item => extractOddsValue(item.draftkings));
        const fanduel = filteredData.map(item => extractOddsValue(item.fanduel));
        const mgm = filteredData.map(item => extractOddsValue(item.mgm));
        const betrivers = filteredData.map(item => extractOddsValue(item.betrivers));

        if (historicalChart) {
            historicalChart.destroy();
        }

        const ctx = document.getElementById('historicalChart').getContext('2d');
        if (ctx) {
            const newChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: timestamps,
                    datasets: [
                        {
                            label: 'DraftKings',
                            data: draftkings,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderWidth: 2,
                            pointRadius: 5,
                            fill: false,
                            tension: 0.4,
                        },
                        {
                            label: 'FanDuel',
                            data: fanduel,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderWidth: 2,
                            pointRadius: 5,
                            fill: false,
                            tension: 0.4,
                        },
                        {
                            label: 'MGM',
                            data: mgm,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 2,
                            pointRadius: 5,
                            fill: false,
                            tension: 0.4,
                        },
                        {
                            label: 'BetRivers',
                            data: betrivers,
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.2)',
                            borderWidth: 2,
                            pointRadius: 5,
                            fill: false,
                            tension: 0.4,
                        }
                    ]
                },
                options: {
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Time',
                                color: '#191',
                                font: {
                                    family: 'Arial',
                                    size: 16,
                                    weight: 'bold',
                                    lineHeight: 1.2,
                                },
                                padding: { top: 20, left: 0, right: 0, bottom: 0 }
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                autoSkip: true,
                                maxTicksLimit: 10,
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Odds',
                                color: '#191',
                                font: {
                                    family: 'Arial',
                                    size: 16,
                                    weight: 'bold',
                                    lineHeight: 1.2,
                                },
                                padding: { top: 30, left: 0, right: 0, bottom: 0 }
                            }
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                }
            });

            setHistoricalChart(newChart);
        } else {
            console.error('Historical chart element not found');
        }
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

    const handleDataFilterChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setDataFilter(value);
        if (historicalData.length > 0) {
            updateChart(historicalData);
        }
    };

    useEffect(() => {
        if (historicalData.length > 0) {
            updateChart(historicalData);
        }
    }, [dataFilter]);

    return (
        <div>
            <div id="notification" className="bg-yellow-300 text-gray-800 p-2 text-center">New data available. Please refresh the page.</div>
            <div className="filters flex flex-wrap justify-center gap-4 p-4 bg-base-200 rounded-lg shadow-md">
                <div className="filter">
                    <label htmlFor="player-name" className="text-white">Filter by Player:</label>
                    <input
                        type="text"
                        id="player-name"
                        name="playerName"
                        placeholder="Enter player name"
                        className="input input-bordered w-full max-w-xs"
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="filter">
                    <label htmlFor="team-opponent" className="text-white">Filter by Game:</label>
                    <input
                        type="text"
                        id="team-opponent"
                        name="teamOpponent"
                        placeholder="Enter team vs opponent"
                        className="input input-bordered w-full max-w-xs"
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="filter">
                    <label htmlFor="prop-type" className="text-white">Filter by Prop:</label>
                    <select
                        id="prop-type"
                        name="propType"
                        className="select select-bordered w-full max-w-xs"
                        onChange={handleFilterChange}
                    >
                        <option value="all">All</option>
                        <option value="Runs">Runs</option>
                        <option value="Strikeouts">Strikeouts</option>
                        <option value="Total Bases">Total Bases</option>
                    </select>
                </div>
                <div className="filter">
                    <label htmlFor="sort-by" className="text-white">Sort by:</label>
                    <select
                        id="sort-by"
                        name="sortBy"
                        className="select select-bordered w-full max-w-xs"
                        onChange={handleFilterChange}
                    >
                        <option value="default">Default</option>
                        <option value="impliedProbAsc">Implied Prob % (Low to High)</option>
                        <option value="impliedProbDesc">Implied Prob % (High to Low)</option>
                    </select>
                </div>
            </div>
            <div id="odds-container">
                {filteredData.map((odds, index) => (
                    <StatCard odds={odds} index={index} showHistoricalData={showHistoricalData} />
                ))}
            </div>
            <div id="historicalModal">
                <div className="modal-header">
                    <select id="data-filter" onChange={handleDataFilterChange} value={dataFilter} className="select select-bordered">
                        <option value={10}>Last 10</option>
                        <option value={50}>Last 50</option>
                        <option value={historicalData.length}>All</option>
                    </select>
                    <button onClick={closeHistoricalModal} className="red-button">Close</button>
                </div>
                <canvas id="historicalChart"></canvas>
            </div>
        </div>
    );
};

export default OddsPage;
