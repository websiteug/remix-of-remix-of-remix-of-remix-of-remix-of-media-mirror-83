import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Play, Shield } from "lucide-react";
import type { Movie, Series, ContentItem } from "@/lib/firebase-db";
import { isMovieInAgentMode } from "@/lib/firebase-db";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { AuthModal } from "@/components/auth/AuthModal";
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";
import { useActivityTracker } from "@/hooks/useActivityTracker";

interface MovieCardProps {
  movie: Movie | Series | ContentItem;
  contentType?: 'movie' | 'series';
}

// Extract episodeInfo if present
function getEpisodeInfo(movie: any): { seasonNumber: number; episodeNumber: number; episodeTitle: string; episodeThumbnailUrl?: string; seasonLabel?: string } | null {
  return movie.episodeInfo || null;
}

export function MovieCard({ movie, contentType }: MovieCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, hasAgentPlan } = useSubscription();
  const { track } = useActivityTracker();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);

  // Determine if it's a series
  const type = contentType || ('type' in movie ? movie.type : ('seasons' in movie ? 'series' : 'movie'));
  const isSeries = type === 'series';
  const seasons = isSeries && 'seasons' in movie ? movie.seasons : undefined;
  const episodeInfo = getEpisodeInfo(movie);
  
  // Check if movie is in agent mode
  const isAgent = !isSeries && 'isAgent' in movie && isMovieInAgentMode(movie as Movie);
  
  // Check if series has agent episodes (shows NEW badge)
  const hasAgentEpisode = isSeries && 'hasAgentEpisode' in movie && (movie as Series).hasAgentEpisode;
  
  // Get VJ name
  const vjName = 'vjName' in movie ? (movie as any).vjName : undefined;
  
  // Get the correct URL based on content type, include episode info if available
  const watchUrl = isSeries 
    ? episodeInfo 
      ? `/watch/series/${movie.id}?season=${episodeInfo.seasonNumber}&episode=${episodeInfo.episodeNumber}`
      : `/watch/series/${movie.id}` 
    : `/watch/${movie.id}`;
  
  // Get poster URL - use episode thumbnail if available
  const posterUrl = episodeInfo?.episodeThumbnailUrl 
    ? episodeInfo.episodeThumbnailUrl 
    : ('posterUrl' in movie ? movie.posterUrl : ('poster' in movie ? (movie as any).poster : ''));
  
  // Get genre
  const genreDisplay = typeof movie.genre === 'string' ? movie.genre : (Array.isArray(movie.genre) ? movie.genre[0] : '');
  
  // Get year
  const year = 'releaseYear' in movie ? movie.releaseYear : ('year' in movie ? (movie as any).year : '');

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    track("Click", `Clicked on "${movie.title}" (${type})`);
    
    // For series, allow access to series page
    if (isSeries) {
      navigate(watchUrl);
      return;
    }
    
    // For movies, check auth and subscription
    if (!user) {
      track("View", `Auth modal shown for "${movie.title}"`);
      setShowAuthModal(true);
      return;
    }
    
    // Agent movies require agent plan
    if (isAgent && !hasAgentPlan) {
      track("View", `Agent subscription modal shown for "${movie.title}"`);
      setShowAgentModal(true);
      return;
    }
    
    if (!isAgent && !hasActiveSubscription && !hasAgentPlan) {
      track("View", `Subscription modal shown for "${movie.title}"`);
      setShowSubscriptionModal(true);
      return;
    }
    
    track("Play", `Started watching "${movie.title}"`);
    navigate(watchUrl);
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="group block rounded-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* LUO Badge */}
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full z-10">
            LUO
          </div>
          
          {/* Agent Badge */}
          {isAgent && (
             <div className="absolute top-2 right-2 bg-orange-500 text-white text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
              <Shield className="w-2.5 h-2.5 md:w-3 md:h-3" />
              AGENT
            </div>
          )}
          
          {/* NEW Badge for series with agent episodes */}
          {hasAgentEpisode && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full z-10 animate-pulse">
              NEW
            </div>
          )}
          
          {/* Play Button on Hover */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-150"
              style={{ background: "linear-gradient(135deg, #1cb7ff 1.22%, #2ff58b 50.24%)" }}
            >
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
            <span className="text-white text-[10px] md:text-xs font-medium mt-2 drop-shadow-lg">Play Now</span>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-[10px] md:text-xs font-medium">{movie.rating}</span>
            </div>
          </div>
          {/* Episode Badge (S2 E3) */}
          {episodeInfo && (
            <div className="absolute bottom-2 left-2 flex gap-1 z-10">
              <span className="bg-primary text-primary-foreground text-[8px] md:text-[10px] font-bold px-1 md:px-1.5 py-0.5 rounded">
                {episodeInfo.seasonLabel || `S${episodeInfo.seasonNumber}`}
              </span>
              <span className="bg-accent text-accent-foreground text-[8px] md:text-[10px] font-bold px-1 md:px-1.5 py-0.5 rounded">
                E{episodeInfo.episodeNumber}
              </span>
            </div>
          )}
          {/* VJ Badge */}
          {vjName && (
            <div className={`absolute ${(isAgent || hasAgentEpisode) ? 'top-9' : 'top-2'} right-2 bg-purple-600 text-white text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full z-10`}>
              {vjName}
            </div>
          )}
        </div>
        <div className="mt-2">
          <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {episodeInfo ? episodeInfo.episodeTitle : movie.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {episodeInfo ? `${movie.title} • ${episodeInfo.seasonLabel || `S${episodeInfo.seasonNumber}`}E${episodeInfo.episodeNumber}` : `${year} • Trending`}
          </p>
        </div>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} defaultMode="login" />
      <SubscriptionModal open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal} />
      {/* Agent subscription modal */}
      <SubscriptionModal open={showAgentModal} onOpenChange={setShowAgentModal} agentOnly />
    </>
  );
}
