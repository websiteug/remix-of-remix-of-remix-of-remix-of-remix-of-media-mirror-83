import { useEffect, useState } from "react";
import { getMovies, getSeries, isMovieInAgentMode, type Movie, type Episode } from "@/lib/firebase-db";
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { Shield, X, ChevronRight } from "lucide-react";

const LAST_SEEN_KEY = "luo_agent_last_seen_ts";

export function AgentMovieNotification() {
  const [newMovies, setNewMovies] = useState<Movie[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function checkAgentMovies() {
      try {
        const [movies, seriesList] = await Promise.all([getMovies(), getSeries()]);
        const agentMovies = movies.filter((m) => isMovieInAgentMode(m));

        // Check agent episodes with valid parent series (matching AgentPage logic)
        const episodesRef = ref(database, "episodes");
        const snap = await get(episodesRef);
        const seriesIds = new Set(seriesList.map(s => s.id));
        let agentEpisodeCount = 0;
        if (snap.exists()) {
          snap.forEach((child) => {
            const ep = child.val();
            if (ep.isAgent && seriesIds.has(ep.seriesId)) {
              agentEpisodeCount++;
            }
          });
        }

        const totalAgent = agentMovies.length + agentEpisodeCount;

        if (totalAgent > 0) {
          setNewMovies(agentMovies);
          setVisible(true);
          setTimeout(() => setVisible(false), 15 * 1000);
        }
      } catch (e) {
        console.error("Agent notification check failed:", e);
      }
    }

    const timer = setTimeout(checkAgentMovies, 6500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const handleGoToAgent = () => {
    setVisible(false);
    window.location.href = "/agent";
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] animate-in slide-in-from-top-4 fade-in duration-500 w-[90vw] max-w-md">
      <div className="relative bg-background border-2 border-orange-500/60 rounded-xl shadow-lg shadow-orange-500/10 p-4">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">🔥 New Agent Movies Available!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              New movies have been added to the Agent page. Subscribe to the Agent Plan to access ALL movies including Agent movies for 5 days!
            </p>
            <button
              onClick={handleGoToAgent}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-400 transition-colors"
            >
              Go to Agent Page <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
