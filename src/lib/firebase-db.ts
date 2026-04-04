import { database, db } from "./firebase";
import { ref, push, set, get, update, remove, query, orderByChild, limitToLast } from "firebase/database";
import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";

// Movie types
export interface Movie {
  id?: string;
  title: string;
  description: string;
  posterUrl: string;
  videoUrl: string;
  trailerUrl?: string;
  rating: number;
  duration: number;
  genre: string;
  releaseYear: number;
  displayCategories: string[];
  isFeatured: boolean;
  isAgent?: boolean;
  agentMarkedAt?: number;
  vjName?: string;
  createdAt: number;
  views?: number;
}

export interface Series {
  id?: string;
  title: string;
  description: string;
  posterUrl: string;
  trailerUrl?: string;
  rating: number;
  genre: string;
  releaseYear: number;
  seasons: number;
  displayCategories: string[];
  isFeatured: boolean;
  vjName?: string;
  createdAt: number;
  views?: number;
  hasAgentEpisode?: boolean;
  seasonLabel?: string;
}

export interface Episode {
  id?: string;
  seriesId: string;
  seasonNumber: number;
  seasonLabel?: string;
  episodeNumber: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  isAgent?: boolean;
  isTrending?: boolean;
  createdAt: number;
}

export interface Advert {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  createdAt: number;
}

export interface HeroImage {
  id?: string;
  title: string;
  description: string;
  subtitle?: string;
  badgeText?: string;
  imageUrl: string;
  linkUrl?: string;
  createdAt: number;
}

export interface App {
  id?: string;
  name: string;
  description: string;
  iconUrl: string;
  downloadUrl: string;
  category: string;
  version: string;
  size: string;
  rating: number;
  downloads: number;
  platform: string;
  isActive?: boolean;
  createdAt: number;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  avatar?: string;
  subscription?: {
    plan: string;
    expiresAt: Date;
    isActive: boolean;
  };
  createdAt?: Date;
  lastActive?: Date;
  watchTime?: number;
}

// Combined content type for mixed content lists
export type ContentItem = (Movie | Series) & { 
  type: 'movie' | 'series';
  episodeInfo?: { seasonNumber: number; episodeNumber: number; episodeTitle: string; episodeId: string; episodeThumbnailUrl?: string; seasonLabel?: string };
};

// Check if a movie is currently in agent mode (within 2 days of being marked)
const AGENT_DURATION_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
export function isMovieInAgentMode(movie: Movie): boolean {
  if (!movie.isAgent || !movie.agentMarkedAt) return false;
  return Date.now() - movie.agentMarkedAt < AGENT_DURATION_MS;
}

// Movies
export async function getMovies(limit?: number): Promise<Movie[]> {
  const moviesRef = ref(database, "movies");
  const moviesQuery = limit ? query(moviesRef, orderByChild("createdAt"), limitToLast(limit)) : moviesRef;
  const snapshot = await get(moviesQuery);
  if (snapshot.exists()) {
    const movies: Movie[] = [];
    snapshot.forEach((child) => {
      movies.push({ id: child.key, ...child.val() } as Movie);
    });
    return movies.reverse();
  }
  return [];
}

export async function getMovie(id: string): Promise<Movie | null> {
  const movieRef = ref(database, `movies/${id}`);
  const snapshot = await get(movieRef);
  if (snapshot.exists()) {
    return { id: snapshot.key, ...snapshot.val() } as Movie;
  }
  return null;
}

export async function getMoviesByCategory(category: string, limit?: number): Promise<Movie[]> {
  const movies = await getMovies();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Filter out agent movies from homepage categories
  const filtered = movies.filter((movie) => {
    // Exclude agent movies from all homepage categories
    if (isMovieInAgentMode(movie)) return false;
    
    if (category === "recently-added") {
      return movie.createdAt > oneWeekAgo;
    }
    return movie.displayCategories?.includes(category);
  });

  return limit ? filtered.slice(0, limit) : filtered;
}

export async function getRelatedMovies(movieId: string, genre: string, limit = 6): Promise<Movie[]> {
  const movies = await getMovies();
  const related = movies.filter((movie) => movie.id !== movieId && movie.genre.toLowerCase() === genre.toLowerCase());
  related.sort((a, b) => b.rating - a.rating);
  return related.slice(0, limit);
}

// Series
export async function getSeries(limit?: number): Promise<Series[]> {
  const seriesRef = ref(database, "series");
  const seriesQuery = limit ? query(seriesRef, orderByChild("createdAt"), limitToLast(limit)) : seriesRef;
  const [seriesSnapshot, episodesSnapshot] = await Promise.all([
    get(seriesQuery),
    get(ref(database, "episodes")),
  ]);

  // Build a set of series IDs that have at least one agent episode
  const agentSeriesIds = new Set<string>();
  if (episodesSnapshot.exists()) {
    episodesSnapshot.forEach((child) => {
      const ep = child.val();
      if (ep.isAgent && ep.seriesId) {
        agentSeriesIds.add(ep.seriesId);
      }
    });
  }

  if (seriesSnapshot.exists()) {
    const series: Series[] = [];
    seriesSnapshot.forEach((child) => {
      const s = { id: child.key, ...child.val() } as Series;
      s.hasAgentEpisode = agentSeriesIds.has(child.key!);
      series.push(s);
    });
    return series.reverse();
  }
  return [];
}

export async function getSeriesById(id: string): Promise<Series | null> {
  const seriesRef = ref(database, `series/${id}`);
  const snapshot = await get(seriesRef);
  if (snapshot.exists()) {
    return { id: snapshot.key, ...snapshot.val() } as Series;
  }
  return null;
}

export async function getSeriesByCategory(category: string, limit?: number): Promise<Series[]> {
  const series = await getSeries();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Filter out series with agent episodes from all non-agent categories
  const filtered = series.filter((item) => {
    if (item.hasAgentEpisode) return false;
    
    if (category === "recently-added") {
      return item.createdAt > oneWeekAgo;
    }
    return item.displayCategories?.includes(category);
  });

  return limit ? filtered.slice(0, limit) : filtered;
}

export async function getRelatedSeries(seriesId: string, genre: string, limit = 6): Promise<Series[]> {
  const series = await getSeries();
  const related = series.filter((item) => item.id !== seriesId && item.genre.toLowerCase() === genre.toLowerCase());
  related.sort((a, b) => b.rating - a.rating);
  return related.slice(0, limit);
}

// Episodes
export async function getEpisodesBySeriesId(seriesId: string): Promise<Episode[]> {
  const episodesRef = ref(database, "episodes");
  const snapshot = await get(episodesRef);
  if (snapshot.exists()) {
    const episodes: Episode[] = [];
    snapshot.forEach((child) => {
      const episode = { id: child.key, ...child.val() } as Episode;
      if (episode.seriesId === seriesId) {
        episodes.push(episode);
      }
    });
    return episodes.sort((a, b) => {
      if (a.seasonNumber !== b.seasonNumber) {
        return a.seasonNumber - b.seasonNumber;
      }
      return a.episodeNumber - b.episodeNumber;
    });
  }
  return [];
}

export async function getEpisodeById(episodeId: string): Promise<Episode | null> {
  const episodeRef = ref(database, `episodes/${episodeId}`);
  const snapshot = await get(episodeRef);
  if (snapshot.exists()) {
    return { id: snapshot.key, ...snapshot.val() } as Episode;
  }
  return null;
}

// Adverts
export async function getAdverts(limit?: number): Promise<Advert[]> {
  const advertsRef = ref(database, "adverts");
  const advertsQuery = limit ? query(advertsRef, orderByChild("createdAt"), limitToLast(limit)) : advertsRef;
  const snapshot = await get(advertsQuery);
  if (snapshot.exists()) {
    const adverts: Advert[] = [];
    snapshot.forEach((child) => {
      adverts.push({ id: child.key, ...child.val() } as Advert);
    });
    return adverts.reverse();
  }
  return [];
}

// Hero Images
export async function getHeroImages(limit?: number): Promise<HeroImage[]> {
  const heroImagesRef = ref(database, "heroImages");
  const heroImagesQuery = limit ? query(heroImagesRef, orderByChild("createdAt"), limitToLast(limit)) : heroImagesRef;
  const snapshot = await get(heroImagesQuery);
  if (snapshot.exists()) {
    const heroImages: HeroImage[] = [];
    snapshot.forEach((child) => {
      heroImages.push({ id: child.key, ...child.val() } as HeroImage);
    });
    return heroImages.reverse();
  }
  return [];
}

// Apps
export async function getApps(limit?: number): Promise<App[]> {
  const appsRef = ref(database, "apps");
  const appsQuery = limit ? query(appsRef, orderByChild("createdAt"), limitToLast(limit)) : appsRef;
  const snapshot = await get(appsQuery);
  if (snapshot.exists()) {
    const apps: App[] = [];
    snapshot.forEach((child) => {
      apps.push({ id: child.key, ...child.val() } as App);
    });
    return apps.reverse();
  }
  return [];
}

// Featured content
export async function getFeaturedContent(limit?: number): Promise<ContentItem[]> {
  const [movies, series] = await Promise.all([getMovies(), getSeries()]);
  
  const featuredMovies = movies.filter((movie) => movie.isFeatured).map(m => ({ ...m, type: 'movie' as const }));
  const featuredSeries = series.filter((item) => item.isFeatured).map(s => ({ ...s, type: 'series' as const }));
  
  const allFeatured = [...featuredMovies, ...featuredSeries].sort((a, b) => b.createdAt - a.createdAt);
  
  return limit ? allFeatured.slice(0, limit) : allFeatured;
}

// Recently added content
export async function getRecentlyAdded(limit?: number): Promise<ContentItem[]> {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const [movies, series] = await Promise.all([getMovies(), getSeries()]);
  
  const recentMovies = movies.filter((m) => m.createdAt >= oneWeekAgo).map(m => ({ ...m, type: 'movie' as const }));
  const recentSeries = series.filter((s) => s.createdAt >= oneWeekAgo).map(s => ({ ...s, type: 'series' as const }));
  
  const recentContent = [...recentMovies, ...recentSeries];
  recentContent.sort((a, b) => b.createdAt - a.createdAt);
  
  return limit ? recentContent.slice(0, limit) : recentContent;
}

// Popular content (by views and rating)
export async function getPopularContent(limit = 20): Promise<ContentItem[]> {
  const [movies, series] = await Promise.all([getMovies(), getSeries()]);
  
  const allContent: ContentItem[] = [
    ...movies.map(m => ({ ...m, type: 'movie' as const })),
    ...series.map(s => ({ ...s, type: 'series' as const }))
  ];
  
  allContent.sort((a, b) => {
    const viewsA = a.views || 0;
    const viewsB = b.views || 0;
    if (viewsB !== viewsA) {
      return viewsB - viewsA;
    }
    return b.rating - a.rating;
  });
  
  return limit ? allContent.slice(0, limit) : allContent;
}

// Get content by category (mixed movies and series)
export async function getContentByCategory(category: string, limit?: number): Promise<ContentItem[]> {
  const [movies, seriesList] = await Promise.all([
    getMoviesByCategory(category, limit),
    getSeriesByCategory(category, limit)
  ]);
  
  let content: ContentItem[] = [
    ...movies.map(m => ({ ...m, type: 'movie' as const })),
    ...seriesList.map(s => ({ ...s, type: 'series' as const }))
  ];
  
  // For all categories, include individual episodes as separate cards with S/E badges
  const allEpisodes = await getAllEpisodesFromDb();
  const allSeriesData = await getSeries();
  const seriesMap = new Map(allSeriesData.map(s => [s.id!, s]));
  
  // Filter episodes relevant to this category
  const relevantEpisodes = allEpisodes.filter(ep => {
    if (ep.isAgent) return false; // exclude agent episodes from normal categories
    if (category === "trending") return ep.isTrending;
    if (category === "recently-added") {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return ep.createdAt > oneWeekAgo;
    }
    return false;
  });
  
  // Add each episode as a card using its parent series poster
  for (const ep of relevantEpisodes) {
    const parentSeries = seriesMap.get(ep.seriesId);
    if (!parentSeries) continue;
    
    // Create a content item based on the parent series but with episode info
    const episodeCard: ContentItem = {
      ...parentSeries,
      type: 'series' as const,
      createdAt: ep.createdAt, // use episode creation time for sorting
      episodeInfo: {
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        episodeTitle: ep.title,
        episodeId: ep.id!,
        episodeThumbnailUrl: ep.thumbnailUrl,
        seasonLabel: ep.seasonLabel,
      },
    };
    content.push(episodeCard);
  }
  
  // Remove duplicate series entries that are already represented by episodes
  if (relevantEpisodes.length > 0) {
    const seriesWithEpisodes = new Set(relevantEpisodes.map(ep => ep.seriesId));
    content = content.filter(c => {
      // Keep if it's not a series, or if it has episodeInfo, or if it doesn't have episode cards
      if (c.type !== 'series') return true;
      if (c.episodeInfo) return true;
      return !seriesWithEpisodes.has(c.id!);
    });
  }
  
  // Sort: newest first
  content.sort((a, b) => b.createdAt - a.createdAt);
  
  return limit ? content.slice(0, limit) : content;
}

// Helper to get all episodes from database
async function getAllEpisodesFromDb(): Promise<Episode[]> {
  const episodesRef = ref(database, "episodes");
  const snapshot = await get(episodesRef);
  if (snapshot.exists()) {
    const episodes: Episode[] = [];
    snapshot.forEach((child) => {
      episodes.push({ id: child.key, ...child.val() } as Episode);
    });
    return episodes;
  }
  return [];
}

// Trending content (high rating + recent)
export async function getTrendingContent(limit = 20): Promise<ContentItem[]> {
  const [movies, series] = await Promise.all([getMovies(), getSeries()]);
  
  const allContent: ContentItem[] = [
    ...movies.map(m => ({ ...m, type: 'movie' as const })),
    ...series.map(s => ({ ...s, type: 'series' as const }))
  ];
  
  // Sort by rating first, then by recency
  allContent.sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return b.createdAt - a.createdAt;
  });
  
  return limit ? allContent.slice(0, limit) : allContent;
}

// Increment view count
export async function incrementContentViews(contentId: string, contentType: "movie" | "series"): Promise<void> {
  try {
    const contentRef = ref(database, `${contentType === "movie" ? "movies" : "series"}/${contentId}`);
    const snapshot = await get(contentRef);
    if (snapshot.exists()) {
      const currentViews = snapshot.val().views || 0;
      await update(contentRef, { views: currentViews + 1 });
    }
  } catch (error) {
    console.error("Error incrementing views:", error);
  }
}

// Search content
export async function searchContent(searchQuery: string) {
  try {
    const queryLower = searchQuery.toLowerCase().trim();
    if (!queryLower) return { movies: [], series: [], adverts: [] };

    const [movies, series, adverts] = await Promise.all([getMovies(), getSeries(), getAdverts()]);

    const matchedMovies = movies.filter(
      (movie) =>
        movie.title.toLowerCase().includes(queryLower) ||
        movie.description.toLowerCase().includes(queryLower) ||
        movie.genre.toLowerCase().includes(queryLower)
    );

    const matchedSeries = series.filter(
      (item) =>
        item.title.toLowerCase().includes(queryLower) ||
        item.description.toLowerCase().includes(queryLower) ||
        item.genre.toLowerCase().includes(queryLower)
    );

    const matchedAdverts = adverts.filter(
      (advert) => 
        advert.title.toLowerCase().includes(queryLower) || 
        advert.description.toLowerCase().includes(queryLower)
    );

    return {
      movies: matchedMovies,
      series: matchedSeries,
      adverts: matchedAdverts,
    };
  } catch (error) {
    console.error("Error searching content:", error);
    return { movies: [], series: [], adverts: [] };
  }
}
