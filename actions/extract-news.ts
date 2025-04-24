"use server"

import * as cheerio from "cheerio"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { NewsContent } from "@/types/news"

// Maximum number of retry attempts
const MAX_RETRIES = 2
// Timeout for fetch requests in milliseconds
const FETCH_TIMEOUT = 15000

// Define the model to use
const AI_MODEL = "gpt-4o-mini" // Fallback to a more reliable model
// Set a lower temperature for more deterministic outputs
const MODEL_TEMPERATURE = 0.3
// Set a lower max tokens to be more efficient
const MAX_TOKENS = 3000

export async function extractNewsContent(url: string): Promise<NewsContent> {
  try {
    // Validate URL format
    let validatedUrl: URL
    try {
      validatedUrl = new URL(url)
      // Ensure the URL has http or https protocol
      if (!validatedUrl.protocol.match(/^https?:$/)) {
        throw new Error("URL must use HTTP or HTTPS protocol")
      }
    } catch (error) {
      console.error("URL validation error:", error)
      throw new Error(`Invalid URL format: ${error.message}`)
    }

    // Fetch the webpage content with retries
    let html
    try {
      html = await fetchWithRetry(validatedUrl.toString())
      if (!html) {
        throw new Error("Failed to fetch webpage content")
      }
    } catch (error) {
      console.error("Fetch error:", error)
      throw new Error(`Fetch error: ${error.message}`)
    }

    // Parse HTML with cheerio
    let $
    try {
      $ = cheerio.load(html)
    } catch (error) {
      console.error("HTML parsing error:", error)
      throw new Error(`HTML parsing error: ${error.message}`)
    }

    // Extract basic metadata
    const title = $("title").text().trim() || $("h1").first().text().trim()
    if (!title) {
      console.warn("Could not extract title from the webpage")
    }

    // Try to find the author
    let author = ""
    const possibleAuthorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      ".author",
      ".byline",
      '[rel="author"]',
      ".writer",
      ".news-detail-author",
      ".article-author",
    ]

    for (const selector of possibleAuthorSelectors) {
      const authorElement = $(selector)
      if (authorElement.length) {
        author = authorElement.attr("content") || authorElement.text().trim()
        if (author) {
          // Clean up author information (remove mailto: links)
          author = author.replace(/mailto:.*$/i, "").trim()
          break
        }
      }
    }

    // Try to find the publication date and time
    let publishDate = ""
    let publishTime = ""
    const possibleDateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="publication_date"]',
      ".date",
      ".publish-date",
      ".article-date",
      ".news-date",
      ".time",
      ".timestamp",
    ]

    for (const selector of possibleDateSelectors) {
      const dateElement = $(selector)
      if (dateElement.length) {
        const dateText = dateElement.attr("content") || dateElement.text().trim()
        if (dateText) {
          // Try to parse the date string
          try {
            // Check if it's in ISO format from meta tags
            if (dateText.includes("T")) {
              const date = new Date(dateText)
              publishDate = date.toLocaleDateString("tr-TR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
              publishTime = date.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            } else {
              // Try to extract date and time from text
              const dateTimeMatch = dateText.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})[^\d]*(\d{1,2}:\d{1,2})/i)
              if (dateTimeMatch) {
                publishDate = dateTimeMatch[1]
                publishTime = dateTimeMatch[2]
              } else {
                // Just use the text as is if we can't parse it
                publishDate = dateText
              }
            }
            if (publishDate) break
          } catch (e) {
            console.error("Error parsing date:", e)
            publishDate = dateText // Use as is if parsing fails
          }
        }
      }
    }

    // Try to find the main image
    let imageUrl = ""
    const possibleImageSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      "article img",
      ".post-content img",
      ".article-content img",
      ".entry-content img",
      ".news-detail-img img",
      ".article-img img",
    ]

    for (const selector of possibleImageSelectors) {
      const imgElement = $(selector)
      if (imgElement.length) {
        imageUrl = imgElement.attr("content") || imgElement.attr("src") || ""
        if (imageUrl) {
          // Make relative URLs absolute
          if (imageUrl.startsWith("/")) {
            imageUrl = `${validatedUrl.origin}${imageUrl}`
          } else if (!imageUrl.startsWith("http")) {
            // Handle relative URLs without leading slash
            const basePath = validatedUrl.pathname.split("/").slice(0, -1).join("/")
            imageUrl = `${validatedUrl.origin}${basePath}/${imageUrl}`
          }
          break
        }
      }
    }

    // Extract the main content using a more robust approach
    const mainContent = await extractMainContent($, html, validatedUrl.toString())

    if (!mainContent || mainContent.trim() === "") {
      throw new Error("Could not extract content from the webpage")
    }

    // Detect language and translate if needed
    let languageResult
    try {
      languageResult = await detectLanguageAndTranslate(title, mainContent)
    } catch (error) {
      console.error("Language detection/translation error:", error)
      languageResult = { language: "Bilinmiyor", isTranslated: false }
    }

    return {
      url,
      title,
      author,
      imageUrl,
      content: mainContent,
      publishDate,
      publishTime,
      ...languageResult,
    }
  } catch (error) {
    // Log the full error object for debugging
    console.error("Error extracting news content - Full error:", error)

    // Create a detailed error message
    let detailedError = `Error extracting news content: ${error.message || "Unknown error"}`

    // Add stack trace if available
    if (error.stack) {
      detailedError += `\nStack trace: ${error.stack}`
    }

    // Add any additional properties that might be helpful
    if (error.cause) {
      detailedError += `\nCause: ${JSON.stringify(error.cause)}`
    }

    if (error.code) {
      detailedError += `\nError code: ${error.code}`
    }

    if (error.response) {
      detailedError += `\nResponse: ${JSON.stringify(error.response)}`
    }

    throw new Error(detailedError)
  }
}

// New robust content extraction function
async function extractMainContent($: cheerio.CheerioAPI, html: string, url: string): Promise<string> {
  console.log("Starting content extraction for URL:", url)

  // Try multiple approaches to extract content
  let content = ""

  // Approach 1: Try to find the main content using common selectors
  console.log("Approach 1: Using common content selectors")
  const contentSelectors = [
    "article",
    ".post-content",
    ".article-content",
    ".entry-content",
    ".content",
    ".news-detail-content",
    ".article-body",
    "main",
    "#content",
    ".post",
    ".story",
    ".news-text",
    "[itemprop='articleBody']",
    ".story-body",
  ]

  for (const selector of contentSelectors) {
    const element = $(selector)
    if (element.length) {
      // Remove unwanted elements before getting HTML
      element
        .find(
          "script, style, .share-buttons, .social-share, .paylas, .share, nav, .navigation, .breadcrumb, .related-news, .comments, .sidebar, .ad, .advertisement, footer, header, .menu",
        )
        .remove()

      content = element.html() || ""
      if (content && content.trim().length > 100) {
        console.log(`Found content using selector: ${selector}`)
        break
      }
    }
  }

  // Approach 2: If no content found, try to extract paragraphs directly
  if (!content || content.trim().length < 100) {
    console.log("Approach 2: Extracting paragraphs directly")
    const paragraphs = $("p")
    if (paragraphs.length > 0) {
      let paragraphsHtml = ""
      paragraphs.each((_, element) => {
        const paragraphText = $(element).text().trim()
        if (paragraphText.length > 20) {
          // Only include substantial paragraphs
          paragraphsHtml += `<p>${paragraphText}</p>\n`
        }
      })

      if (paragraphsHtml.length > 100) {
        content = paragraphsHtml
        console.log("Extracted content from paragraphs")
      }
    }
  }

  // Approach 3: If still no content, try to use AI to extract content
  if (!content || content.trim().length < 100) {
    console.log("Approach 3: Using AI to extract content")
    try {
      content = await extractContentWithAI(html)
      console.log("Extracted content using AI")
    } catch (error) {
      console.error("AI content extraction failed:", error)
      // Continue to the next approach
    }
  }

  // Approach 4: Last resort - clean the entire body
  if (!content || content.trim().length < 100) {
    console.log("Approach 4: Cleaning entire body as last resort")
    const body = $("body").clone()
    body
      .find(
        "script, style, header, footer, nav, .menu, .navigation, .share, .social, .comments, .sidebar, .ad, .advertisement, iframe, .breadcrumb, .related-news",
      )
      .remove()

    content = body.html() || ""
    console.log("Extracted content from cleaned body")
  }

  // Final cleaning of the content
  if (content) {
    // Clean up the content
    content = cleanHtmlContent(content)
  }

  console.log(`Content extraction complete. Content length: ${content.length} characters`)
  return content
}

// Clean HTML content
function cleanHtmlContent(html: string): string {
  // Load the HTML into cheerio
  const $ = cheerio.load(html)

  // Remove empty paragraphs and divs
  $("p, div").each((_, element) => {
    const el = $(element)
    if (el.text().trim() === "" && !el.find("img").length) {
      el.remove()
    }
  })

  // Remove any remaining scripts, styles, and other unwanted elements
  $("script, style, iframe, form, button, input, .ad, .advertisement, .share, .social").remove()

  // Remove data attributes and event handlers
  $("*").each((_, element) => {
    const attributes = element.attribs
    for (const attr in attributes) {
      if (attr.startsWith("data-") || attr.startsWith("on") || attr === "style" || attr === "class") {
        $(element).removeAttr(attr)
      }
    }
  })

  // Get the cleaned HTML
  return $.html()
}

// Extract content using AI
async function extractContentWithAI(html: string): Promise<string> {
  try {
    console.log("Attempting to process content with AI model:", AI_MODEL)

    const startTime = Date.now()
    const { text: analyzedContent } = await generateText({
      model: openai(AI_MODEL),
      temperature: MODEL_TEMPERATURE,
      maxTokens: MAX_TOKENS,
      messages: [
        {
          role: "system",
          content:
            "You are a news article extractor. Extract the COMPLETE main content of the article without truncating or summarizing. Preserve paragraphs and formatting. Return only the article content in clean HTML format, without any analysis, code blocks, or additional text. EXCLUDE navigation elements, social media buttons, related news sections, comments, and any other non-article content. Focus only on the actual news article text and any images that are part of the article content. DO NOT include any markdown formatting, code block markers like ```html, or any other non-HTML formatting. ENSURE THE ENTIRE ARTICLE IS INCLUDED WITHOUT CUTTING OFF ANY CONTENT.",
        },
        {
          role: "user",
          content: `Extract the COMPLETE news article content from this HTML, ensuring no text is cut off. Return ONLY clean HTML without any markdown formatting or code block markers: ${html}`,
        },
      ],
    })

    const endTime = Date.now()
    console.log(`AI processing completed in ${endTime - startTime}ms`)

    return analyzedContent
      .replace(/```html/g, "")
      .replace(/```/g, "")
      .replace(/`/g, "")
      .trim()
  } catch (error) {
    console.error("Error processing content with AI:", error)
    throw error
  }
}

// Fetch with timeout and retry logic
async function fetchWithRetry(url: string, retries = 0): Promise<string> {
  try {
    // Create an AbortController to handle timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml",
          "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
        },
        signal: controller.signal,
        next: { revalidate: 0 }, // Disable caching
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type") || ""
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        throw new Error(`Unexpected content type: ${contentType}. Expected HTML.`)
      }

      return await response.text()
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    // Handle abort error (timeout)
    if (error.name === "AbortError") {
      console.error(`Fetch timeout after ${FETCH_TIMEOUT}ms for URL: ${url}`)
      throw new Error("Request timed out. The website took too long to respond.")
    }

    // Retry logic
    if (retries < MAX_RETRIES) {
      console.warn(`Fetch attempt ${retries + 1} failed, retrying... Error: ${error.message}`)
      // Exponential backoff: wait longer between each retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)))
      return fetchWithRetry(url, retries + 1)
    }

    // If we've exhausted all retries, throw a more descriptive error
    if (error.message.includes("CORS")) {
      throw new Error("CORS error: The website doesn't allow access from our application.")
    } else if (error.message.includes("SSL")) {
      throw new Error("SSL error: The website has an invalid security certificate.")
    } else {
      throw new Error(`Fetch failed after ${MAX_RETRIES + 1} attempts: ${error.message}`)
    }
  }
}

async function detectLanguageAndTranslate(
  title: string,
  content: string,
): Promise<{
  language: string
  translatedTitle?: string
  translatedContent?: string
  isTranslated: boolean
}> {
  try {
    // Use OpenAI to detect language with better error handling
    let detectionResult
    try {
      console.log("Attempting language detection with AI model:", AI_MODEL)

      const startTime = Date.now()
      const response = await generateText({
        model: openai(AI_MODEL),
        temperature: MODEL_TEMPERATURE,
        maxTokens: 50, // Language detection needs very few tokens
        messages: [
          {
            role: "system",
            content:
              "You are a language detection system. Analyze the provided text and determine its language. Return ONLY the language name in Turkish (e.g., 'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca', 'İtalyanca', 'Rusça', 'Çince', 'Japonca', 'Arapça', 'Türkçe', etc.). If you're not sure, make your best guess.",
          },
          {
            role: "user",
            content: `Detect the language of this text: "${title} ${content.substring(0, 500)}..."`,
          },
        ],
      })

      const endTime = Date.now()
      console.log(`Language detection completed in ${endTime - startTime}ms`)

      detectionResult = response.text
    } catch (error) {
      console.error("Error with language detection - Full error:", error)

      let errorDetails = "Error with language detection: "

      if (error.message) {
        errorDetails += error.message
      }

      if (error.stack) {
        errorDetails += `\nStack: ${error.stack}`
      }

      if (error.response) {
        errorDetails += `\nResponse: ${JSON.stringify(error.response)}`
      }

      throw new Error(errorDetails)
    }

    const language = detectionResult.trim()

    // If language is Turkish, no need to translate
    if (language === "Türkçe") {
      return { language, isTranslated: false }
    }

    // Translate title with better error handling
    let translatedTitle
    try {
      console.log("Attempting title translation with AI model:", AI_MODEL)

      const startTime = Date.now()
      const response = await generateText({
        model: openai(AI_MODEL),
        temperature: MODEL_TEMPERATURE,
        maxTokens: 200, // Title translation needs few tokens
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator. Translate the given text from its original language to Turkish. Maintain the original meaning, tone, and style as much as possible. Return ONLY the translated text without any explanations or notes.",
          },
          {
            role: "user",
            content: `Translate this title to Turkish: "${title}"`,
          },
        ],
      })

      const endTime = Date.now()
      console.log(`Title translation completed in ${endTime - startTime}ms`)

      translatedTitle = response.text
    } catch (error) {
      console.error("Error with title translation:", error)
      translatedTitle = `[Çeviri hatası: ${error.message}]`
    }

    // Translate content with better error handling and improved prompt
    let translatedContent
    try {
      console.log("Attempting content translation with AI model:", AI_MODEL)

      const startTime = Date.now()
      const response = await generateText({
        model: openai(AI_MODEL),
        temperature: MODEL_TEMPERATURE,
        maxTokens: MAX_TOKENS,
        messages: [
          {
            role: "system",
            content:
              "You are a professional news translator. Your task is to translate news content from its original language to Turkish while following these strict guidelines:\n\n" +
              "1. Maintain the original meaning, tone, and style of the news article\n" +
              "2. Preserve important HTML formatting like paragraphs, but simplify excessive formatting\n" +
              "3. REMOVE ALL DUPLICATIONS - do not repeat the title, publication info, or any content\n" +
              "4. REMOVE ALL LINKS, navigation elements, social media buttons, and sharing options\n" +
              "5. REMOVE ALL METADATA like timestamps, article IDs, tracking codes\n" +
              "6. REMOVE ALL FOOTER INFORMATION like copyright notices, website info\n" +
              "7. REMOVE ALL RELATED ARTICLE LINKS or suggestions\n" +
              "8. REMOVE ALL ADVERTISEMENTS or promotional content\n\n" +
              "Return ONLY the clean, translated HTML content of the actual news article. Focus exclusively on the main article text, preserving only essential formatting.",
          },
          {
            role: "user",
            content: `Translate this news content to Turkish, following all the guidelines to produce clean, professional output without duplications, links, or metadata: ${content}`,
          },
        ],
      })

      const endTime = Date.now()
      console.log(`Content translation completed in ${endTime - startTime}ms`)

      translatedContent = response.text
    } catch (error) {
      console.error("Error with content translation:", error)
      translatedContent = `<p>[Çeviri hatası: ${error.message}]</p>`
    }

    return {
      language,
      translatedTitle,
      translatedContent,
      isTranslated: true,
    }
  } catch (error) {
    console.error("Error in language detection or translation:", error)
    return { language: "Bilinmiyor", isTranslated: false }
  }
}
