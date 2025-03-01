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

    static isDoctor(name, phone) {
        return name === this.DOCTOR_CREDENTIALS.name && 
               phone === this.DOCTOR_CREDENTIALS.phone;
    }
} 