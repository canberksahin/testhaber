"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import type { NewsContent } from "@/types/news"

export default function PreviewPage() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "original"
  const [newsData, setNewsData] = useState<NewsContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get the news data from localStorage
    const storageKey = type === "translation" ? "translatedNewsData" : "newsData"
    const storedData = localStorage.getItem(storageKey)

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        setNewsData(parsedData)
      } catch (error) {
        console.error("Error parsing stored news data:", error)
      }
    }

    setLoading(false)

    // If this is opened for printing, trigger print dialog
    if (searchParams.get("print") === "true") {
      setTimeout(() => {
        window.print()
      }, 1000) // Give it a second to render
    }
  }, [searchParams, type])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">İçerik yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!newsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">İçerik bulunamadı</h1>
          <p className="text-gray-600">Lütfen önce bir haber analiz edin.</p>
        </div>
      </div>
    )
  }

  const isTranslation = type === "translation"
  const title = isTranslation ? newsData.translatedTitle || newsData.title : newsData.title
  const content = isTranslation ? newsData.translatedContent || "" : newsData.content

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white print:p-0">
      <div className="flex items-center mb-6 print:mb-4">
        <div className="relative h-16 w-16 mr-3">
          <Image src="/logo.png" alt="T.C. İletişim Başkanlığı Logo" width={64} height={64} />
        </div>
        <h1 className="text-xl font-bold text-blue-600">T.C. İletişim Başkanlığı</h1>
      </div>

      <div className="w-full h-1 bg-blue-600 mb-6 print:mb-4"></div>

      <div className="mb-6 print:mb-4">
        <h2 className="text-lg font-semibold text-gray-500 mb-1">Başlık:</h2>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

        {isTranslation && newsData.title && (
          <div className="mt-2 text-sm text-gray-500">
            <span className="font-medium">Orijinal başlık ({newsData.language}):</span> {newsData.title}
          </div>
        )}
      </div>

      <div className="mb-6 print:mb-4">
        <h2 className="text-lg font-semibold text-gray-500 mb-1">Tarih:</h2>
        <div className="text-gray-700">
          <span>
            {newsData.publishDate} {newsData.publishTime && `- ${newsData.publishTime}`}
          </span>
        </div>

        {newsData.author && (
          <div className="mt-2 text-gray-700">
            <span className="font-medium">Yazar:</span> {newsData.author}
          </div>
        )}

        <div className="mt-2 text-gray-700">
          <span className="font-medium">{isTranslation ? "Orijinal Dil" : "Dil"}:</span>{" "}
          <span className="ml-1">{newsData.language}</span>
        </div>
      </div>

      {newsData.imageUrl && (
        <div className="mb-6 print:mb-4">
          <img
            src={newsData.imageUrl || "/placeholder.svg"}
            alt={title || "Haber görseli"}
            className="max-w-full h-auto rounded-md"
          />
        </div>
      )}

      <div className="mb-6 print:mb-4">
        <h2 className="text-lg font-semibold text-gray-500 mb-3">
          {isTranslation ? "Türkçe Çeviri:" : "Haber Metni:"}
        </h2>
        <div className="prose max-w-none text-gray-800">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        {isTranslation && (
          <div className="mt-4 text-sm text-gray-500 italic border-l-4 border-gray-200 pl-4">
            Not: Bu çeviride, haberin orijinal dilinde kullanılan kavramlara bağlı kalınarak çeviri yapılmıştır.
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500 pt-4 mt-6 border-t print:mt-4">
        <p>
          Kaynak:{" "}
          <a href={newsData.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {newsData.url}
          </a>
        </p>
      </div>

      <div className="mt-8 text-center print:hidden">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Yazdır
        </button>
      </div>
    </div>
  )
}
