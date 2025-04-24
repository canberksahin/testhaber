"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { extractNewsContent } from "@/actions/extract-news"
import { Loader2, ExternalLink, Eye, Printer } from "lucide-react"
import type { NewsContent } from "@/types/news"
import { NewsDisplay } from "@/components/news-display"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function NewsExtractor() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [newsContent, setNewsContent] = useState<NewsContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<string | null>(null)
  const [showDetailedError, setShowDetailedError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url) {
      setError("Lütfen bir URL girin")
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch (e) {
      setError("Geçerli bir URL girin (örn: https://www.example.com)")
      return
    }

    setIsLoading(true)
    setError(null)
    setDetailedError(null)
    setShowDetailedError(false)
    setProgress(10)
    setNewsContent(null)

    let progressInterval: NodeJS.Timeout // Declare progressInterval here

    try {
      // Simulate progress steps
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 500)

      toast({
        title: "Haber içeriği çıkarılıyor",
        description: "Lütfen bekleyin...",
      })

      console.log("Extracting news content from URL:", url)
      const result = await extractNewsContent(url)
      clearInterval(progressInterval)
      setProgress(100)

      console.log("News content extracted successfully:", result)

      // Small delay to show 100% completion before displaying results
      setTimeout(() => {
        // If the content is translated, store it in localStorage but don't redirect
        if (result.isTranslated) {
          localStorage.setItem("translatedNewsData", JSON.stringify(result))

          // Create a simplified version without translation for the main page
          const originalOnlyContent = {
            ...result,
            isTranslated: false, // Mark as not translated for display purposes
            translatedTitle: undefined,
            translatedContent: undefined,
          }

          setNewsContent(originalOnlyContent)
          // Also store the original content
          localStorage.setItem("newsData", JSON.stringify(originalOnlyContent))

          setIsLoading(false)

          toast({
            title: "Haber içeriği başarıyla çıkarıldı",
            description: "Çeviri hazır. 'Türkçe Çevirisini Görüntüle' butonuna tıklayarak çeviriye erişebilirsiniz.",
            variant: "success",
          })
        } else {
          // If not translated, just show the content
          setNewsContent(result)
          // Store the content
          localStorage.setItem("newsData", JSON.stringify(result))

          setIsLoading(false)
          toast({
            title: "Haber içeriği başarıyla çıkarıldı",
            variant: "success",
          })
        }
      }, 500)
    } catch (err) {
      clearInterval(progressInterval)

      console.error("Error extracting news content:", err)

      // Extract the error message
      const errorMessage = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu"

      // Store the full error details for debugging
      const fullErrorDetails = err instanceof Error ? `${err.message}\n${err.stack || ""}` : JSON.stringify(err)

      // Set a simplified error message for display
      setError(`Haber içeriği çıkarılırken bir hata oluştu: ${errorMessage.split("\n")[0]}`)

      // Store the detailed error for debugging
      setDetailedError(fullErrorDetails)

      setIsLoading(false)
      setProgress(0)

      toast({
        title: "Hata",
        description: `Haber içeriği çıkarılırken bir hata oluştu. Detaylar için hata mesajına tıklayın.`,
        variant: "destructive",
      })
    }
  }

  const handlePreviewOriginal = () => {
    if (newsContent) {
      window.open("/preview?type=original", "_blank")
    }
  }

  const handlePrintOriginal = () => {
    if (newsContent) {
      window.open("/preview?type=original&print=true", "_blank")
    }
  }

  const toggleDetailedError = () => {
    setShowDetailedError(!showDetailedError)
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">
                Haber URL'si
              </label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.example.com/haber"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analiz Et"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Örnek: https://www.bbc.com/news/world-europe-68862155</p>
            </div>
          </form>

          {isLoading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>İçerik çıkarılıyor...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Hata
            {detailedError && (
              <Button variant="ghost" size="sm" onClick={toggleDetailedError} className="h-6 px-2 text-xs">
                {showDetailedError ? "Detayları Gizle" : "Detayları Göster"}
              </Button>
            )}
          </AlertTitle>
          <AlertDescription>
            <div>{error}</div>

            {showDetailedError && detailedError && (
              <div className="mt-4 p-3 bg-red-950 text-white rounded-md overflow-auto max-h-60 text-xs font-mono">
                <pre>{detailedError}</pre>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {newsContent && (
        <>
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="outline" onClick={handlePreviewOriginal} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Önizle
            </Button>
            <Button variant="outline" onClick={handlePrintOriginal} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Yazdır
            </Button>
          </div>

          <NewsDisplay content={newsContent} />

          {/* Show translation link if content is translated */}
          {newsContent.language !== "Türkçe" && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => router.push("/translation")} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Türkçe Çevirisini Görüntüle
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
