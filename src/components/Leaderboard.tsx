import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface LeaderboardEntry {
  _id: string;
  displayName: string;
  highScore: number;
  totalLogsSliced: number;
  gamesPlayed: number;
}

export function Leaderboard() {
  const leaderboard = useQuery(api.scores.getLeaderboard);
  const myStats = useQuery(api.scores.getMyStats);

  if (leaderboard === undefined) {
    return (
      <div className="bg-amber-900/30 rounded-xl p-4 md:p-6 border-2 border-amber-700/50">
        <div className="text-amber-400 text-center animate-pulse">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-amber-900/40 to-amber-950/60 rounded-xl p-4 md:p-6 border-2 border-amber-700/50 shadow-xl">
      <h2 className="text-amber-300 font-black text-xl md:text-2xl text-center mb-4 tracking-wider flex items-center justify-center gap-2">
        <span className="text-2xl md:text-3xl">🏆</span> TOP LUMBERJACKS <span className="text-2xl md:text-3xl">🏆</span>
      </h2>

      {leaderboard.length === 0 ? (
        <div className="text-amber-500/70 text-center py-6">
          No scores yet. Be the first lumberjack!
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry: LeaderboardEntry, index: number) => (
            <div
              key={entry._id}
              className={`flex items-center gap-3 p-2 md:p-3 rounded-lg transition-all ${
                index === 0
                  ? "bg-gradient-to-r from-yellow-600/40 to-yellow-700/20 border border-yellow-500/50"
                  : index === 1
                  ? "bg-gradient-to-r from-gray-400/30 to-gray-500/10 border border-gray-400/30"
                  : index === 2
                  ? "bg-gradient-to-r from-orange-700/30 to-orange-800/10 border border-orange-600/30"
                  : "bg-amber-800/20 border border-amber-700/20"
              }`}
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full font-black text-base md:text-lg ${
                index === 0
                  ? "bg-yellow-500 text-yellow-900"
                  : index === 1
                  ? "bg-gray-300 text-gray-700"
                  : index === 2
                  ? "bg-orange-600 text-orange-100"
                  : "bg-amber-800 text-amber-200"
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-amber-100 font-bold text-sm md:text-base truncate">
                  {entry.displayName}
                </div>
                <div className="text-amber-400/70 text-xs">
                  {entry.gamesPlayed} games · {entry.totalLogsSliced} logs
                </div>
              </div>
              <div className="text-amber-200 font-black text-lg md:text-xl">
                {entry.highScore}
              </div>
            </div>
          ))}
        </div>
      )}

      {myStats && (
        <div className="mt-4 pt-4 border-t border-amber-700/30">
          <div className="text-amber-400 text-sm text-center mb-2">Your Stats</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-amber-800/30 rounded-lg p-2">
              <div className="text-amber-200 font-bold text-base md:text-lg">{myStats.highScore}</div>
              <div className="text-amber-500/70 text-xs">Best</div>
            </div>
            <div className="bg-amber-800/30 rounded-lg p-2">
              <div className="text-amber-200 font-bold text-base md:text-lg">{myStats.totalLogsSliced}</div>
              <div className="text-amber-500/70 text-xs">Total Logs</div>
            </div>
            <div className="bg-amber-800/30 rounded-lg p-2">
              <div className="text-amber-200 font-bold text-base md:text-lg">{myStats.gamesPlayed}</div>
              <div className="text-amber-500/70 text-xs">Games</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
