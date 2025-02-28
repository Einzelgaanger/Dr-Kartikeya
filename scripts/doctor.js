class DoctorDashboard {
    constructor() {
        this.appointments = StorageManager.getItem('appointments');
        this.workingHours = StorageManager.getItem('doctorHours');
        this.blockedTimes = StorageManager.getItem('blockedTimes') || [];
        this.currentAppointment = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAppointments('pending');
        this.updateCounts();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Working hours button
        document.getElementById('setHoursBtn').addEventListener('click', () => {
            this.showWorkingHoursModal();
        });

        // Working hours form
        document.getElementById('workingHoursForm').addEventListener('submit', (e) => {
            this.saveWorkingHours(e);
        });

        // Treatment form
        document.getElementById('treatmentForm')?.addEventListener('submit', (e) => {
            this.saveTreatment(e);
        });

        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            StorageManager.removeItem('currentUser');
            window.location.href = '../index.html';
        });
    }

    loadAppointments(status) {
        const list = document.getElementById('appointmentsList');
        list.innerHTML = '';

        if (!this.appointments[status].length) {
            list.innerHTML = `<p class="no-appointments">No ${status} appointments</p>`;
            return;
        }

        this.appointments[status].forEach(apt => {
            list.appendChild(this.createAppointmentCard(apt, status));
        });
    }

    createAppointmentCard(appointment, status) {
        const card = document.createElement('div');
        card.className = 'appointment-card';

        let actionButton = '';
        if (status === 'pending') {
            actionButton = `
                <button class="primary-btn" onclick="doctorDashboard.showConfirmationModal('${appointment.id}')">
                    Confirm Appointment
                </button>
            `;
        } else if (status === 'upcoming' || status === 'treatment') {
            actionButton = `
                <button class="primary-btn" onclick="doctorDashboard.showTreatmentModal('${appointment.id}')">
                    Update Treatment
                </button>
            `;
        }

        card.innerHTML = `
            <div class="appointment-header">
                <h3>${appointment.patientName}</h3>
                <span class="status-badge ${status}">${status}</span>
            </div>
            <div class="appointment-details">
                <p><strong>Issue:</strong> ${appointment.issue}</p>
                ${this.renderAppointmentTimes(appointment, status)}
                <p><strong>Created:</strong> ${new Date(appointment.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="appointment-actions">
                ${actionButton}
            </div>
        `;

        return card;
    }

    renderAppointmentTimes(appointment, status) {
        if (status === 'pending') {
            return `
                <div class="preferred-times">
                    <p><strong>Preferred Time Slots:</strong></p>
                    <ul>
                        ${appointment.preferredSlots.map(slot => `
                            <li>${slot.day.charAt(0).toUpperCase() + slot.slice(1)} at ${slot.time}</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        return `
            <p><strong>Confirmed Time:</strong> 
               ${appointment.confirmedSlot.day.charAt(0).toUpperCase() + 
                 appointment.confirmedSlot.day.slice(1)} at ${appointment.confirmedSlot.time}</p>
        `;
    }

    showConfirmationModal(appointmentId) {
        const appointment = this.appointments.pending.find(apt => apt.id === parseInt(appointmentId));
        if (!appointment) return;

        this.currentAppointment = appointment;
        const modal = document.getElementById('confirmationModal');
        const slotsList = document.getElementById('preferredSlotsList');
        
        document.getElementById('confirmPatientName').textContent = appointment.patientName;
        document.getElementById('confirmPatientIssue').textContent = appointment.issue;

        slotsList.innerHTML = appointment.preferredSlots.map(slot => `
            <button class="time-slot-btn" onclick="doctorDashboard.selectConfirmationSlot(this, '${slot.day}', '${slot.time}')">
                ${slot.day.charAt(0).toUpperCase() + slot.day.slice(1)} at ${slot.time}
            </button>
        `).join('');

        modal.style.display = 'block';
    }

    selectConfirmationSlot(element, day, time) {
        document.querySelectorAll('.time-slot-btn').forEach(btn => 
            btn.classList.remove('selected'));
        element.classList.add('selected');
        this.selectedSlot = { day, time };
    }

    confirmAppointment() {
        if (!this.selectedSlot) {
            alert('Please select a time slot');
            return;
        }

        // Remove from pending
        this.appointments.pending = this.appointments.pending.filter(
            apt => apt.id !== this.currentAppointment.id
        );

        // Add to upcoming
        const confirmedAppointment = {
            ...this.currentAppointment,
            confirmedSlot: this.selectedSlot,
            status: 'upcoming',
            confirmedAt: new Date().toISOString()
        };
        this.appointments.upcoming.push(confirmedAppointment);

        // Block the time slot
        this.blockedTimes.push({
            ...this.selectedSlot,
            appointmentId: this.currentAppointment.id
        });

        // Update storage
        StorageManager.setItem('appointments', this.appointments);
        StorageManager.setItem('blockedTimes', this.blockedTimes);

        this.closeAllModals();
        this.loadAppointments('pending');
        this.updateCounts();
    }

    showTreatmentModal(appointmentId) {
        const status = ['upcoming', 'treatment'].find(status => 
            this.appointments[status].some(apt => apt.id === parseInt(appointmentId))
        );

        const appointment = this.appointments[status].find(apt => apt.id === parseInt(appointmentId));
        if (!appointment) return;

        this.currentAppointment = appointment;
        const modal = document.getElementById('treatmentModal');

        document.getElementById('patientName').textContent = appointment.patientName;
        document.getElementById('patientIssue').textContent = appointment.issue;

        modal.style.display = 'block';
    }

    saveTreatment(e) {
        e.preventDefault();

        const treatmentUpdate = {
            id: Date.now(),
            patientId: this.currentAppointment.id,
            prescription: document.getElementById('prescription').value,
            recommendations: document.getElementById('recommendations').value,
            createdAt: new Date().toISOString()
        };

        // Move to treatment if from upcoming
        if (this.currentAppointment.status === 'upcoming') {
            this.appointments.upcoming = this.appointments.upcoming.filter(
                apt => apt.id !== this.currentAppointment.id
            );
            this.currentAppointment.status = 'treatment';
            this.appointments.treatment.push(this.currentAppointment);
        }

        // Save treatment update
        const tiles = StorageManager.getItem('appointmentTiles') || [];
        tiles.push(treatmentUpdate);
        StorageManager.setItem('appointmentTiles', tiles);
        StorageManager.setItem('appointments', this.appointments);

        this.closeAllModals();
        this.loadAppointments(this.currentAppointment.status);
        this.updateCounts();
    }

    markAsTreated() {
        // Move from treatment to treated
        this.appointments.treatment = this.appointments.treatment.filter(
            apt => apt.id !== this.currentAppointment.id
        );
        this.currentAppointment.status = 'treated';
        this.currentAppointment.completedAt = new Date().toISOString();
        this.appointments.treated.push(this.currentAppointment);

        StorageManager.setItem('appointments', this.appointments);

        this.closeAllModals();
        this.loadAppointments('treatment');
        this.updateCounts();
    }

    showWorkingHoursModal() {
        const modal = document.getElementById('workingHoursModal');
        
        // Initialize tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchModalTab(btn.dataset.tab);
            });
        });

        // Load default hours
        this.loadDefaultHours();
        
        // Initialize block time tab
        this.initializeBlockTimeTab();
        
        modal.style.display = 'block';
    }

    loadDefaultHours() {
        const daysGrid = document.querySelector('.days-grid');
        daysGrid.innerHTML = Object.entries(this.workingHours).map(([day, hours]) => `
            <div class="day-input">
                <div class="day-header">
                    <h3>${day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                </div>
                <div class="time-inputs">
                    <input type="time" 
                           name="${day}_start" 
                           value="${hours[0] || ''}"
                           onchange="doctorDashboard.updateDefaultHours('${day}')">
                    <span>to</span>
                    <input type="time" 
                           name="${day}_end" 
                           value="${hours[1] || ''}"
                           onchange="doctorDashboard.updateDefaultHours('${day}')">
                </div>
            </div>
        `).join('');
    }

    updateDefaultHours(day) {
        const start = document.querySelector(`input[name="${day}_start"]`).value;
        const end = document.querySelector(`input[name="${day}_end"]`).value;

        if (start && end) {
            if (start >= end) {
                alert('End time must be after start time');
                return;
            }

            this.workingHours[day] = [start, end];
            StorageManager.setItem('doctorHours', this.workingHours);
            
            // Clean up any blocked times outside new working hours
            this.cleanupBlockedTimes(day);
            
            this.showSuccessMessage('Working hours updated successfully');
        }
    }

    initializeBlockTimeTab() {
        const daySelect = document.getElementById('blockDaySelect');
        daySelect.innerHTML = '<option value="">Choose a day</option>' +
            Object.entries(this.workingHours)
                .filter(([_, hours]) => hours.length)
                .map(([day, _]) => `
                    <option value="${day}">
                        ${day.charAt(0).toUpperCase() + day.slice(1)}
                    </option>
                `).join('');

        daySelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadBlockTimeSlots(e.target.value);
            }
        });
    }

    loadBlockTimeSlots(day) {
        const container = document.getElementById('availableTimeSlots');
        const hours = this.workingHours[day];
        
        if (!hours || !hours.length) {
            container.innerHTML = '<p>No working hours set for this day</p>';
            return;
        }

        const slots = this.generateTimeSlots(hours[0], hours[1]);
        container.innerHTML = slots.map(time => {
            const isBlocked = this.blockedTimes.some(
                blocked => blocked.day === day && blocked.time === time
            );
            return `
                <button class="time-slot ${isBlocked ? 'blocked' : ''}"
                        data-time="${time}"
                        ${isBlocked ? 'disabled' : ''}
                        onclick="doctorDashboard.toggleBlockedTime(this, '${day}', '${time}')">
                    ${time}
                </button>
            `;
        }).join('');

        this.updateBlockedSlotsList(day);
    }

    toggleBlockedTime(element, day, time) {
        element.classList.toggle('selected');
        
        if (element.classList.contains('selected')) {
            this.blockedTimes.push({ day, time });
        } else {
            this.blockedTimes = this.blockedTimes.filter(
                blocked => !(blocked.day === day && blocked.time === time)
            );
        }

        StorageManager.setItem('blockedTimes', this.blockedTimes);
        this.updateBlockedSlotsList(day);
    }

    updateBlockedSlotsList(day) {
        const container = document.getElementById('blockedSlotsList');
        const blockedForDay = this.blockedTimes.filter(time => time.day === day);

        if (blockedForDay.length === 0) {
            container.innerHTML = '<p>No blocked times for this day</p>';
            return;
        }

        container.innerHTML = blockedForDay.map(blocked => `
            <div class="blocked-slot-tag">
                ${blocked.time}
                <button onclick="doctorDashboard.unblockTime('${day}', '${blocked.time}')">×</button>
            </div>
        `).join('');
    }

    unblockTime(day, time) {
        this.blockedTimes = this.blockedTimes.filter(
            blocked => !(blocked.day === day && blocked.time === time)
        );
        StorageManager.setItem('blockedTimes', this.blockedTimes);
        
        // Refresh the display
        this.loadBlockTimeSlots(day);
    }

    showSuccessMessage(message) {
        const alert = document.createElement('div');
        alert.className = 'alert success';
        alert.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    generateTimeSlots(start, end) {
        const slots = [];
        let currentTime = new Date(`2024-01-01 ${start}`);
        const endTime = new Date(`2024-01-01 ${end}`);

        while (currentTime < endTime) {
            slots.push(currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }));
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }

        return slots;
    }

    updateCounts() {
        ['pending', 'upcoming', 'treatment', 'treated'].forEach(status => {
            const count = this.appointments[status].length;
            document.getElementById(`${status}Count`).textContent = count;
        });
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        this.loadAppointments(tab);
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    renderBlockedTimes(day) {
        const blockedForDay = this.blockedTimes.filter(time => time.day === day);
        if (blockedForDay.length === 0) return '';

        return `
            <div class="blocked-times-list">
                <h4>Blocked Times:</h4>
                ${blockedForDay.map(time => `
                    <div class="blocked-time-tag">
                        ${time.time}
                        <button onclick="doctorDashboard.unblockTime('${day}', '${time.time}')">
                            ×
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    switchModalTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        this.loadBlockTimeSlots(tab);
    }
}

// Initialize dashboard
let doctorDashboard;
document.addEventListener('DOMContentLoaded', () => {
    doctorDashboard = new DoctorDashboard();
}); 