"use client"

import Image from "next/image"
import type { NewsContent } from "@/types/news"
import { CalendarIcon, GlobeIcon, LanguagesIcon } from "lucide-react"

interface TranslationDisplayProps {
  content: NewsContent
}

export function TranslationDisplay({ content }: TranslationDisplayProps) {
  return (
    <div className="bg-white border-0 shadow-sm rounded-md overflow-hidden">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-500 mb-1">Başlık:</h2>
          <h1 className="text-2xl font-bold text-gray-900">{content.translatedTitle || content.title}</h1>

          <div className="mt-4 text-sm text-gray-500 flex items-center">
            <LanguagesIcon className="h-4 w-4 mr-2" />
            <span>Orijinal başlık ({content.language}):</span> <span className="ml-1 font-medium">{content.title}</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-500 mb-1">Tarih:</h2>
          <div className="flex items-center text-gray-700">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>
              {content.publishDate} {content.publishTime && `- ${content.publishTime}`}
            </span>
          </div>
          {content.author && (
            <div className="mt-2 text-gray-700">
              <span className="font-medium">Yazar:</span> {content.author}
            </div>
          )}
          <div className="mt-2 text-gray-700 flex items-center">
            <GlobeIcon className="h-4 w-4 mr-2" />
            <span className="font-medium">Orijinal Dil:</span> <span className="ml-1">{content.language}</span>
          </div>
        </div>

        {content.imageUrl && (
          <div className="mb-6">
            <div className="relative w-full h-80 overflow-hidden rounded-md">
              <Image
                src={content.imageUrl || "/placeholder.svg"}
                alt={content.translatedTitle || content.title || "Haber görseli"}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-500 mb-3">Türkçe Çeviri:</h2>
          <div className="prose max-w-none text-gray-800 break-words whitespace-normal">
            <div dangerouslySetInnerHTML={{ __html: content.translatedContent || "" }} />
          </div>

          <div className="mt-4 text-sm text-gray-500 italic border-l-4 border-gray-200 pl-4">
            Not: Bu çeviride, haberin orijinal dilinde kullanılan kavramlara bağlı kalınarak çeviri yapılmıştır.
          </div>
        </div>

        <div className="text-sm text-gray-500 pt-4 mt-6 border-t">
          <p>
            Kaynak:{" "}
            <a href={content.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {content.url}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
