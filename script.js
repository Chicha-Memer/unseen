// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        navbar.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !navbar.classList.contains('scroll-down')) {
        // Scroll Down
        navbar.classList.remove('scroll-up');
        navbar.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && navbar.classList.contains('scroll-down')) {
        // Scroll Up
        navbar.classList.remove('scroll-down');
        navbar.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

// Add animation to elements when they come into view
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.tokenomics-card, .feature-card');
    
    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementPosition < windowHeight - 100) {
            element.classList.add('animate');
        }
    });
};

window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);

// Connect Wallet Button Functionality
const connectWalletBtn = document.querySelector('.btn-secondary');
if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
        // This is a placeholder for actual wallet connection logic
        alert('Wallet connection functionality would be implemented here');
    });
}

// Buy Now Button Functionality
const buyNowBtn = document.querySelector('.btn-primary');
if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
        // This is a placeholder for actual buy functionality
        alert('Buy functionality would be implemented here');
    });
}

// Store countdowns and notes in localStorage
const STORAGE_KEY = {
    COUNTDOWNS: 'countdowns',
    NOTES: 'calendar_notes',
    THEME: 'theme'
};

// Initialize data from localStorage or create empty arrays
let countdowns = JSON.parse(localStorage.getItem(STORAGE_KEY.COUNTDOWNS) || '[]');
let calendarNotes = JSON.parse(localStorage.getItem(STORAGE_KEY.NOTES) || '{}');
let currentTheme = localStorage.getItem(STORAGE_KEY.THEME) || 'light';

// Current date for calendar
let currentDate = new Date();

// DOM Elements
const countdownForm = document.getElementById('countdown-form');
const countdownsContainer = document.getElementById('countdowns');
const calendarDaysContainer = document.getElementById('calendar-days');
const calendarMonthElement = document.getElementById('calendar-month');
const noteModal = document.getElementById('note-modal');
const countdownModal = document.getElementById('countdown-modal');
const deleteModal = document.getElementById('delete-modal');
const selectedDateElement = document.getElementById('selected-date');
const noteTextArea = document.getElementById('note-text');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const themeButtons = document.querySelectorAll('.theme-btn');

// Initialize theme
document.documentElement.setAttribute('data-theme', currentTheme);

// Theme switching
themeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const theme = button.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY.THEME, theme);
    });
});

// Search and filter functionality
function filterCountdowns() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;
    
    const filteredCountdowns = countdowns.filter(countdown => {
        const matchesSearch = countdown.name.toLowerCase().includes(searchTerm);
        const matchesFilter = filterValue === 'all' || 
            (filterValue === 'active' && countdown.targetDate > Date.now()) ||
            (filterValue === 'completed' && countdown.targetDate <= Date.now());
        
        return matchesSearch && matchesFilter;
    });
    
    renderCountdowns(filteredCountdowns);
}

searchInput.addEventListener('input', filterCountdowns);
filterSelect.addEventListener('change', filterCountdowns);

// Drag and drop functionality
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('over');
}

function handleDragLeave() {
    this.classList.remove('over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('over');
    
    if (draggedItem !== this) {
        const countdownsArray = Array.from(countdownsContainer.children);
        const draggedIndex = countdownsArray.indexOf(draggedItem);
        const dropIndex = countdownsArray.indexOf(this);
        
        // Reorder countdowns array
        const [movedItem] = countdowns.splice(draggedIndex, 1);
        countdowns.splice(dropIndex, 0, movedItem);
        
        // Save and re-render
        saveCountdowns();
        renderCountdowns();
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.countdown-card').forEach(card => {
        card.classList.remove('over');
    });
}

// Initialize the app
function init() {
    renderCountdowns();
    renderCalendar();
    startCountdownUpdates();
    setupDragAndDrop();
}

function setupDragAndDrop() {
    document.querySelectorAll('.countdown-card').forEach(card => {
        card.setAttribute('draggable', true);
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);
    });
}

// Countdown Functions
function createCountdown(e) {
    e.preventDefault();
    
    const name = document.getElementById('countdown-name').value;
    const datetime = document.getElementById('countdown-datetime').value;
    const imageFile = document.getElementById('countdown-image').files[0];
    const category = document.getElementById('countdown-category').value;
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            addCountdown(name, datetime, e.target.result, category);
        };
        reader.readAsDataURL(imageFile);
    } else {
        addCountdown(name, datetime, null, category);
    }
    
    countdownForm.reset();
    countdownModal.classList.remove('active');
}

function addCountdown(name, datetime, imageUrl = null, category = 'general') {
    const countdown = {
        id: Date.now(),
        name,
        targetDate: new Date(datetime).getTime(),
        imageUrl,
        category
    };
    
    countdowns.push(countdown);
    saveCountdowns();
    renderCountdowns();
}

function saveCountdowns() {
    localStorage.setItem(STORAGE_KEY.COUNTDOWNS, JSON.stringify(countdowns));
}

function renderCountdowns(countdownsToRender = countdowns) {
    countdownsContainer.innerHTML = '';
    
    countdownsToRender.forEach(countdown => {
        const card = createCountdownCard(countdown);
        countdownsContainer.appendChild(card);
    });
    
    setupDragAndDrop();
}

function createCountdownCard(countdown) {
    const card = document.createElement('div');
    card.className = 'countdown-card';
    card.dataset.category = countdown.category;
    
    if (countdown.imageUrl) {
        card.style.backgroundImage = `url(${countdown.imageUrl})`;
    }
    
    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-countdown';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete countdown';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        countdownToDelete = countdown.id;
        deleteModal.classList.add('active');
    });
    
    const overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    
    const title = document.createElement('h3');
    title.className = 'countdown-title';
    title.textContent = countdown.name;
    
    const category = document.createElement('span');
    category.className = 'countdown-category';
    category.textContent = countdown.category;
    
    const timer = document.createElement('div');
    timer.className = 'countdown-timer';
    timer.dataset.targetDate = countdown.targetDate;
    
    overlay.appendChild(title);
    overlay.appendChild(category);
    overlay.appendChild(timer);
    card.appendChild(deleteBtn);
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
        timerElement.parentElement.parentElement.classList.add('countdown-complete');
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