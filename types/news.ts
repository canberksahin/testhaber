export interface NewsContent {
  url: string
  title: string
  author: string
  imageUrl: string
  content: string
  publishDate: string
  publishTime: string
  language: string
  translatedTitle?: string
  translatedContent?: string
  isTranslated: boolean
}
