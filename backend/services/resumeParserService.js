const pdfParse = require("pdf-parse");

/**
 * @param {Buffer} fileBuffer - raw bytes of the uploaded PDF
 * @returns {Promise<string>} plain text extracted from the PDF
 */
async function extractTextFromPdf(fileBuffer) {
  const data = await pdfParse(fileBuffer);
  const text = (data.text || "").trim();

  if (!text) {
    const err = new Error(
      "Could not extract any text from that PDF. Make sure it's a text-based resume, not a scanned image."
    );
    err.statusCode = 422;
    throw err;
  }

  return text;
}

module.exports = { extractTextFromPdf };
