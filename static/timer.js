let timerDisplay = document.getElementById("timer");
let startBtn = document.getElementById("start-btn");
let resetBtn = document.getElementById("reset-btn");
let sessionLabel = document.getElementById("session-type");

let workTime = 25 * 60;
let breakTime = 5 * 60;
let currentTime = workTime;
let timer;
let isRunning = false;
let isWorkSession = true;

function updateDisplay(seconds) {
    let mins = Math.floor(seconds / 60);
    let secs = seconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timer = setInterval(() => {
            if (currentTime > 0) {
                currentTime--;
                updateDisplay(currentTime);
            } else {
                clearInterval(timer);
                isRunning = false;
                isWorkSession = !isWorkSession;
                currentTime = isWorkSession ? workTime : breakTime;
                sessionLabel.textContent = isWorkSession ? "Work Session" : "Break Time";
                alert("Session ended!");
                updateDisplay(currentTime);
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isWorkSession = true;
    currentTime = workTime;
    sessionLabel.textContent = "Work Session";
    updateDisplay(currentTime);
}

startBtn.addEventListener("click", startTimer);
resetBtn.addEventListener("click", resetTimer);

// Initial Display
updateDisplay(currentTime);
