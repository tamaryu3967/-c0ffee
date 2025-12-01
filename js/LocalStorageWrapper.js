export class LocalStorageWrapper {
    constructor(prefix = 'c0ffee_') {
        this.prefix = prefix;
    }

    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (e) {
            console.error('LocalStorageWrapper: Save failed', e);
            return false;
        }
    }

    load(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(this.prefix + key);
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (e) {
            console.error('LocalStorageWrapper: Load failed', e);
            return defaultValue;
        }
    }

    /**
     * Export all game data as a Base64 string.
     * @returns {string} Base64 encoded JSON
     */
    exportBackup() {
        try {
            const allData = {};
            // Collect all keys starting with prefix
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    const cleanKey = key.replace(this.prefix, '');
                    allData[cleanKey] = this.load(cleanKey);
                }
            }
            const json = JSON.stringify(allData);
            return btoa(unescape(encodeURIComponent(json))); // Handle UTF-8
        } catch (e) {
            console.error('LocalStorageWrapper: Export failed', e);
            return null;
        }
    }

    /**
     * Import game data from a Base64 string.
     * @param {string} code - Base64 encoded JSON
     * @returns {boolean} Success
     */
    importBackup(code) {
        try {
            const json = decodeURIComponent(escape(atob(code)));
            const data = JSON.parse(json);

            Object.entries(data).forEach(([key, value]) => {
                this.save(key, value);
            });
            return true;
        } catch (e) {
            console.error('LocalStorageWrapper: Import failed', e);
            return false;
        }
    }
}
