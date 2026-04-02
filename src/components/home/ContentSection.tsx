import { MovieGrid } from "@/components/movies/MovieGrid";
import { getContentByCategory, type ContentItem } from "@/lib/firebase-db";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentSectionProps {
  title: string;
  category?: string;
}

export function ContentSection({ title, category = "trending" }: ContentSectionProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        // Fetch all content without limit to show everything on homepage
        const fetchedContent = await getContentByCategory(category);
        setContent(fetchedContent);
      } catch (error) {
        console.error(`Error fetching ${category} content:`, error);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [category]);

  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl lg:text-2xl font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-7 gap-2 lg:gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (content.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-bold">{title}</h2>
      </div>
      <MovieGrid items={content} />
    </section>
  );
}
