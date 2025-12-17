// Prompt Engineering System for AI Video Generation
// Based on Google Veo best practices

/**
 * Prompt Template Structure:
 * - Subject: object, person, animal, scenery
 * - Action: what subject is doing (walking, running, etc)
 * - Style: creative direction (cinematic, noir, etc) 
 * - Camera: positioning and motion (dolly, pan, zoom)
 * - Composition: shot framing (wide, close-up, medium)
 * - Focus: lens effects (shallow, deep, soft)
 * - Ambiance: color and light (warm, cool, blue tones)
 */

// Global Lock Template - Ensures character consistency
export const GLOBAL_LOCKS = {
    indonesian_woman_fair: {
        subject: "Young Indonesian woman, fair skin (kulit sawo matang cerah), natural black hair, oval face with soft features",
        lighting: "cinematic lighting with soft key light and subtle fill, warm color temperature",
        quality: "4k resolution, photorealistic, high detail, professional video quality",
        consistency: "consistent facial features throughout, same person, same appearance"
    },
    indonesian_woman_medium: {
        subject: "Young Indonesian woman, medium tan skin (kulit sawo matang), natural black hair, round face with warm expression",
        lighting: "natural indoor lighting with soft shadows, neutral color temperature",
        quality: "4k resolution, photorealistic, high detail, professional video quality",
        consistency: "consistent facial features throughout, same person, same appearance"
    },
    indonesian_man_fair: {
        subject: "Young Indonesian man, fair skin, short neat black hair, clean-shaven, friendly expression",
        lighting: "cinematic lighting with soft key light and subtle fill, warm color temperature",
        quality: "4k resolution, photorealistic, high detail, professional video quality",
        consistency: "consistent facial features throughout, same person, same appearance"
    }
}

// Background/Environment Templates
export const BACKGROUNDS = {
    modern_living_room: "modern Indonesian living room, minimalist decor, soft natural daylight from window, clean white walls with subtle warm accents, comfortable sofa visible in background",
    minimalist_kitchen: "bright minimalist kitchen, white cabinets with wood accents, natural light from window, clean marble countertop, indoor plants visible",
    modern_bedroom: "cozy modern bedroom, soft morning light through sheer curtains, neutral earth tones, comfortable bedding, minimalist nightstand",
    studio_white: "professional studio setup, clean white background, ring light illumination creating soft even lighting, subtle shadows",
    outdoor_garden: "lush Indonesian garden, tropical plants and flowers, golden hour sunlight filtering through leaves, natural bokeh background"
}

// Niche-Specific Prompt Adaptations
export const NICHE_ADAPTERS = {
    herbal: {
        productFocus: "natural organic product packaging, herbal ingredients visible, fresh and clean aesthetic",
        expressions: "healthy radiant skin, refreshed expression, genuine satisfaction, natural glow",
        actions: ["holding product gently near face", "reading product label with interest", "applying product with gentle patting motion", "showing before/after skin texture"],
        atmosphere: "fresh, clean, natural, wellness-focused ambiance",
        colorGrading: "natural green and earth tones, fresh and vibrant colors, clean whites"
    },
    fashion: {
        productFocus: "detailed fabric texture, elegant stitching visible, premium material quality",
        expressions: "confident pose, elegant demeanor, fashionable attitude, subtle smile",
        actions: ["fabric flowing with natural movement", "graceful walk showing outfit details", "turning to show garment from different angles", "adjusting clothing with elegant gesture"],
        atmosphere: "stylish, premium, aspirational fashion aesthetic",
        colorGrading: "rich saturated colors, high contrast, fashion editorial look"
    },
    elektronik: {
        productFocus: "sleek gadget design, screen illumination, premium build quality, modern technology",
        expressions: "focused attention, impressed reaction, tech-savvy confidence, genuine interest",
        actions: ["unboxing with careful attention", "demonstrating key feature with finger gesture", "showing screen display to camera", "comparing size with hand for scale"],
        atmosphere: "modern, sleek, premium tech aesthetic",
        colorGrading: "cool blue tones, high contrast, cinematic tech commercial look"
    }
}

// Scene Templates for Multi-Scene Storyboard
export const SCENE_TEMPLATES = {
    HOOK: {
        purpose: "Grab attention in first 2 seconds",
        duration: "4 seconds",
        cameraWork: {
            movement: "static or subtle zoom in",
            composition: "medium close-up, face clearly visible",
            angle: "eye-level, slightly elevated for flattering angle"
        },
        actions: [
            "looking directly at camera with friendly smile",
            "holding product near face, making eye contact",
            "surprised/excited expression while revealing product"
        ],
        promptSuffix: "engaging with viewer, direct eye contact, inviting expression"
    },
    BENEFIT: {
        purpose: "Show product benefits",
        duration: "4 seconds",
        cameraWork: {
            movement: "slow pan right or left",
            composition: "medium shot, product clearly visible",
            angle: "eye-level"
        },
        actions: [
            "demonstrating product feature with hands",
            "pointing to product detail while explaining",
            "showing product from different angle"
        ],
        promptSuffix: "demonstrating benefit, focused on product, natural presentation"
    },
    DEMO: {
        purpose: "Show product in use",
        duration: "4 seconds",
        cameraWork: {
            movement: "close-up with subtle follow focus",
            composition: "close-up on product interaction",
            angle: "slightly overhead for clear view"
        },
        actions: [
            "using product with natural movements",
            "showing application technique",
            "revealing product result"
        ],
        promptSuffix: "product in action, detailed view, authentic usage demonstration"
    },
    CTA: {
        purpose: "Call to action",
        duration: "4 seconds",
        cameraWork: {
            movement: "slow zoom in ending on face",
            composition: "medium shot transitioning to close-up",
            angle: "eye-level, friendly perspective"
        },
        actions: [
            "gesturing toward camera with inviting motion",
            "pointing down (toward link/bio)",
            "smiling warmly while holding product"
        ],
        promptSuffix: "warm invitation, call to action gesture, friendly closing expression"
    }
}

// Style Presets
export const STYLE_PRESETS = {
    vlog: {
        camera: "handheld slight natural shake, authentic vlog feel",
        lighting: "natural ambient lighting, realistic indoor/outdoor light",
        color: "natural color grading, warm and inviting",
        mood: "casual, authentic, relatable content creator vibe"
    },
    studio: {
        camera: "locked tripod shot, smooth professional movement",
        lighting: "professional ring light, even illumination, catch lights in eyes",
        color: "clean neutral color grading, slightly warm skin tones",
        mood: "professional, polished, brand commercial quality"
    },
    cinematic: {
        camera: "smooth dolly/gimbal movement, shallow depth of field",
        lighting: "dramatic cinematic lighting, volumetric light effects, lens flare",
        color: "cinematic color grading, filmic look, rich shadows",
        mood: "premium, aspirational, high-end commercial"
    }
}

/**
 * Generate complete video prompt for a scene
 */
export function generateVideoPrompt(options) {
    const {
        globalLock,      // e.g., 'indonesian_woman_fair'
        background,      // e.g., 'modern_living_room'
        niche,           // e.g., 'herbal'
        sceneType,       // e.g., 'HOOK'
        stylePreset,     // e.g., 'studio'
        productName,     // e.g., 'Brightening Serum'
        customAction     // Optional custom action override
    } = options

    const global = GLOBAL_LOCKS[globalLock]
    const bg = BACKGROUNDS[background]
    const nicheAdapter = NICHE_ADAPTERS[niche]
    const scene = SCENE_TEMPLATES[sceneType]
    const style = STYLE_PRESETS[stylePreset]

    // Select appropriate action
    const action = customAction || scene.actions[0]
    const nicheAction = nicheAdapter.actions.find(a =>
        sceneType === 'HOOK' ? a.includes('holding') :
            sceneType === 'BENEFIT' ? a.includes('showing') || a.includes('reading') :
                sceneType === 'DEMO' ? a.includes('applying') || a.includes('demonstrating') :
                    a.includes('smile') || a.includes('gesture')
    ) || nicheAdapter.actions[0]

    // Build comprehensive prompt
    const prompt = [
        // Subject with consistency lock
        `${global.subject}, ${global.consistency}`,

        // Environment
        `in ${bg}`,

        // Action specific to scene and niche
        `${action}, ${nicheAction}`,

        // Product integration
        `holding ${productName}, ${nicheAdapter.productFocus}`,

        // Expression and atmosphere
        `${nicheAdapter.expressions}, ${nicheAdapter.atmosphere}`,

        // Camera work
        `${scene.cameraWork.movement}, ${scene.cameraWork.composition}, ${scene.cameraWork.angle}`,

        // Style and lighting
        `${style.camera}, ${style.lighting}`,

        // Color and quality
        `${nicheAdapter.colorGrading}, ${global.lighting}, ${global.quality}`,

        // Scene purpose
        scene.promptSuffix
    ].join(', ')

    return {
        prompt,
        duration: scene.duration,
        sceneType,
        negativePrompt: "blurry, distorted face, extra limbs, unnatural pose, overexposed, underexposed, pixelated"
    }
}

/**
 * Generate complete storyboard prompts for all scenes
 */
export function generateStoryboard(options) {
    const { globalLock, background, niche, stylePreset, productName } = options
    const scenes = ['HOOK', 'BENEFIT', 'DEMO', 'CTA']

    return scenes.map((sceneType, index) => ({
        sceneNumber: index + 1,
        ...generateVideoPrompt({
            globalLock,
            background,
            niche,
            sceneType,
            stylePreset,
            productName
        })
    }))
}

/**
 * Example usage and output
 */
export const EXAMPLE_PROMPTS = {
    herbal_scene1_hook: `Young Indonesian woman, fair skin (kulit sawo matang cerah), natural black hair, oval face with soft features, consistent facial features throughout, same person, same appearance, in bright minimalist kitchen, white cabinets with wood accents, natural light from window, clean marble countertop, indoor plants visible, looking directly at camera with friendly smile, holding product gently near face, holding Vitamin C Serum, natural organic product packaging, herbal ingredients visible, fresh and clean aesthetic, healthy radiant skin, refreshed expression, genuine satisfaction, natural glow, fresh, clean, natural, wellness-focused ambiance, static or subtle zoom in, medium close-up, face clearly visible, eye-level, slightly elevated for flattering angle, locked tripod shot, smooth professional movement, professional ring light, even illumination, catch lights in eyes, natural green and earth tones, fresh and vibrant colors, clean whites, cinematic lighting with soft key light and subtle fill, warm color temperature, 4k resolution, photorealistic, high detail, professional video quality, engaging with viewer, direct eye contact, inviting expression`,

    herbal_scene2_benefit: `Young Indonesian woman, fair skin (kulit sawo matang cerah), natural black hair, oval face with soft features, consistent facial features throughout, same person, same appearance, in bright minimalist kitchen, white cabinets with wood accents, natural light from window, demonstrating product feature with hands, reading product label with interest, holding Vitamin C Serum, natural organic product packaging, healthy radiant skin, genuine satisfaction, slow pan right or left, medium shot, product clearly visible, demonstrating benefit, focused on product, natural presentation, professional studio lighting, 4k resolution, natural green and earth tones`,

    fashion_scene1_hook: `Young Indonesian woman, medium tan skin, natural black hair, round face with warm expression, consistent facial features throughout, in modern Indonesian living room, minimalist decor, soft natural daylight, looking directly at camera with confident pose, fabric flowing with natural movement, holding Batik Dress, detailed fabric texture, elegant stitching visible, premium material quality, confident pose, elegant demeanor, fashionable attitude, stylish premium aspirational aesthetic, static or subtle zoom in, medium close-up, face clearly visible, cinematic color grading, rich saturated colors, fashion editorial look, 4k resolution, engaging with viewer, direct eye contact, inviting expression`,

    elektronik_scene3_demo: `Young Indonesian man, fair skin, short neat black hair, clean-shaven, friendly expression, consistent facial features throughout, in professional studio setup, clean white background, ring light illumination, demonstrating key feature with finger gesture, showing screen display to camera, holding Wireless Earbuds Pro, sleek gadget design, screen illumination, premium build quality, focused attention, impressed reaction, tech-savvy confidence, modern sleek premium tech aesthetic, close-up with subtle follow focus, close-up on product interaction, smooth dolly movement, shallow depth of field, cool blue tones, high contrast, cinematic tech commercial look, 4k resolution, product in action, detailed view, authentic usage demonstration`
}
