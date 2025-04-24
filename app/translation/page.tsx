"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DownloadIcon, LanguagesIcon, Eye, Printer } from "lucide-react"
import { TranslationDisplay } from "@/components/translation-display"
import type { NewsContent } from "@/types/news"
import { toast } from "@/hooks/use-toast"
import { generateTranslationPDF } from "@/lib/pdf-generator"

export default function TranslationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [newsData, setNewsData] = useState<NewsContent | null>(null)

  useEffect(() => {
    // Get the news data from localStorage
    const storedData = localStorage.getItem("translatedNewsData")
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        setNewsData(parsedData)
      } catch (error) {
        console.error("Error parsing stored news data:", error)
        toast({
          title: "Hata",
          description: "Çeviri verileri yüklenemedi.",
          variant: "destructive",
        })
        router.push("/")
      }
    } else {
      // If no data, redirect back to home
      toast({
        title: "Hata",
        description: "Çeviri verileri bulunamadı.",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [router])

  const handleGoBack = () => {
    router.push("/")
  }

  const handleDownloadPDF = async () => {
    if (newsData) {
      try {
        await generateTranslationPDF(newsData)
      } catch (error) {
        console.error("Error generating PDF:", error)
        toast({
          title: "Hata",
          description: "PDF oluşturulurken bir hata oluştu.",
          variant: "destructive",
        })
      }
    }
  }

  const handlePreviewTranslation = () => {
    window.open("/preview?type=translation", "_blank")
  }

  const handlePrintTranslation = () => {
    window.open("/preview?type=translation&print=true", "_blank")
  }

  if (!newsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Çeviri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="h-16 w-16 relative mr-3">
                <Image src="/logo.png" alt="T.C. İletişim Başkanlığı Logo" width={64} height={64} />
              </div>
              <h1 className="text-xl font-bold text-blue-600">T.C. İletişim Başkanlığı</h1>
            </div>
          </div>
        </div>
      </header>
      <div className="w-full h-1 bg-blue-600"></div>

      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Orijinal Habere Dön
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePreviewTranslation} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Önizle
              </Button>
              <Button variant="outline" onClick={handlePrintTranslation} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Yazdır
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                <DownloadIcon className="h-4 w-4" />
                PDF İndir
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-700">
            <h2 className="text-lg font-medium flex items-center">
              <LanguagesIcon className="h-5 w-5 mr-2" />
              Türkçe Çeviri Sayfası
            </h2>
            <p className="text-sm mt-1">
              Bu sayfa, orijinal haberin Türkçe çevirisini göstermektedir. Orijinal dildeki habere dönmek için
              yukarıdaki butonu kullanabilirsiniz.
            </p>
          </div>
        </div>

        {newsData && <TranslationDisplay content={newsData} />}
      </main>
    </div>
  )
}
