import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import './OddsPage.css';
import StatCard from '../components/StatCard';

const OddsPage = ({ updateLastUpdated, sport }) => {
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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const originalOddsData = useRef([]);
    const filterTimeout = useRef(null);

    useEffect(() => {
        fetchOdds();
    }, [sport]);

    const fetchOdds = async () => {
        const response = await fetch(`/merged_data?sport=${sport}`);
        const data = await response.json();
        setOddsData(data);
        setFilteredData(data); // Set filteredData to initial data
        originalOddsData.current = data;
        updateLastUpdated(formatDate(new Date()));
    };

    const applyFilters = (filters) => {
        console.log('Applying filters:', filters); // Debug logging
        let filtered = [...originalOddsData.current]; // Ensure we start with original data

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

        console.log('Filtered data:', filtered); // Debug logging
        setFilteredData(filtered);
    };

    useEffect(() => {
        if (filterTimeout.current) {
            clearTimeout(filterTimeout.current);
        }

        filterTimeout.current = setTimeout(() => {
            console.log('Filters changed:', filters); // Debug logging
            applyFilters(filters); // Always apply filters
        }, 300); // Debounce delay of 300ms

        return () => {
            if (filterTimeout.current) {
                clearTimeout(filterTimeout.current);
            }
        };
    }, [filters]);

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

    const showHistoricalData = async (playerName, prop, overUnder) => {
        const encodedPlayerName = encodeURIComponent(playerName);
        const encodedProp = encodeURIComponent(prop);
        const encodedOverUnder = encodeURIComponent(overUnder);
    
        const url = `/get_historical_data?player_name=${encodedPlayerName}&prop=${encodedProp}&over_under=${encodedOverUnder}&sport=${sport}`;
    
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
        const timestamps = filteredData.map(item => new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}));
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
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
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

    const getPaginatedData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredData.slice(startIndex, endIndex);
    };

    const totalPages = useMemo(() => Math.ceil(filteredData.length / itemsPerPage), [filteredData.length]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

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
                        value={filters.playerName} // Ensure input value reflects the filter state
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
                        value={filters.teamOpponent} // Ensure input value reflects the filter state
                    />
                </div>
                <div className="filter">
                    <label htmlFor="prop-type" className="text-white">Filter by Prop:</label>
                    <select
                        id="prop-type"
                        name="propType"
                        className="select select-bordered w-full max-w-xs"
                        onChange={handleFilterChange}
                        value={filters.propType} // Ensure select value reflects the filter state
                    >
                        {sport === 'mlb' ? (
                            <>
                                <option value="all">All</option>
                                <option value="Runs">Runs</option>
                                <option value="Strikeouts">Strikeouts</option>
                                <option value="Total Bases">Total Bases</option>
                            </>
                        ) : (
                            <>
                                <option value="all">All</option>
                                <option value="Points">Points</option>
                                <option value="Rebounds">Rebounds</option>
                                <option value="Assists">Assists</option>
                                <option value="3-Pointers Made">3-Pointers Made</option>
                            </>
                        )}
                    </select>
                </div>
                <div className="filter">
                    <label htmlFor="sort-by" className="text-white">Sort by:</label>
                    <select
                        id="sort-by"
                        name="sortBy"
                        className="select select-bordered w-full max-w-xs"
                        onChange={handleFilterChange}
                        value={filters.sortBy} // Ensure select value reflects the filter state
                    >
                        <option value="default">Default</option>
                        <option value="impliedProbAsc">Implied Prob % (Low to High)</option>
                        <option value="impliedProbDesc">Implied Prob % (High to Low)</option>
                    </select>
                </div>
            </div>
            <div id="odds-container">
                {getPaginatedData().map((odds, index) => (
                    <StatCard 
                        key={index} 
                        odds={odds} 
                        showHistoricalData={() => showHistoricalData(odds.PlayerName, odds.Prop, odds.Over_Under)} 
                        sport={sport} 
                    />
                ))}
            </div>
            <div className="pagination-controls flex justify-center gap-4 mt-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn"
                >
                    Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn"
                >
                    Next
                </button>
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
