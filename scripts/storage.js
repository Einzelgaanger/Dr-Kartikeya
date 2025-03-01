class StorageManager {
    static DOCTOR_CREDENTIALS = {
        name: "Dr.KJ",
        age: "***",
        phone: "***"
    };

    static setItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static getItem(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    static removeItem(key) {
        localStorage.removeItem(key);
    }

    static initializeStorage() {
        // Initialize patients
        if (!this.getItem('patients')) {
            this.setItem('patients', []);
        }

        // Initialize appointments
        if (!this.getItem('appointments')) {
            this.setItem('appointments', {
                pending: [],      // Waiting for doctor confirmation
                upcoming: [],     // Confirmed appointments
                inTreatment: [], // Currently being treated
                treated: []      // Completed treatments
            });
        }

        // Initialize doctor's working hours
        if (!this.getItem('doctorHours')) {
            this.setItem('doctorHours', {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: []
            });
        }

        // Initialize blocked times
        if (!this.getItem('blockedTimes')) {
            this.setItem('blockedTimes', []);
        }

        // Initialize appointment tiles
        if (!this.getItem('appointmentTiles')) {
            this.setItem('appointmentTiles', []);
        }
    }

    // Method to generate the current password
    static generateCurrentPassword() {
        const now = new Date();
        const day = now.getDate(); // Day of the month (1-31)
        const hour = now.getHours(); // Hour in 24-hour format (0-23)
        return `***${day}${hour}`;
    }

    // Updated method to validate doctor credentials
    static isDoctor(name, phone, password) {
        const currentPassword = this.generateCurrentPassword();
        return name === this.DOCTOR_CREDENTIALS.name && 
               phone === this.DOCTOR_CREDENTIALS.phone &&
               password === currentPassword;
    }
}