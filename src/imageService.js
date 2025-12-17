/**
 * Image Generation Service
 * Handles integration with Google Gemini (Imagen 3) for Master Image generation.
 */

class ImageGenerationService {
    constructor() {
        this.apiKey = ''
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
        this.replicateApiKey = ''
    }

    init(config) {
        this.apiKey = config.geminiApiKey || config.bananaApiKey || '' // Fallback for transition
        this.replicateApiKey = config.replicateApiKey || ''
    }

    /**
     * Generate an image using Google Gemini (Imagen 3) or Replicate (Flux/SDXL)
     * @param {string} prompt - The positive prompt
     * @param {object} options - Additional options
     * @returns {Promise<object>} - The result containing the image base64 or URL
     */
    async generateImage(prompt, options = {}) {
        // Try Gemini first if key exists
        if (this.apiKey) {
            try {
                return await this.generateWithGemini(prompt, options)
            } catch (geminiError) {
                console.warn('Gemini generation failed, trying fallback...', geminiError)
                // If Replicate key exists, fall through to Replicate
                if (!this.replicateApiKey) {
                    throw geminiError // No fallback, throw original error
                }
            }
        }

        // Try Replicate if Gemini not configured or failed
        if (this.replicateApiKey) {
            return await this.generateWithReplicate(prompt, options)
        }

        throw new Error('No valid API Key configured for Image Generation (Gemini or Replicate)')
    }

    async generateWithGemini(prompt, options) {
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
            throw new Error(error.error?.message || 'Failed to generate image with Gemini')
        }

        const data = await response.json()

        if (!data.predictions || data.predictions.length === 0) {
            throw new Error('No image generated')
        }

        // predictions[0] main contain bytesBase64Encoded or similar
        const prediction = data.predictions[0]
        const imageBase64 = prediction.bytesBase64Encoded || prediction.image?.bytesBase64Encoded

        if (!imageBase64) {
            throw new Error('No image returned from Gemini')
        }

        return {
            status: 'COMPLETED',
            image: `data:image/png;base64,${imageBase64}`,
            meta: data
        }
    }

    async generateWithReplicate(prompt, options) {
        // Use Flux Schnell for fast, high quality generation
        const model = "black-forest-labs/flux-schnell"

        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${this.replicateApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: "latest", // Simplified for Flux
                input: {
                    prompt: prompt,
                    aspect_ratio: "1:1",
                    output_format: "png",
                    go_fast: true
                }
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to generate image with Replicate')
        }

        let prediction = await response.json()

        // Poll for result
        while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
            await new Promise(r => setTimeout(r, 1000))
            const statusRes = await fetch(prediction.urls.get, {
                headers: {
                    'Authorization': `Token ${this.replicateApiKey}`
                }
            })
            prediction = await statusRes.json()
        }

        if (prediction.status === 'failed') {
            throw new Error(prediction.error || 'Replicate generation failed')
        }

        return {
            status: 'COMPLETED',
            image: prediction.output[0], // URL
            meta: prediction
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
