/**
 * Image Generation Service
 * Handles integration with Google Gemini (Imagen 3) for Master Image generation.
 */

class ImageGenerationService {
    constructor() {
        this.apiKey = ''
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
        this.replicateApiKey = ''
        this.huggingFaceToken = ''
    }

    init(config) {
        this.apiKey = config.geminiApiKey || config.bananaApiKey || '' // Fallback for transition
        this.replicateApiKey = config.replicateApiKey || ''
        this.huggingFaceToken = config.huggingFaceToken || ''
    }

    /**
     * Generate an image using available providers with smart fallback
     * Priority: Gemini (if key) -> Pollinations (FREE) -> HuggingFace -> Simulation
     */
    async generateImage(prompt, options = {}) {
        const errors = []
        let result = null

        // 0. TRY GEMINI FIRST (if user has API key - preferred by user)
        if (this.apiKey) {
            try {
                console.log('Trying Gemini 2.0 Flash/Pro for image generation...')
                result = await this.generateWithGemini(prompt)
                if (result) return result
            } catch (err) {
                console.warn('Gemini image generation failed:', err)
                errors.push(`Gemini: ${err.message}`)
            }
        }

        // 1. TRY POLLINATIONS.AI (FREE, NO API KEY, ALWAYS WORKS FROM BROWSER!)
        try {
            console.log('Trying Pollinations.ai (FREE, no API key needed)...')
            result = await this.generateWithPollinations(prompt, options)
            if (result) return result
        } catch (err) {
            console.warn('Pollinations.ai failed:', err)
            errors.push(`Pollinations: ${err.message}`)
        }

        // 2. Try Hugging Face (Multiple Models)
        if (this.huggingFaceToken) {
            const hfModels = [
                'black-forest-labs/FLUX.1-dev',
                'stabilityai/stable-diffusion-xl-base-1.0'
            ]

            for (const model of hfModels) {
                try {
                    console.log(`Trying HuggingFace model: ${model}`)
                    result = await this.generateWithHuggingFace(prompt, model)
                    if (result) return result
                } catch (err) {
                    console.warn(`HF ${model} failed:`, err)
                    errors.push(`HF ${model}: ${err.message}`)
                }
            }
        }

        // 3. FINAL FALLBACK: Simulation
        console.warn('All generation methods failed, switching to simulation fallback.')
        return {
            status: 'COMPLETED',
            image: this.getSimulationImage(),
            meta: { provider: 'simulation', errors: errors },
            isFallback: true
        }
    }

    /**
     * Generate image using Pollinations.ai (FREE, NO API KEY REQUIRED!)
     * This service is CORS-enabled and works directly from browsers.
     */
    async generateWithPollinations(prompt, options = {}) {
        // Pollinations.ai provides a simple URL-based API
        const encodedPrompt = encodeURIComponent(prompt)
        const width = options.width || 1024
        const height = options.height || 1024
        const model = 'flux' // or 'turbo' for faster

        // The URL directly returns an image
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true`

        // Fetch the image and convert to base64 for consistency
        const response = await fetch(imageUrl)

        if (!response.ok) {
            throw new Error('Pollinations.ai request failed')
        }

        const blob = await response.blob()

        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve({
                status: 'COMPLETED',
                image: reader.result,
                meta: { provider: 'pollinations', model: model, url: imageUrl }
            })
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    }

    async generateWithHuggingFace(prompt, model) {
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.huggingFaceToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: prompt })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || `Failed to fetch from HF ${model}`)
        }

        const blob = await response.blob()
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve({
                status: 'COMPLETED',
                image: reader.result,
                meta: { provider: 'huggingface', model: model }
            })
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    }

    /**
     * Generate image using Gemini 2.0 Flash/Pro with generateContent API
     * Uses responseModalities: ["IMAGE"] for native image generation
     */
    async generateWithGemini(prompt, model) {
        // Try multiple Gemini models that support image generation
        const geminiImageModels = [
            'gemini-2.0-flash-exp',      // Experimental with image gen
            'gemini-2.0-flash',          // Stable 2.0 Flash
            'gemini-1.5-pro',            // 1.5 Pro fallback
        ]

        for (const geminiModel of geminiImageModels) {
            try {
                console.log(`Trying Gemini image generation with: ${geminiModel}`)

                const response = await fetch(`${this.baseUrl}/models/${geminiModel}:generateContent?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            responseModalities: ["IMAGE", "TEXT"],
                            responseMimeType: "image/png"
                        }
                    })
                })

                if (!response.ok) {
                    const error = await response.json()
                    console.warn(`${geminiModel} failed:`, error)
                    continue // Try next model
                }

                const data = await response.json()

                // Look for image in response parts
                const parts = data.candidates?.[0]?.content?.parts || []
                for (const part of parts) {
                    if (part.inlineData?.data) {
                        const mimeType = part.inlineData.mimeType || 'image/png'
                        return {
                            status: 'COMPLETED',
                            image: `data:${mimeType};base64,${part.inlineData.data}`,
                            meta: { provider: 'gemini', model: geminiModel }
                        }
                    }
                }

                console.warn(`${geminiModel} returned no image data`)

            } catch (err) {
                console.warn(`Gemini ${geminiModel} error:`, err)
            }
        }

        throw new Error('All Gemini models failed to generate image')
    }

    async generateWithReplicate(prompt, options) {
        // Use Flux Schnell for fast, high quality generation
        const model = "black-forest-labs/flux-schnell" // Optimized

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

        if (!response.ok) throw new Error('Replicate API failed')

        let prediction = await response.json()

        while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
            await new Promise(r => setTimeout(r, 1000))
            const statusRes = await fetch(prediction.urls.get, {
                headers: { 'Authorization': `Token ${this.replicateApiKey}` }
            })
            prediction = await statusRes.json()
        }

        if (prediction.status === 'failed') throw new Error(prediction.error || 'Replicate failed')
        return { status: 'COMPLETED', image: prediction.output[0], meta: prediction }
    }

    getSimulationImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwJSIgZmlsbD0iIzIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNpbXVsYXRlZCAoQVBJIEZhaWxlZCk8L3RleHQ+PC9zdmc+'
    }

    /**
     * Analyze an image using Google Gemini (2.0 Flash Exp / 1.5 Pro)
     * @param {string} base64Image - The image to analyze
     * @returns {Promise<string>} - The description of the image where the product is located
     */
    async analyzeImage(base64Image) {
        if (!this.apiKey) {
            return ""
        }

        // Try newer models first
        const visionModels = [
            'gemini-2.0-flash-exp', // Latest Experimental
            'gemini-1.5-pro',
            'gemini-1.5-flash'
        ]

        for (const model of visionModels) {
            try {
                const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '')

                const response = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: "Describe this product in detail in one sentence. Focus on the main object." },
                                { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }
                            ]
                        }]
                    })
                })

                if (!response.ok) continue // Try next model

                const data = await response.json()
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text
                if (text) return text

            } catch (e) {
                console.warn(`Vision analysis failed for ${model}`, e)
            }
        }

        return ""
    }
}


// Export singleton
export const imageService = new ImageGenerationService()
