import { NewsExtractor } from "@/components/news-extractor"
import Image from "next/image"

export default function Home() {
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
        <NewsExtractor />
      </main>
    </div>
  )
}
