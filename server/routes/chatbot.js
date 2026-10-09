// server/routes/chatbot.js
const express = require('express');
const router = express.Router();

// Simple multilingual FAQ map (you can expand)
const faq = {
  en: {
    "hello": "Hello! I'm legalBot. How can I help you?",
    "hi": "Hello! I'm legalBot. How can I help you?",
    "hey": "Hello! I'm legalBot. How can I help you?",
    "hii": "Hello! I'm legalBot. How can I help you?",
    "hlo": "Hello! I'm legalBot. How can I help you?",
    "hello": "Hello! I'm legalBot. How can I help you?",
    "what is legal ecosystem": "The Legal Ecosystem helps predict case priority and hearing allotment using an AI model.",
    "how to i upload a new case": "Login and go to the file upload section in the dashboard. Select your document and submit.",
    "how to track complaints or check complaint's status": "First of all head towadrs the main home page over there you would find an option for Track Complaint , click on that and fill all the complaint details and you would get what you want.",
    "default": "Sorry, I didn't understand. Please ask in simple words like 'how to upload a case' or 'what is Legal Ecosystem'."
  },
  hi: {
    "नमस्ते": "नमस्ते! मैं legalBot हूँ। मैं आपकी कैसे मदद कर सकता/सकती हूँ?",
    "लीगल इकोसिस्टम क्या है": "लीगल इकोसिस्टम एक AI सिस्टम है जो केस की प्राथमिकता और सुनवाई की तारीख तय करने में मदद करता है।",
    "केस कैसे अपलोड करें": "लॉगिन करने के बाद डैशबोर्ड में फाइल अपलोड सेक्शन पर जाएँ और अपनी फाइल सबमिट करें।",
    "default": "माफ़ करें, मैं समझ नहीं पायी/पाया। कृपया सरल शब्दों में पूछें।",
    "शिकायत कैसे दर्ज करें": `होम पेज पर जाएँ → 'File Complaint' विकल्प चुनें → आवश्यक विवरण भरकर शिकायत दर्ज करें।`,
    
     "स्टेटस कैसे चेक करें": "शिकायत स्टेटस देखने के लिए 'Track Complaint' विकल्प का उपयोग करें।",
  },
  hinglish: {
    "hi": "Namaste! Main legalBot hoon. Kaise madad karu?",
    "hello": "Namaste! Main legalBot hoon. Kaise madad karu?",
    "hii": "Namaste! Main legalBot hoon. Kaise madad karu?",
    "hey": "Namaste! Main legalBot hoon. Kaise madad karu?",
    "hlo": "Namaste! Main legalBot hoon. Kaise madad karu?",
    "namaste": "Namaste! Main legalBot hoon. Kaise madad karu?",
    "legal ecosystem kya hai": "Legal Ecosystem ek AI system hai jo case priority aur hearing date allotment mein madad karta hai.",
    "case kaise upload kare": "Login kar ke dashboard -> upload section pe jao, file choose karo aur submit karo.",
    "complaint status kese check kre": "complaint check krne k liye pehle home page k chle jaye fir Track Complaint option p click kr k detailes fill kr de.",
    "default": "Sorry mitar, samajh nahi aaya. Kripya simple shabd mein poochho."
  }
};

// simple detection
function detectLang(text) {
  if (!text) return 'en';
  // if contains Devanagari -> hindi
  if (/[ऀ-ॿ]/.test(text)) return 'hi';
  // some hinglish words detection
  const low = text.toLowerCase();
  const hingWords = ['kaise','kya','kab','kyu','hai','nahi','mujhe','mera','meri','karna','kar'];
  for (const w of hingWords) if (low.includes(w)) return 'hinglish';
  // default English
  return 'en';
}

router.post('/chat', (req, res) => {
  try {
    const message = (req.body.message || '').trim();
    const langHint = req.body.lang || null; // optional override from frontend
    const lang = langHint || detectLang(message);
    const map = faq[lang] || faq['en'];

    const low = message.toLowerCase();
    // find best match by substring (simple & fast)
    let reply = map.default;
    for (const key of Object.keys(map)) {
      if (key === 'default') continue;
      if (low.includes(key)) { reply = map[key]; break; }
    }
    // return reply
    return res.json({ reply, lang });
  } catch (err) {
    console.error("Chatbot error:", err);
    return res.status(500).json({ reply: "Server error" });
  }
});

module.exports = router;
