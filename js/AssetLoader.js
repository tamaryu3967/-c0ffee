export class AssetLoader {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.assets = {
            images: {},
            audio: {}
        };
    }

    /**
     * Load all assets defined in the manifest.
     * @param {Object} manifest - { images: { key: url }, audio: { key: url } }
     * @returns {Promise} Resolves when all critical assets are loaded (or failed safely).
     */
    async loadAll(manifest) {
        const imagePromises = Object.entries(manifest.images || {}).map(([key, url]) =>
            this.loadImage(key, url)
        );

        const audioPromises = Object.entries(manifest.audio || {}).map(([key, url]) =>
            this.loadAudio(key, url)
        );

        // Wait for all promises to settle (resolve or reject)
        // We use allSettled to prevent one failure from blocking the entire app
        await Promise.allSettled([...imagePromises, ...audioPromises]);

        console.log('AssetLoader: Loading complete', this.assets);
        return this.assets;
    }

    loadImage(key, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets.images[key] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`AssetLoader: Failed to load image ${key} at ${url}`);
                // Resolve anyway to continue loading other assets
                resolve(null);
            };
            img.src = url;
        });
    }

    async loadAudio(key, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();

            // If AudioContext is not ready (e.g. suspended), we can still decode?
            // decodeAudioData returns a promise
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.assets.audio[key] = audioBuffer;
            return audioBuffer;
        } catch (error) {
            console.warn(`AssetLoader: Failed to load audio ${key} at ${url}`, error);
            return null;
        }
    }

    getAudio(key) {
        return this.assets.audio[key];
    }

    getImage(key) {
        return this.assets.images[key];
    }
}
