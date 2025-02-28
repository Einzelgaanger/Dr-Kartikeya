class PatientDashboard {
    constructor() {
        this.currentUser = StorageManager.getItem('currentUser');
        this.selectedDate = null;
        this.init();
    }

    init() {
        // Initialize date picker
        this.initializeDatePicker();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Load initial appointments
        this.loadAppointments();
    }

    initializeEventListeners() {
        // Book appointment button
        const bookBtn = document.getElementById('bookAppointmentBtn');
        if (bookBtn) {
            bookBtn.addEventListener('click', () => this.showAppointmentModal());
        }

        // Close modal button
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeModal());
        });

        // Modal background close
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        });

        // Appointment form
        const appointmentForm = document.getElementById('appointmentForm');
        if (appointmentForm) {
            appointmentForm.addEventListener('submit', (e) => this.handleAppointmentSubmit(e));
        }

        // Date selection
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            dateInput.addEventListener('change', (e) => {
                this.selectedDate = e.target.value;
                this.loadTimeSlots(e.target.value);
            });
        }
    }

    showAppointmentModal() {
        console.log('Showing appointment modal'); // Debug log
        const modal = document.getElementById('appointmentModal');
        if (modal) {
            // Reset form
            const form = modal.querySelector('form');
            if (form) form.reset();

            // Clear any previously selected time slots
            document.querySelectorAll('.time-slot.selected').forEach(slot => {
                slot.classList.remove('selected');
            });

            // Set min date to today
            const dateInput = modal.querySelector('#appointmentDate');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.min = today;
                dateInput.value = today;
                this.selectedDate = today;
                this.loadTimeSlots(today);
            }

            modal.style.display = 'block';
        } else {
            console.error('Appointment modal not found');
        }
    }

    loadTimeSlots(date) {
        console.log('Loading time slots for:', date); // Debug log
        const timeSlotsContainer = document.getElementById('timeSlots');
        if (!timeSlotsContainer) return;

        // Get doctor's working hours and blocked times
        const workingHours = StorageManager.getItem('doctorHours') || {};
        const blockedTimes = StorageManager.getItem('blockedTimes') || [];
        const appointments = StorageManager.getItem('appointments') || [];

        const dayOfWeek = new Date(date).toLocaleLowerCase('en-US', { weekday: 'long' });
        const dayHours = workingHours[dayOfWeek];

        if (!dayHours || !dayHours.length) {
            timeSlotsContainer.innerHTML = '<p>No available appointments for this day</p>';
            return;
        }

        // Generate time slots
        const slots = this.generateTimeSlots(dayHours[0], dayHours[1]);
        
        // Filter out blocked and booked slots
        const unavailableSlots = new Set([
            ...blockedTimes.filter(bt => bt.day === dayOfWeek).map(bt => bt.time),
            ...appointments
                .filter(apt => apt.date === date)
                .flatMap(apt => apt.timeSlots)
        ]);

        timeSlotsContainer.innerHTML = slots.map(time => `
            <button class="time-slot ${unavailableSlots.has(time) ? 'unavailable' : ''}"
                    data-time="${time}"
                    ${unavailableSlots.has(time) ? 'disabled' : ''}
                    onclick="patientDashboard.toggleTimeSlot(this)">
                ${time}
            </button>
        `).join('');
    }

    toggleTimeSlot(element) {
        if (!element.classList.contains('unavailable')) {
            element.classList.toggle('selected');
        }
    }

    generateTimeSlots(start, end) {
        const slots = [];
        let current = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);

        while (current < endTime) {
            slots.push(current.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }));
            current.setMinutes(current.getMinutes() + 30);
        }

        return slots;
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showAlert(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        alertDiv.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }

    loadAppointments() {
        const appointments = StorageManager.getItem('appointments');
        const appointmentsList = document.getElementById('appointmentsList');
        appointmentsList.innerHTML = '';

        // Filter appointments for current user
        const userAppointments = {
            pending: appointments.pending.filter(apt => apt.patientId === this.currentUser.id),
            upcoming: appointments.upcoming.filter(apt => apt.patientId === this.currentUser.id),
            treatment: appointments.treatment.filter(apt => apt.patientId === this.currentUser.id),
            treated: appointments.treated.filter(apt => apt.patientId === this.currentUser.id)
        };

        if (Object.values(userAppointments).flat().length === 0) {
            appointmentsList.innerHTML = '<p>No appointments found</p>';
            return;
        }

        // Display appointments by status
        Object.entries(userAppointments).forEach(([status, apts]) => {
            if (apts.length > 0) {
                const statusSection = document.createElement('div');
                statusSection.className = 'status-section';
                statusSection.innerHTML = `
                    <h3>${status.charAt(0).toUpperCase() + status.slice(1)}</h3>
                    ${apts.map(apt => this.createAppointmentCard(apt, status)).join('')}
                `;
                appointmentsList.appendChild(statusSection);
            }
        });
    }

    createAppointmentCard(appointment, status) {
        return `
            <div class="appointment-card">
                <div class="appointment-header">
                    <h4>Appointment #${appointment.id}</h4>
                    <span class="status ${status}">${status}</span>
                </div>
                <div class="appointment-details">
                    <p><strong>Issue:</strong> ${appointment.issue}</p>
                    ${this.renderAppointmentTimes(appointment, status)}
                    <p><strong>Created:</strong> ${new Date(appointment.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        `;
    }

    renderAppointmentTimes(appointment, status) {
        if (status === 'pending') {
            return `
                <div class="preferred-times">
                    <p><strong>Preferred Time Slots:</strong></p>
                    <ul>
                        ${appointment.preferredSlots.map(slot => `
                            <li>${slot.day.charAt(0).toUpperCase() + slot.day.slice(1)} at ${slot.time}</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        } else {
            return `
                <p><strong>Confirmed Time:</strong> 
                   ${appointment.confirmedSlot.day.charAt(0).toUpperCase() + 
                     appointment.confirmedSlot.day.slice(1)} at ${appointment.confirmedSlot.time}</p>
            `;
        }
    }

    handleAppointmentSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const reason = form.querySelector('[name="appointmentReason"]').value.trim();
        const selectedSlots = Array.from(
            document.querySelectorAll('.time-slot.selected')
        ).map(slot => slot.dataset.time);

        if (!selectedSlots.length) {
            this.showAlert('Please select at least one time slot', 'error');
            return;
        }

        if (!reason) {
            this.showAlert('Please provide a reason for the appointment', 'error');
            return;
        }

        const appointmentData = {
            patientId: this.currentUser.id,
            patientName: this.currentUser.name,
            date: this.selectedDate,
            timeSlots: selectedSlots,
            reason: reason
        };

        this.saveAppointment(appointmentData);
    }

    async saveAppointment(appointmentData) {
    showAlert(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        alertDiv.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        document.body.appendChild(alertDiv);
        
        // Remove alert after 5 seconds
        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Initialize dashboard
let patientDashboard;
document.addEventListener('DOMContentLoaded', () => {
    patientDashboard = new PatientDashboard();
}); 