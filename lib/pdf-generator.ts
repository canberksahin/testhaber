"use client"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { toast } from "@/hooks/use-toast"
import type { NewsContent } from "@/types/news"

// Generate PDF for original content only
export async function generateOriginalPDF(newsContent: NewsContent): Promise<void> {
  try {
    // Show loading toast
    const { dismiss } = toast({
      title: "PDF oluşturuluyor",
      description: "Lütfen bekleyin...",
    })

    // Create a temporary container for PDF generation
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.left = "-9999px"
    container.style.top = "0"
    container.style.width = "800px" // Fixed width for PDF
    container.style.backgroundColor = "#ffffff"
    container.style.padding = "20px"
    document.body.appendChild(container)

    // Add header
    const headerDiv = document.createElement("div")
    headerDiv.style.display = "flex"
    headerDiv.style.alignItems = "center"
    headerDiv.style.marginBottom = "20px"

    // Create image element for logo
    const logoImg = new Image()
    logoImg.src = "/logo.png"
    logoImg.width = 60
    logoImg.height = 60
    logoImg.style.marginRight = "15px"

    // Wait for image to load
    await new Promise((resolve) => {
      logoImg.onload = resolve
      // Set a timeout in case the image fails to load
      setTimeout(resolve, 1000)
    })

    headerDiv.appendChild(logoImg)

    const headerText = document.createElement("h1")
    headerText.textContent = "T.C. İletişim Başkanlığı"
    headerText.style.fontSize = "18px"
    headerText.style.fontWeight = "bold"
    headerText.style.color = "#1e40af"
    headerDiv.appendChild(headerText)

    container.appendChild(headerDiv)

    const blueLine = document.createElement("div")
    blueLine.style.width = "100%"
    blueLine.style.height = "2px"
    blueLine.style.backgroundColor = "#1e40af"
    blueLine.style.marginBottom = "20px"
    container.appendChild(blueLine)

    // Add title section
    const titleSection = document.createElement("div")
    titleSection.style.marginBottom = "20px"

    const titleLabel = document.createElement("h2")
    titleLabel.textContent = "Başlık:"
    titleLabel.style.fontSize = "18px"
    titleLabel.style.fontWeight = "600"
    titleLabel.style.color = "rgb(107, 114, 128)"
    titleLabel.style.marginBottom = "4px"

    const title = document.createElement("h1")
    title.textContent = newsContent.title || ""
    title.style.fontSize = "24px"
    title.style.fontWeight = "700"
    title.style.color = "rgb(17, 24, 39)"

    titleSection.appendChild(titleLabel)
    titleSection.appendChild(title)
    container.appendChild(titleSection)

    // Add metadata section
    const metaSection = document.createElement("div")
    metaSection.style.marginBottom = "20px"

    const dateLabel = document.createElement("h2")
    dateLabel.textContent = "Tarih:"
    dateLabel.style.fontSize = "18px"
    dateLabel.style.fontWeight = "600"
    dateLabel.style.color = "rgb(107, 114, 128)"
    dateLabel.style.marginBottom = "4px"

    const dateInfo = document.createElement("div")
    dateInfo.style.display = "flex"
    dateInfo.style.alignItems = "center"
    dateInfo.style.color = "rgb(55, 65, 81)"
    dateInfo.innerHTML = `
      <span>${newsContent.publishDate} ${newsContent.publishTime ? `- ${newsContent.publishTime}` : ""}</span>
    `

    metaSection.appendChild(dateLabel)
    metaSection.appendChild(dateInfo)

    if (newsContent.author) {
      const authorInfo = document.createElement("div")
      authorInfo.style.marginTop = "8px"
      authorInfo.style.color = "rgb(55, 65, 81)"
      authorInfo.innerHTML = `<span style="font-weight: 500;">Yazar:</span> ${newsContent.author}`
      metaSection.appendChild(authorInfo)
    }

    const languageInfo = document.createElement("div")
    languageInfo.style.marginTop = "8px"
    languageInfo.style.color = "rgb(55, 65, 81)"
    languageInfo.innerHTML = `<span style="font-weight: 500;">Dil:</span> ${newsContent.language}`
    metaSection.appendChild(languageInfo)

    container.appendChild(metaSection)

    // Add image if exists
    if (newsContent.imageUrl) {
      const imgContainer = document.createElement("div")
      imgContainer.style.marginBottom = "40px" // Increased margin for better spacing

      const img = new Image()
      img.src = newsContent.imageUrl
      img.style.maxWidth = "100%"
      img.style.height = "auto"
      img.style.borderRadius = "6px"
      img.style.display = "block" // Ensure block display

      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve
        // Set a timeout in case the image fails to load
        setTimeout(resolve, 1000)
      })

      imgContainer.appendChild(img)
      container.appendChild(imgContainer)
    }

    // Add content section header
    const contentHeaderDiv = document.createElement("div")
    contentHeaderDiv.style.marginBottom = "16px"

    const contentLabel = document.createElement("h2")
    contentLabel.textContent = "Haber Metni:"
    contentLabel.style.fontSize = "18px"
    contentLabel.style.fontWeight = "600"
    contentLabel.style.color = "rgb(107, 114, 128)"
    contentLabel.style.marginBottom = "0"

    contentHeaderDiv.appendChild(contentLabel)
    container.appendChild(contentHeaderDiv)

    // Add original content only
    const contentSection = document.createElement("div")
    contentSection.style.marginBottom = "20px"

    const content = document.createElement("div")
    content.innerHTML = newsContent.content
    contentSection.appendChild(content)

    container.appendChild(contentSection)

    // Add source
    const sourceDiv = document.createElement("div")
    sourceDiv.style.borderTop = "1px solid rgb(229, 231, 235)"
    sourceDiv.style.paddingTop = "16px"
    sourceDiv.style.marginTop = "24px"
    sourceDiv.style.fontSize = "14px"
    sourceDiv.style.color = "rgb(107, 114, 128)"
    sourceDiv.innerHTML = `Kaynak: <a href="${newsContent.url}" style="color: rgb(37, 99, 235);">${newsContent.url}</a>`
    container.appendChild(sourceDiv)

    // Wait a moment for everything to render
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Create canvas from the temporary container
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    })

    // Calculate dimensions
    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4")
    const imgData = canvas.toDataURL("image/png")

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

    // Save PDF
    pdf.save(`${sanitizeFilename(newsContent.title || "haber")}.pdf`)

    // Clean up - remove the temporary container
    document.body.removeChild(container)

    // Dismiss loading toast and show success
    dismiss()
    toast({
      title: "PDF başarıyla indirildi",
      description: "PDF dosyası bilgisayarınıza kaydedildi.",
      variant: "success",
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    toast({
      title: "PDF oluşturulurken bir hata oluştu",
      description: "Lütfen tekrar deneyin.",
      variant: "destructive",
    })
  }
}

// Generate PDF for translation content
export async function generateTranslationPDF(newsContent: NewsContent): Promise<void> {
  try {
    // Show loading toast
    const { dismiss } = toast({
      title: "PDF oluşturuluyor",
      description: "Lütfen bekleyin...",
    })

    // Create a temporary container for PDF generation
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.left = "-9999px"
    container.style.top = "0"
    container.style.width = "800px" // Fixed width for PDF
    container.style.backgroundColor = "#ffffff"
    container.style.padding = "20px"
    document.body.appendChild(container)

    // Add header
    const headerDiv = document.createElement("div")
    headerDiv.style.display = "flex"
    headerDiv.style.alignItems = "center"
    headerDiv.style.marginBottom = "20px"

    // Create image element for logo
    const logoImg = new Image()
    logoImg.src = "/logo.png"
    logoImg.width = 60
    logoImg.height = 60
    logoImg.style.marginRight = "15px"

    // Wait for image to load
    await new Promise((resolve) => {
      logoImg.onload = resolve
      // Set a timeout in case the image fails to load
      setTimeout(resolve, 1000)
    })

    headerDiv.appendChild(logoImg)

    const headerText = document.createElement("h1")
    headerText.textContent = "T.C. İletişim Başkanlığı"
    headerText.style.fontSize = "18px"
    headerText.style.fontWeight = "bold"
    headerText.style.color = "#1e40af"
    headerDiv.appendChild(headerText)

    container.appendChild(headerDiv)

    const blueLine = document.createElement("div")
    blueLine.style.width = "100%"
    blueLine.style.height = "2px"
    blueLine.style.backgroundColor = "#1e40af"
    blueLine.style.marginBottom = "20px"
    container.appendChild(blueLine)

    // Add title section
    const titleSection = document.createElement("div")
    titleSection.style.marginBottom = "20px"

    const titleLabel = document.createElement("h2")
    titleLabel.textContent = "Başlık:"
    titleLabel.style.fontSize = "18px"
    titleLabel.style.fontWeight = "600"
    titleLabel.style.color = "rgb(107, 114, 128)"
    titleLabel.style.marginBottom = "4px"

    const title = document.createElement("h1")
    title.textContent = newsContent.translatedTitle || newsContent.title || ""
    title.style.fontSize = "24px"
    title.style.fontWeight = "700"
    title.style.color = "rgb(17, 24, 39)"

    titleSection.appendChild(titleLabel)
    titleSection.appendChild(title)

    // Add original title for reference
    const originalTitle = document.createElement("div")
    originalTitle.style.marginTop = "8px"
    originalTitle.style.fontSize = "14px"
    originalTitle.style.color = "rgb(107, 114, 128)"
    originalTitle.innerHTML = `<span style="font-weight: 500;">Orijinal başlık (${newsContent.language}):</span> ${newsContent.title}`
    titleSection.appendChild(originalTitle)

    container.appendChild(titleSection)

    // Add metadata section
    const metaSection = document.createElement("div")
    metaSection.style.marginBottom = "20px"

    const dateLabel = document.createElement("h2")
    dateLabel.textContent = "Tarih:"
    dateLabel.style.fontSize = "18px"
    dateLabel.style.fontWeight = "600"
    dateLabel.style.color = "rgb(107, 114, 128)"
    dateLabel.style.marginBottom = "4px"

    const dateInfo = document.createElement("div")
    dateInfo.style.display = "flex"
    dateInfo.style.alignItems = "center"
    dateInfo.style.color = "rgb(55, 65, 81)"
    dateInfo.innerHTML = `
      <span>${newsContent.publishDate} ${newsContent.publishTime ? `- ${newsContent.publishTime}` : ""}</span>
    `

    metaSection.appendChild(dateLabel)
    metaSection.appendChild(dateInfo)

    if (newsContent.author) {
      const authorInfo = document.createElement("div")
      authorInfo.style.marginTop = "8px"
      authorInfo.style.color = "rgb(55, 65, 81)"
      authorInfo.innerHTML = `<span style="font-weight: 500;">Yazar:</span> ${newsContent.author}`
      metaSection.appendChild(authorInfo)
    }

    const languageInfo = document.createElement("div")
    languageInfo.style.marginTop = "8px"
    languageInfo.style.color = "rgb(55, 65, 81)"
    languageInfo.innerHTML = `<span style="font-weight: 500;">Orijinal Dil:</span> ${newsContent.language}`
    metaSection.appendChild(languageInfo)

    container.appendChild(metaSection)

    // Add image if exists
    if (newsContent.imageUrl) {
      const imgContainer = document.createElement("div")
      imgContainer.style.marginBottom = "40px" // Increased margin for better spacing

      const img = new Image()
      img.src = newsContent.imageUrl
      img.style.maxWidth = "100%"
      img.style.height = "auto"
      img.style.borderRadius = "6px"
      img.style.display = "block" // Ensure block display

      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve
        // Set a timeout in case the image fails to load
        setTimeout(resolve, 1000)
      })

      imgContainer.appendChild(img)
      container.appendChild(imgContainer)
    }

    // Add content section header
    const contentHeaderDiv = document.createElement("div")
    contentHeaderDiv.style.marginBottom = "16px"

    const contentLabel = document.createElement("h2")
    contentLabel.textContent = "Türkçe Çeviri:"
    contentLabel.style.fontSize = "18px"
    contentLabel.style.fontWeight = "600"
    contentLabel.style.color = "rgb(107, 114, 128)"
    contentLabel.style.marginBottom = "0"

    contentHeaderDiv.appendChild(contentLabel)
    container.appendChild(contentHeaderDiv)

    // Add translated content
    const contentSection = document.createElement("div")
    contentSection.style.marginBottom = "20px"

    const content = document.createElement("div")
    content.innerHTML = newsContent.translatedContent || ""
    contentSection.appendChild(content)

    // Add translation note
    const noteDiv = document.createElement("div")
    noteDiv.style.marginTop = "24px"
    noteDiv.style.fontSize = "14px"
    noteDiv.style.color = "rgb(107, 114, 128)"
    noteDiv.style.fontStyle = "italic"
    noteDiv.style.borderLeft = "4px solid rgb(229, 231, 235)"
    noteDiv.style.paddingLeft = "16px"
    noteDiv.textContent =
      "Not: Bu çeviride, haberin orijinal dilinde kullanılan kavramlara bağlı kalınarak çeviri yapılmıştır."
    contentSection.appendChild(noteDiv)

    container.appendChild(contentSection)

    // Add source
    const sourceDiv = document.createElement("div")
    sourceDiv.style.borderTop = "1px solid rgb(229, 231, 235)"
    sourceDiv.style.paddingTop = "16px"
    sourceDiv.style.marginTop = "24px"
    sourceDiv.style.fontSize = "14px"
    sourceDiv.style.color = "rgb(107, 114, 128)"
    sourceDiv.innerHTML = `Kaynak: <a href="${newsContent.url}" style="color: rgb(37, 99, 235);">${newsContent.url}</a>`
    container.appendChild(sourceDiv)

    // Wait a moment for everything to render
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Create canvas from the temporary container
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    })

    // Calculate dimensions
    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4")
    const imgData = canvas.toDataURL("image/png")

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

    // Save PDF
    pdf.save(`${sanitizeFilename(newsContent.translatedTitle || newsContent.title || "çeviri")}_çeviri.pdf`)

    // Clean up - remove the temporary container
    document.body.removeChild(container)

    // Dismiss loading toast and show success
    dismiss()
    toast({
      title: "PDF başarıyla indirildi",
      description: "PDF dosyası bilgisayarınıza kaydedildi.",
      variant: "success",
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    toast({
      title: "PDF oluşturulurken bir hata oluştu",
      description: "Lütfen tekrar deneyin.",
      variant: "destructive",
    })
  }
}

// Helper function to sanitize filename
function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .substring(0, 100) // Limit length
}
