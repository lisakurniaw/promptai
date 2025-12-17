/**
 * Image Generation Service
 * Handles integration with Google Gemini (Imagen 3) for Master Image generation.
 */

class ImageGenerationService {
    constructor() {
        this.apiKey = ''
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
    }

    init(config) {
        this.apiKey = config.geminiApiKey || config.bananaApiKey || '' // Fallback for transition
    }

    /**
     * Generate an image using Google Gemini (Imagen 3)
     * @param {string} prompt - The positive prompt
     * @param {object} options - Additional options (aspectRatio, etc.)
     * @returns {Promise<object>} - The result containing the image base64 or URL
     */
    async generateImage(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('Gemini API Key is required')
        }

        try {
            // Use Imagen 3 model
            // Note: The specific model name might vary (imagen-3.0-generate-001 is common for labs/vertex)
            // For standard Gemini API, we might need to check if 'generateImage' fits or use standard generateContent with specific tools?
            // Currently, standard public Gemini API image generation support is limited/beta. 
            // We will assume the standard Imagen endpoint format for API keys.

            const response = await fetch(`${this.baseUrl}/models/imagen-3.0-generate-001:predict?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instances: [
                        {
                            prompt: prompt
                        }
                    ],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "1:1" // Default for master image
                    }
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error?.message || 'Failed to generate image')
            }

            const data = await response.json()

            if (!data.predictions || data.predictions.length === 0) {
                throw new Error('No image generated')
            }

            // predictions[0] main contain bytesBase64Encoded or similar
            const prediction = data.predictions[0]
            const imageBase64 = prediction.bytesBase64Encoded || prediction.image?.bytesBase64Encoded

            if (!imageBase64) {
                throw new Error('Invalid response format from Gemini API')
            }

            return {
                status: 'COMPLETED',
                image: `data:image/png;base64,${imageBase64}`,
                meta: data
            }

        } catch (error) {
            console.error('Gemini image generation error:', error)
            throw error
        }
    }

    /**
     * Analyze an image using Google Gemini 1.5 Flash
     * @param {string} base64Image - The image to analyze
     * @returns {Promise<string>} - The description of the image where the product is located
     */
    async analyzeImage(base64Image) {
        if (!this.apiKey) {
            // Return generic if no key (will be handled by caller)
            return ""
        }

        try {
            // Clean base64 string
            const imagePart = base64Image.split(',')[1] || base64Image

            const response = await fetch(`${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Describe this product image in high detail. Focus on the main product, its visual features, colors, materials, and key identifiers. Do not describe the background. Output a single paragraph description." },
                            {
                                inline_data: {
                                    mime_type: "image/jpeg", // Assuming jpeg/png, API is flexible
                                    data: imagePart
                                }
                            }
                        ]
                    }]
                })
            })

            if (!response.ok) {
                console.warn('Gemini vision analysis failed')
                return ""
            }

            const data = await response.json()
            return data.candidates?.[0]?.content?.parts?.[0]?.text || ""

        } catch (error) {
            console.error('Image analysis error:', error)
            return ""
        }
    }
}


// Export singleton
export const imageService = new ImageGenerationService()
