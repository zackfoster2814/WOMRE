import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

type TableName =
  | "races"
  | "subraces"
  | "archetypes"
  | "character_developments"
  | "houses"
  | "powers"
  | "gears"
  | "players"
  | "weapons"
  | "quirks"
  | "House"
  | "PVE";

export default function DataManager() {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<TableName | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const tables: { name: TableName; label: string }[] = [
    { name: "races", label: "Races" },
    { name: "subraces", label: "Subraces" },
    { name: "archetypes", label: "Archetypes" },
    { name: "character_developments", label: "Character Developments" },
    { name: "houses", label: "Houses" },
    { name: "powers", label: "Powers" },
    { name: "gears", label: "Gears" },
    { name: "players", label: "Players" },
    { name: "weapons", label: "Weapons" },
    { name: "quirks", label: "Quirks" },
    { name: "House", label: "House" },
    { name: "PVE", label: "PVE" },
  ];

  const fetchTableData = async (tableName: TableName) => {
    setLoading(true);
    setSelectedTable(tableName);

    try {
      let data: any[] = [];

      switch (tableName) {
        case "races":
          data = window.api ? await window.api.fetchAllRaces() : [];
          break;
        case "subraces":
          data = window.api ? await window.api.fetchAllSubracesWithRace() : [];
          break;
        case "archetypes":
          data = window.api ? await window.api.fetchAllArchetypes() : [];
          break;
        case "character_developments":
          data = window.api ? await window.api.fetchAllCharacterDevelopments() : [];
          break;
        case "houses":
          data = window.api ? await window.api.fetchAllHouses() : [];
          break;
        case "powers":
          data = window.api ? await window.api.fetchAllPowers() : [];
          break;
        case "gears":
          data = window.api ? await window.api.fetchGearByLegacy(0) : [];
          break;
        case "players":
          data = window.api ? await window.api.fetchAllPlayers() : [];
          break;
        case "weapons":
          data = window.api ? await window.api.fetchAllWeapons() : [];
          break;
        case "quirks":
          data = window.api ? await window.api.fetchAllQuirks() : [];
          break;
        case "House":
          data = window.api ? await window.api.fetchAllHouses() : [];
          break;
        case "PVE":
          data = window.api ? await window.api.fetchAllPves() : [];
          break;
      }

      // Extract dataValues if present and flatten race data for subraces
      const cleanedData = data.map((item: any) => {
        const baseData = item._dataValues || item.dataValues || item;

        // If this is subrace data with race association, flatten it
        if (tableName === "subraces" && baseData.race) {
          const raceData = baseData.race._dataValues || baseData.race.dataValues || baseData.race;
          return {
            ...baseData,
            race_name: raceData.name,
            race: undefined // Remove nested race object
          };
        }

        // If this is player data, remove stt field
        if (tableName === "players") {
          const { stt, ...rest } = baseData;
          return rest;
        }

        return baseData;
      });

      setTableData(cleanedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert(`Error fetching ${tableName}: ${error}`);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTableHeaders = () => {
    if (tableData.length === 0) return null;

    const keys = Object.keys(tableData[0]);
    return (
      <thead className="bg-[#2b1d42] sticky top-0">
        <tr>
          {keys.map((key) => (
            <th
              key={key}
              className="px-4 py-3 text-left text-sm font-semibold text-[#d4af37] border-b border-[#8a5b1a]"
            >
              {key}
            </th>
          ))}
        </tr>
      </thead>
    );
  };

  const renderTableRows = () => {
    if (tableData.length === 0) return null;

    return (
      <tbody>
        {tableData.map((row, rowIndex) => {
          const keys = Object.keys(row);

          return (
            <tr
              key={rowIndex}
              className="hover:bg-[#3a2a52] transition-colors border-b border-[#8a5b1a]/30"
            >
              {keys.map((key, colIndex) => {
                const value = row[key];
                const isPlayerName = selectedTable === "players" && key === "name";

                return (
                  <td
                    key={colIndex}
                    className={`px-4 py-2 text-sm ${
                      isPlayerName
                        ? "text-[#d4af37] font-semibold cursor-pointer hover:text-[#c9a532] hover:underline"
                        : "text-gray-200"
                    }`}
                    onClick={() => {
                      if (isPlayerName) {
                        navigate(`/player/${row.id}`);
                      }
                    }}
                  >
                    {value !== null && value !== undefined
                      ? typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)
                      : '-'}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    );
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-[#1a1029] to-[#2b1d42] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#8a5b1a]">
        <h1 className="text-4xl font-bold text-[#d4af37] drop-shadow-[0_0_15px_rgba(255,200,100,0.8)]">
          Database Manager
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/player-editor")}
            className="px-6 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors border border-purple-500"
          >
            ✏️ Edit Players
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors border border-[#8a5b1a]"
          >
            Back to Menu
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Table List */}
        <div className="w-64 bg-[#1a1029] border-r border-[#8a5b1a] p-4 overflow-y-auto">
          <h2 className="text-xl font-bold text-[#d4af37] mb-4">Tables</h2>
          <div className="space-y-2">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => fetchTableData(table.name)}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-lg text-left font-semibold transition-all
                  ${selectedTable === table.name
                    ? 'bg-[#d4af37] text-[#1a1029]'
                    : 'bg-[#2b1d42] text-gray-200 hover:bg-[#3a2a52]'
                  }
                  border border-[#8a5b1a] disabled:opacity-50
                `}
              >
                {table.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Table Data */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-2xl text-[#d4af37] font-semibold animate-pulse">
                Loading...
              </div>
            </div>
          ) : selectedTable ? (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#d4af37]">
                  {tables.find(t => t.name === selectedTable)?.label}
                </h2>
                <div className="text-gray-300">
                  Total Records: <span className="font-bold text-[#d4af37]">{tableData.length}</span>
                </div>
              </div>

              {tableData.length > 0 ? (
                <div className="flex-1 overflow-auto border border-[#8a5b1a] rounded-lg">
                  <table className="w-full">
                    {renderTableHeaders()}
                    {renderTableRows()}
                  </table>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-xl">
                  No data found in this table
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xl">
              Select a table from the sidebar to view data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
