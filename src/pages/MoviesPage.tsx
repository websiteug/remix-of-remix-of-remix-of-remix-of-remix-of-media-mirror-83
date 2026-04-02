import { MainLayout } from "@/components/layout/MainLayout";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { getMovies, type Movie, isMovieInAgentMode } from "@/lib/firebase-db";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const fetchedMovies = await getMovies();
        setMovies(fetchedMovies.filter(m => !isMovieInAgentMode(m)));
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  return (
    <MainLayout>
      <div className="px-4 lg:px-6 py-6 pb-24 lg:pb-8">
        <h1 className="text-2xl font-bold mb-6">Movies</h1>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : movies.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No movies available yet. Check back soon!</p>
        ) : (
          <MovieGrid items={movies} contentType="movie" />
        )}
      </div>
    </MainLayout>
  );
}
