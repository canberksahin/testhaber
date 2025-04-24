"use client"

import Image from "next/image"
import type { NewsContent } from "@/types/news"
import { CalendarIcon, DownloadIcon, GlobeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef } from "react"
import { generateOriginalPDF } from "@/lib/pdf-generator"

interface NewsDisplayProps {
  content: NewsContent
}

export function NewsDisplay({ content }: NewsDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = async () => {
    try {
      if (contentRef.current) {
        await generateOriginalPDF(content)
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }

  return (
    <div className="bg-white border-0 shadow-sm rounded-md overflow-hidden">
      <div className="p-6" ref={contentRef}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-500 mb-1">Başlık:</h2>
            <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
          </div>
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            <DownloadIcon className="h-4 w-4" />
            PDF İndir
          </Button>
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
            <span className="font-medium">Dil:</span> <span className="ml-1">{content.language}</span>
          </div>
        </div>

        {content.imageUrl && (
          <div className="mb-6">
            <div className="relative w-full h-80 overflow-hidden rounded-md">
              <Image
                src={content.imageUrl || "/placeholder.svg"}
                alt={content.title || "Haber görseli"}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-500 mb-3">Haber Metni:</h2>
          <div className="prose max-w-none text-gray-800">
            <div dangerouslySetInnerHTML={{ __html: content.content }} />
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
