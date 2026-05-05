import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Download, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateAndUseDownloadLink, getGoogleDriveDownloadUrl } from "@/lib/download-service";

export default function DownloadPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const filename = searchParams.get("filename") || "video.mp4";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "downloading">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [downloadFilename, setDownloadFilename] = useState<string>(filename);

  useEffect(() => {
    async function processDownload() {
      if (!token) {
        setStatus("error");
        setErrorMessage("Invalid download link. No token provided.");
        return;
      }

      try {
        const result = await validateAndUseDownloadLink(token);

        if (!result.valid) {
          setStatus("error");
          setErrorMessage(result.error || "Invalid download link.");
          return;
        }

        // Mark as downloading
        setStatus("downloading");
        const finalFilename = result.filename || filename;
        setDownloadFilename(finalFilename);

        // Get the actual Google Drive download URL and redirect
        const downloadUrl = getGoogleDriveDownloadUrl(result.fileId!);
        
        // Use window.location to trigger native browser download
        // This bypasses CORS and allows Google Drive to handle the download
        window.location.href = downloadUrl;

        // Show success after a short delay
        setTimeout(() => {
          setStatus("success");
        }, 1500);
      } catch (error) {
        console.error("Download error:", error);
        setStatus("error");
        setErrorMessage("An error occurred while processing your download.");
      }
    }

    processDownload();
  }, [token, filename]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin mb-4" />
            <h1 className="text-xl font-bold mb-2">Validating Download Link</h1>
            <p className="text-muted-foreground">Please wait while we verify your download...</p>
          </>
        )}

        {status === "downloading" && (
          <>
            <Download className="w-16 h-16 text-primary mx-auto animate-pulse mb-4" />
            <h1 className="text-xl font-bold mb-2">Downloading...</h1>
            <p className="text-muted-foreground mb-4">
              Your download is starting. If it doesn't begin automatically, please wait...
            </p>
            <p className="text-sm text-muted-foreground">
              File: <span className="font-medium text-foreground">{downloadFilename}</span>
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Download Started!</h1>
            <p className="text-muted-foreground mb-4">
              Your file <span className="font-medium text-foreground">{filename}</span> is downloading.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              This was a one-time download link and has been used.
            </p>
            <Link to="/">
              <Button className="gradient-primary">
                Back to Home
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Download Failed</h1>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            
            {errorMessage.includes("already been used") && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-foreground">
                  Want unlimited downloads? Subscribe to{" "}
                  <a 
                    href="https://www.luoancientmovies.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline"
                  >
                    www.luoancientmovies.com
                  </a>
                </p>
              </div>
            )}
            
            <Link to="/">
              <Button className="gradient-primary">
                Back to Home
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
