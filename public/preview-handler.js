// This script handles the preview functionality
window.addEventListener("DOMContentLoaded", () => {
  // Check if we're in a preview window
  const isPreview = window.location.pathname.includes("preview")

  if (isPreview) {
    // Determine which type of preview we're showing
    const isTranslation = window.location.pathname.includes("translation")

    // Get the HTML content from localStorage
    const htmlContent = localStorage.getItem(isTranslation ? "translationHtmlPage" : "originalHtmlPage")

    if (htmlContent) {
      // Replace the current document with the stored HTML
      document.open()
      document.write(htmlContent)
      document.close()
    } else {
      document.body.innerHTML =
        '<div style="text-align: center; margin-top: 100px;"><h1>Önizleme bulunamadı</h1><p>Lütfen önce bir haber analiz edin.</p></div>'
    }
  }
})
