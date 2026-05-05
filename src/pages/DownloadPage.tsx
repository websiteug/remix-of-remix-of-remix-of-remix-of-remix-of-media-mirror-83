import { useEffect } from "react";

export default function DownloadPage() {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = "https://www.luoancientmovies.com";
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-center">
      <div>
        <h1 className="text-2xl font-bold mb-2">Download link expired</h1>
        <p className="text-muted-foreground mb-2">This one-time link has already been used or has expired.</p>
        <p className="text-sm text-muted-foreground">
          Redirecting to{" "}
          <a className="text-primary underline" href="https://www.luoancientmovies.com">
            www.luoancientmovies.com
          </a>
          …
        </p>
      </div>
    </div>
  );
}
