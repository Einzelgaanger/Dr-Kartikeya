class StorageManager {
    static setItem(key, value) {
        try {
            // Check if localStorage is available
            if (!this.isStorageAvailable()) {
                throw new Error('localStorage is not available');
            }

            // Validate inputs
            if (!key || typeof key !== 'string') {
                throw new Error('Invalid storage key');
            }

            // Serialize value
            const serializedValue = JSON.stringify(value);
            
            // Attempt to save
            localStorage.setItem(key, serializedValue);
            
            // Verify save was successful
            const savedValue = localStorage.getItem(key);
            if (!savedValue) {
                throw new Error('Value was not saved correctly');
            }

            return true;
        } catch (error) {
            console.error('StorageManager setItem error:', error);
            return false;
        }
    }

    static getItem(key) {
        try {
            // Check if localStorage is available
            if (!this.isStorageAvailable()) {
                throw new Error('localStorage is not available');
            }

            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('StorageManager getItem error:', error);
            return null;
        }
    }

    static removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    static isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
} 