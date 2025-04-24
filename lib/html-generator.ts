"use client"

import type { NewsContent } from "@/types/news"

export function createFullHtmlPage(newsContent: NewsContent, type: "original" | "translation"): void {
  try {
    // Determine if we're creating an original or translation page
    const isTranslation = type === "translation"

    // Create the HTML content
    const htmlContent = `
<!DOCTYPE html>
<html lang="${isTranslation ? "tr" : newsContent.language === "Türkçe" ? "tr" : "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isTranslation ? newsContent.translatedTitle || newsContent.title : newsContent.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    .logo {
      width: 60px;
      height: 60px;
      margin-right: 15px;
    }
    .title {
      color: #1e40af;
      font-size: 18px;
      font-weight: bold;
      margin: 0;
    }
    .blue-line {
      height: 2px;
      background-color: #1e40af;
      margin-bottom: 20px;
    }
    .article-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .article-meta {
      margin-bottom: 20px;
      color: #555;
    }
    .article-image {
      max-width: 100%;
      height: auto;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .article-content {
      margin-bottom: 20px;
    }
    .article-source {
      font-size: 14px;
      color: #666;
      border-top: 1px solid #eee;
      padding-top: 15px;
      margin-top: 30px;
    }
    .translation-note {
      font-style: italic;
      color: #666;
      border-left: 4px solid #eee;
      padding-left: 15px;
      margin-top: 20px;
    }
    .original-title {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    h2 {
      color: #444;
      font-size: 18px;
      margin-bottom: 5px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="/logo.png" alt="T.C. İletişim Başkanlığı Logo" class="logo">
    <h1 class="title">T.C. İletişim Başkanlığı</h1>
  </div>
  <div class="blue-line"></div>
  
  <div class="article">
    <h2>Başlık:</h2>
    <div class="article-title">${isTranslation ? newsContent.translatedTitle || newsContent.title : newsContent.title}</div>
    
    ${
      isTranslation && newsContent.title
        ? `
    <div class="original-title">
      <strong>Orijinal başlık (${newsContent.language}):</strong> ${newsContent.title}
    </div>
    `
        : ""
    }
    
    <div class="article-meta">
      <h2>Tarih:</h2>
      <div>${newsContent.publishDate} ${newsContent.publishTime ? `- ${newsContent.publishTime}` : ""}</div>
      
      ${
        newsContent.author
          ? `
      <div style="margin-top: 8px;">
        <strong>Yazar:</strong> ${newsContent.author}
      </div>
      `
          : ""
      }
      
      <div style="margin-top: 8px;">
        <strong>${isTranslation ? "Orijinal Dil" : "Dil"}:</strong> ${newsContent.language}
      </div>
    </div>
    
    ${
      newsContent.imageUrl
        ? `
    <img src="${newsContent.imageUrl}" alt="${isTranslation ? newsContent.translatedTitle || newsContent.title : newsContent.title}" class="article-image">
    `
        : ""
    }
    
    <h2>${isTranslation ? "Türkçe Çeviri:" : "Haber Metni:"}</h2>
    <div class="article-content">
      ${isTranslation ? newsContent.translatedContent || "" : newsContent.content}
    </div>
    
    ${
      isTranslation
        ? `
    <div class="translation-note">
      Not: Bu çeviride, haberin orijinal dilinde kullanılan kavramlara bağlı kalınarak çeviri yapılmıştır.
    </div>
    `
        : ""
    }
    
    <div class="article-source">
      Kaynak: <a href="${newsContent.url}" target="_blank">${newsContent.url}</a>
    </div>
  </div>
</body>
</html>
    `

    // Create a Blob with the HTML content
    const blob = new Blob([htmlContent], { type: "text/html" })

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob)

    // Create a link element
    const link = document.createElement("a")
    link.href = url
    link.download = isTranslation ? "preview-translation.html" : "preview-original.html"

    // Append to the document, click it, and remove it
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Store the HTML content in localStorage for later use
    localStorage.setItem(isTranslation ? "translationHtmlPage" : "originalHtmlPage", htmlContent)

    // Create a hidden iframe to load the HTML file into the public directory
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.onload = () => {
      // Once loaded, we can access the document
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(htmlContent)
        iframeDoc.close()
      }
      // Remove the iframe after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }
    document.body.appendChild(iframe)

    // Also create a blob URL and store it for direct access
    localStorage.setItem(isTranslation ? "translationHtmlUrl" : "originalHtmlUrl", url)
  } catch (error) {
    console.error("Error creating HTML page:", error)
  }
}

// Function to open the HTML page from localStorage
export function openHtmlPage(type: "original" | "translation"): void {
  try {
    const htmlContent = localStorage.getItem(type === "translation" ? "translationHtmlPage" : "originalHtmlPage")

    if (htmlContent) {
      // Create a blob and open it in a new window
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } else {
      console.error("No HTML content found in localStorage")
    }
  } catch (error) {
    console.error("Error opening HTML page:", error)
  }
}
