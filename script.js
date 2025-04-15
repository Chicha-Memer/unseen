// Store countdowns and notes in localStorage
const STORAGE_KEY = {
    COUNTDOWNS: 'countdowns',
    NOTES: 'calendar_notes'
};

// Initialize data from localStorage or create empty arrays
let countdowns = JSON.parse(localStorage.getItem(STORAGE_KEY.COUNTDOWNS) || '[]');
let calendarNotes = JSON.parse(localStorage.getItem(STORAGE_KEY.NOTES) || '{}');

// Current date for calendar
let currentDate = new Date();

// DOM Elements
const countdownForm = document.getElementById('countdown-form');
const countdownsContainer = document.getElementById('countdowns');
const calendarDaysContainer = document.getElementById('calendar-days');
const calendarMonthElement = document.getElementById('calendar-month');
const noteModal = document.getElementById('note-modal');
const countdownModal = document.getElementById('countdown-modal');
const selectedDateElement = document.getElementById('selected-date');
const noteTextArea = document.getElementById('note-text');

// Event Listeners
document.getElementById('add-countdown-btn').addEventListener('click', () => {
    countdownModal.classList.add('active');
});

document.getElementById('cancel-countdown').addEventListener('click', () => {
    countdownModal.classList.remove('active');
    countdownForm.reset();
});

countdownForm.addEventListener('submit', createCountdown);
document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
document.getElementById('cancel-note').addEventListener('click', closeNoteModal);
document.getElementById('save-note').addEventListener('click', saveNote);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === countdownModal) {
        countdownModal.classList.remove('active');
        countdownForm.reset();
    }
    if (e.target === noteModal) {
        closeNoteModal();
    }
});

// Initialize the app
function init() {
    renderCountdowns();
    renderCalendar();
    startCountdownUpdates();
}

// Countdown Functions
function createCountdown(e) {
    e.preventDefault();
    
    const name = document.getElementById('countdown-name').value;
    const datetime = document.getElementById('countdown-datetime').value;
    const imageFile = document.getElementById('countdown-image').files[0];
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            addCountdown(name, datetime, e.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        addCountdown(name, datetime);
    }
    
    countdownForm.reset();
    countdownModal.classList.remove('active');
}

function addCountdown(name, datetime, imageUrl = null) {
    const countdown = {
        id: Date.now(),
        name,
        targetDate: new Date(datetime).getTime(),
        imageUrl
    };
    
    countdowns.push(countdown);
    saveCountdowns();
    renderCountdowns();
}

function saveCountdowns() {
    localStorage.setItem(STORAGE_KEY.COUNTDOWNS, JSON.stringify(countdowns));
}

function renderCountdowns() {
    countdownsContainer.innerHTML = '';
    
    countdowns = countdowns.filter(countdown => {
        const timeLeft = countdown.targetDate - Date.now();
        return timeLeft > 0;
    });
    
    countdowns.forEach(countdown => {
        const card = createCountdownCard(countdown);
        countdownsContainer.appendChild(card);
    });
    
    saveCountdowns();
}

function createCountdownCard(countdown) {
    const card = document.createElement('div');
    card.className = 'countdown-card';
    if (countdown.imageUrl) {
        card.style.backgroundImage = `url(${countdown.imageUrl})`;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    
    const title = document.createElement('h3');
    title.className = 'countdown-title';
    title.textContent = countdown.name;
    
    const timer = document.createElement('div');
    timer.className = 'countdown-timer';
    timer.dataset.targetDate = countdown.targetDate;
    
    overlay.appendChild(title);
    overlay.appendChild(timer);
    card.appendChild(overlay);
    
    updateCountdownTimer(timer);
    
    return card;
}

function updateCountdownTimer(timerElement) {
    const targetDate = parseInt(timerElement.dataset.targetDate);
    const now = Date.now();
    const timeLeft = targetDate - now;
    
    if (timeLeft <= 0) {
        timerElement.innerHTML = '<div>Countdown ended</div>';
        return false;
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    const timeUnits = [
        { value: days, label: 'Days' },
        { value: hours, label: 'Hours' },
        { value: minutes, label: 'Mins' },
        { value: seconds, label: 'Secs' }
    ];
    
    timerElement.innerHTML = timeUnits.map(unit => `
        <div class="timer-item">
            <div class="timer-value">${unit.value}</div>
            <div class="timer-label">${unit.label}</div>
        </div>
    `).join('');
    
    return true;
}

function startCountdownUpdates() {
    setInterval(() => {
        const timerElements = document.querySelectorAll('.countdown-timer');
        timerElements.forEach(timer => {
            if (!updateCountdownTimer(timer)) {
                renderCountdowns(); // Re-render if any countdown has ended
            }
        });
    }, 1000);
}

// Calendar Functions
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    calendarMonthElement.textContent = new Date(year, month, 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const lastDay = new Date(year, month, lastDate).getDay();
    
    calendarDaysContainer.innerHTML = '';
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const prevDate = new Date(year, month, -i);
        addCalendarDay(prevDate, 'other-month');
    }
    
    // Current month days
    for (let i = 1; i <= lastDate; i++) {
        const date = new Date(year, month, i);
        addCalendarDay(date);
    }
    
    // Next month days
    for (let i = 1; i < 7 - lastDay; i++) {
        const nextDate = new Date(year, month + 1, i);
        addCalendarDay(nextDate, 'other-month');
    }
}

function addCalendarDay(date, extraClass = '') {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${extraClass}`;
    dayElement.textContent = date.getDate();
    
    const dateString = date.toISOString().split('T')[0];
    if (calendarNotes[dateString]) {
        dayElement.classList.add('has-note');
    }
    
    dayElement.addEventListener('click', () => openNoteModal(date));
    calendarDaysContainer.appendChild(dayElement);
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

// Note Functions
function openNoteModal(date) {
    const dateString = date.toISOString().split('T')[0];
    selectedDateElement.textContent = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    noteTextArea.value = calendarNotes[dateString] || '';
    noteModal.classList.add('active');
    noteTextArea.dataset.date = dateString;
}

function closeNoteModal() {
    noteModal.classList.remove('active');
}

function saveNote() {
    const dateString = noteTextArea.dataset.date;
    const noteText = noteTextArea.value.trim();
    
    if (noteText) {
        calendarNotes[dateString] = noteText;
    } else {
        delete calendarNotes[dateString];
    }
    
    localStorage.setItem(STORAGE_KEY.NOTES, JSON.stringify(calendarNotes));
    renderCalendar();
    closeNoteModal();
}

// Initialize the app
init(); 