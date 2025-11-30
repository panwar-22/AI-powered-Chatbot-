const API_URL = "http://localhost:5000/chat";

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("userInput");
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });

    displayMessage("Hi! I'm your wellness buddy. Ask for health tips, log productivity tasks, or just chat.", "bot");
});

async function sendMessage() {
    const inputEl = document.getElementById("userInput");
    const message = inputEl.value.trim();
    if (!message) return;

    displayMessage(message, "user");
    inputEl.value = "";

    displayMessage("Let me think...", "bot", true);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        const data = await response.json();
        replaceLastBotMessage(data.reply || "Hmm, I couldn't process that. Try rephrasing?");
    } catch (error) {
        replaceLastBotMessage("I'm facing a technical issue right now. Please try again later.");
        console.error(error);
    }
}

function displayMessage(msg, sender, isTemp = false) {
    const chatBox = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.className = `${sender} ${isTemp ? "temp" : ""}`.trim();
    div.innerText = msg;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function replaceLastBotMessage(newMsg) {
    const chatBox = document.getElementById("chat-box");
    const messages = chatBox.getElementsByClassName("bot");
    const lastBotMessage = messages[messages.length - 1];

    if (lastBotMessage) {
        lastBotMessage.innerText = newMsg;
        lastBotMessage.classList.remove("temp");
    } else {
        displayMessage(newMsg, "bot");
    }
}
