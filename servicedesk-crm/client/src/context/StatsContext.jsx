import React, { createContext, useState, useContext } from "react";

const StatsContext = createContext();

export const StatsProvider = ({ children }) => {
const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 });


const updateStats = (newStats) => setStats(newStats);

return (
    <StatsContext.Provider value={{ stats, updateStats }}>
        {children}
    </StatsContext.Provider>
);


};

export const useStats = () => useContext(StatsContext);
