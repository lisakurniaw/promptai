// AI Video Generation API Service
// Uses Google Gemini Veo API for video generation

import { generateVideoPrompt, generateStoryboard } from './promptEngine.js'

const API_CONFIG = {
    // Gemini/Veo API
    GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    VEO_MODEL: 'veo-2',           // veo-2 for stable, veo-3.1-generate-preview for latest
    VEO_MODEL_FAST: 'veo-2-fast', // Faster generation, lower quality

    // Replicate API (alternative)
    REPLICATE_BASE_URL: 'https://api.replicate.com/v1',
    REPLICATE_SVD_MODEL: 'stability-ai/stable-video-diffusion',
    REPLICATE_LTX_MODEL: 'lightricks/ltx-video'
}

/**
 * Video Generation Service
 */
class VideoGenerationService {
    constructor() {
        this.geminiApiKey = null
        this.replicateApiKey = null
        this.preferredProvider = 'gemini' // 'gemini' or 'replicate'
    }

    /**
     * Initialize with API keys
     */
    init(config) {
        this.geminiApiKey = config.geminiApiKey
        this.replicateApiKey = config.replicateApiKey
        this.preferredProvider = config.preferredProvider || 'gemini'
    }

    /**
     * Check if API is configured
     */
    isConfigured() {
        if (this.preferredProvider === 'gemini') {
            return !!this.geminiApiKey
        }
        return !!this.replicateApiKey
    }

    /**
     * Generate video using Gemini Veo API
     */
    async generateWithGemini(prompt, options = {}) {
        if (!this.geminiApiKey) {
            throw new Error('Gemini API key not configured')
        }

        const model = options.fast ? API_CONFIG.VEO_MODEL_FAST : API_CONFIG.VEO_MODEL

        // Start video generation operation
        const response = await fetch(
            `${API_CONFIG.GEMINI_BASE_URL}/models/${model}:generateVideo?key=${this.geminiApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    generationConfig: {
                        aspectRatio: options.aspectRatio || '9:16',  // Vertical for social media
                        videoDuration: options.duration || '4s',
                        numberOfVideos: 1
                    },
                    safetySettings: {
                        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    }
                })
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`)
        }

        const operation = await response.json()
        return {
            operationId: operation.name,
            status: 'PENDING',
            provider: 'gemini'
        }
    }

    /**
     * Generate video using Replicate API (Stable Video Diffusion)
     */
    async generateWithReplicate(prompt, options = {}) {
        if (!this.replicateApiKey) {
            throw new Error('Replicate API key not configured')
        }

        const model = options.model || API_CONFIG.REPLICATE_LTX_MODEL

        const response = await fetch(
            `${API_CONFIG.REPLICATE_BASE_URL}/predictions`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.replicateApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    version: 'latest',
                    model: model,
                    input: {
                        prompt: prompt,
                        negative_prompt: options.negativePrompt || 'blurry, distorted, low quality',
                        num_frames: options.numFrames || 97,  // ~4 seconds at 24fps
                        fps: options.fps || 24,
                        width: options.width || 768,
                        height: options.height || 1344,  // 9:16 aspect ratio
                        guidance_scale: options.guidanceScale || 7.5,
                        num_inference_steps: options.steps || 50
                    }
                })
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Replicate API error: ${error.detail || 'Unknown error'}`)
        }

        const prediction = await response.json()
        return {
            operationId: prediction.id,
            status: 'PENDING',
            provider: 'replicate',
            urls: prediction.urls
        }
    }

    /**
     * Check operation status (Gemini)
     */
    async checkGeminiStatus(operationId) {
        const response = await fetch(
            `${API_CONFIG.GEMINI_BASE_URL}/${operationId}?key=${this.geminiApiKey}`
        )

        if (!response.ok) {
            throw new Error('Failed to check operation status')
        }

        const operation = await response.json()

        if (operation.done) {
            return {
                status: 'COMPLETED',
                videoUrl: operation.response?.generatedVideos?.[0]?.video?.uri,
                metadata: operation.response?.generatedVideos?.[0]?.metadata
            }
        }

        return {
            status: 'PENDING',
            progress: operation.metadata?.progress || 0
        }
    }

    /**
     * Check prediction status (Replicate)
     */
    async checkReplicateStatus(predictionId) {
        const response = await fetch(
            `${API_CONFIG.REPLICATE_BASE_URL}/predictions/${predictionId}`,
            {
                headers: {
                    'Authorization': `Token ${this.replicateApiKey}`
                }
            }
        )

        if (!response.ok) {
            throw new Error('Failed to check prediction status')
        }

        const prediction = await response.json()

        if (prediction.status === 'succeeded') {
            return {
                status: 'COMPLETED',
                videoUrl: prediction.output,
                metrics: prediction.metrics
            }
        }

        if (prediction.status === 'failed') {
            return {
                status: 'FAILED',
                error: prediction.error
            }
        }

        return {
            status: 'PENDING',
            progress: prediction.logs ? 50 : 0  // Rough estimate
        }
    }

    /**
     * Generate video (auto-select provider)
     */
    async generateVideo(prompt, options = {}) {
        if (this.preferredProvider === 'gemini' && this.geminiApiKey) {
            return this.generateWithGemini(prompt, options)
        } else if (this.replicateApiKey) {
            return this.generateWithReplicate(prompt, options)
        } else {
            throw new Error('No API key configured. Please add your Gemini or Replicate API key in Settings.')
        }
    }

    /**
     * Check status (auto-select provider)
     */
    async checkStatus(operationId, provider) {
        if (provider === 'gemini') {
            return this.checkGeminiStatus(operationId)
        } else {
            return this.checkReplicateStatus(operationId)
        }
    }

    /**
     * Generate complete project with all scenes
     */
    async generateProject(projectData) {
        const { persona, background, niche, style, productName, productImage } = projectData

        // Generate storyboard prompts
        const storyboard = generateStoryboard({
            globalLock: persona,
            background: background,
            niche: niche,
            stylePreset: style,
            productName: productName
        })

        // Generate videos for each scene
        const results = []

        for (const scene of storyboard) {
            try {
                const result = await this.generateVideo(scene.prompt, {
                    aspectRatio: '9:16',
                    duration: scene.duration,
                    negativePrompt: scene.negativePrompt
                })

                results.push({
                    sceneNumber: scene.sceneNumber,
                    sceneType: scene.sceneType,
                    prompt: scene.prompt,
                    operation: result
                })
            } catch (error) {
                results.push({
                    sceneNumber: scene.sceneNumber,
                    sceneType: scene.sceneType,
                    prompt: scene.prompt,
                    error: error.message
                })
            }
        }

        return results
    }
}

// Export singleton instance
export const videoService = new VideoGenerationService()

// Export for direct use
export { VideoGenerationService }
