import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EnhanceImageButtonProps {
  imageUrl: string;
  onEnhanced: (newUrl: string) => void;
}

export function EnhanceImageButton({ imageUrl, onEnhanced }: EnhanceImageButtonProps) {
  const [enhancing, setEnhancing] = useState(false);
  const { toast } = useToast();

  const handleEnhance = async () => {
    if (!imageUrl) {
      toast({ title: "Please enter an image URL first", variant: "destructive" });
      return;
    }

    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-image", {
        body: { imageUrl },
      });

      if (error) throw error;

      if (data?.enhancedUrl) {
        onEnhanced(data.enhancedUrl);
        toast({ title: "Image enhanced successfully! ✨" });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Enhancement error:", error);
      toast({
        title: "Enhancement failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleEnhance}
      disabled={enhancing || !imageUrl}
      className="gap-1.5 text-xs"
    >
      {enhancing ? (
        <><Loader2 className="w-3.5 h-3.5 animate-spin" />Enhancing...</>
      ) : (
        <><Sparkles className="w-3.5 h-3.5" />AI Enhance</>
      )}
    </Button>
  );
}
