document.addEventListener("DOMContentLoaded", function () {
    const chatbotContainer = document.getElementById("chatbot-container");
    const closeBtn = document.getElementById("close-btn");
    const sendBtn = document.getElementById("send-btn");
    const chatBotInput = document.getElementById("chatbot-input");
    const chatbotMessages = document.getElementById("chatbot-messages");
    const chatbotIcon = document.getElementById("chatbot-icon");

    // ✅ Use existing buttons
    const voiceToggleBtn = document.getElementById("voice-toggle");
    const micBtn = document.getElementById("mic-btn");

    let voiceEnabled = true;
    voiceToggleBtn.addEventListener("click", () => {
        voiceEnabled = !voiceEnabled;
        voiceToggleBtn.innerHTML = voiceEnabled
            ? '<i class="fa-solid fa-volume-high"></i>'
            : '<i class="fa-solid fa-volume-xmark"></i>';

        if (!voiceEnabled && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    });

    let recognizing = false;
    let recognition;

    if ("webkitSpeechRecognition" in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            recognizing = true;
            micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatBotInput.value = transcript;
            sendMessage(); 
        };

        recognition.onerror = (event) => {
            console.error("Recognition error:", event.error);
        };

        recognition.onend = () => {
            recognizing = false;
            micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        };
    } else {
        micBtn.disabled = true;
        micBtn.title = "Speech Recognition not supported";
    }

    micBtn.addEventListener("click", () => {
        if (recognition) {
            if (recognizing) recognition.stop();
            else recognition.start();
        }
    });

    // 🔘 Chatbot open/close
    chatbotIcon.addEventListener("click", () => {
        chatbotContainer.classList.add("visible");
        chatbotIcon.style.display = "none";
        appendMessage("bot", "Hello! I'm the JohnAvenell.com AI assistant. How can I help you today?");
    });

    closeBtn.addEventListener("click", () => {
        chatbotContainer.classList.remove("visible");
        chatbotIcon.style.display = "flex";
    });

    sendBtn.addEventListener("click", sendMessage);
    chatBotInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    // Send message
    function sendMessage() {
        const userMessage = chatBotInput.value.trim();
        if (userMessage) {
            appendMessage("user", userMessage);
            chatBotInput.value = "";
            getBotResponse(userMessage);
        }
    }

    // Append message to chat
    function appendMessage(sender, message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender);
        messageElement.textContent = message;
        chatbotMessages.appendChild(messageElement);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        // Voice Output
        if (sender === "bot" && voiceEnabled) {
            speak(message);
        }
    }

    // Text-to-Speech
    function speak(text) {
        if ("speechSynthesis" in window) {
            // Agar pehle se koi speech chal rahi hai, cancel karo
            window.speechSynthesis.cancel();

            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = "en-US"; // Hindi ke liye "hi-IN"

            // Agar user ne beech me 🔇 kar diya, turant stop
            utter.onstart = () => {
                if (!voiceEnabled) {
                    window.speechSynthesis.cancel();
                }
            };

            window.speechSynthesis.speak(utter);
        }
    }

    // Get Bot Response from Gemini
    async function getBotResponse(userMessage) {
        const context = `
JohnAvenell.com: Company Profile
JohnAvenell.com Singapore-based ek naya SME (Small and Medium-sized Enterprise) hai jo businesses ke liye AI software aur mobile applications provide karta hai. Iska main focus Australia aur New Zealand ke markets mein customer base banana hai.

Contact Information:
Company Name: JohnAvenell.com
Website: https://JohnAvenell.com
Location: Singapore
Contact Person: John Avenell
Email: johnavenell@gmail.com
Phone: +61 490 087 769

Products:
1. AI Voice – inbound/outbound calls handle karta hai (200 inquiries ek saath). 
2. AI Business Profile Scanner – Google Business Profiles ko improve karta hai.
3. AI Leads Generator – social media aur telecom se leads generate karta hai.
4. AI Influencers & Chatbots – virtual representatives banata hai.

Business Model:
Singapore-based Private Limited Company, remote team Philippines me.
        `;

        // const API_KEY = "YOUR_API_KEY"; // 🔑 apna Gemini API key daalo
                    const API_KEY =  "AIzaSyDpHPZ0WBSChjhSbEVGtYt2tZT-HfcihDc";
                     // Replace with your actual API key

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

        const prompt = `
You are a helpful and professional chatbot for JohnAvenell.com.
Here is the company information you should use to answer questions:
${context}
Do not make up any information. If a question is outside the scope of the provided information, politely state that you can only answer questions related to JohnAvenell.com. One thing that is must, your response must be according to the mood of the user like if user is sad then you have to respond in a way that will make him happy. and if user is happy then you have to respond in a way that will keep him happy. if user is angry then you have to respond in a way that will make him calm.and this is must.
User Question: ${userMessage}
Answer clearly and concisely.
`;

        appendMessage("bot", "Thinking...");

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            });

            const data = await response.json();

            const botMessageElement = chatbotMessages.lastChild;
            if (botMessageElement && botMessageElement.textContent === "Thinking...") {
                botMessageElement.remove();
            }

            if (!data.candidates || !data.candidates.length || !data.candidates[0].content) {
                throw new Error("No valid response from Gemini API");
            }

            const botMessage = data.candidates[0].content.parts[0].text;
            appendMessage("bot", botMessage);
        } catch (error) {
            console.error("Error:", error);
            const botMessageElement = chatbotMessages.lastChild;
            if (botMessageElement && botMessageElement.textContent === "Thinking...") {
                botMessageElement.remove();
            }
            appendMessage("bot", "Sorry, I'm having trouble responding. Please try again.");
        }
    }
});
