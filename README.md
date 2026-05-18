# MafiaPedi2 🎙️🧠

Offline Persian Voice Recognition + Mafia Game Analyzer for Android

Built with:
- Kotlin
- Android Native
- Vosk Offline STT
- Coroutine Audio Engine
- Heuristic Suspicion AI

---

# Features

✅ Offline Persian Speech-To-Text  
✅ Real-time Voice Recognition  
✅ Live Partial Recognition  
✅ Mafia Dialogue Analyzer  
✅ Suspicion Engine  
✅ Speaker-based Speech Logs  
✅ No Internet Required  
✅ No VPN Required  
✅ Lightweight Persian Model  
✅ Designed for Mafia Party Games  

---

# Persian Vosk Model Download

This project requires the official Persian Vosk model.

Download:

- https://alphacephei.com/vosk/models/vosk-model-small-fa-0.5.zip

Official models page:

- https://alphacephei.com/vosk/models

Recommended model:

```text
vosk-model-small-fa-0.5
```

Approximate size:

```text
~50MB ZIP
~80MB Extracted
```

---

# Installation

## 1️⃣ Download Model

Download:

```text
vosk-model-small-fa-0.5.zip
```

Extract it.

---

## 2️⃣ Rename Folder

Rename extracted folder to:

```text
model-fa
```

---

## 3️⃣ Place Inside Android Assets

Final structure must be:

```text
app/src/main/assets/model-fa/
├── am/
├── conf/
├── graph/
├── ivector/
└── ...
```

⚠ IMPORTANT:

Do NOT create nested folders like:

```text
model-fa/vosk-model-small-fa-0.5/
```

Wrong ❌

Correct ✅:

```text
model-fa/am/
model-fa/conf/
...
```

---

# Required Dependencies

Add to:

```text
app/build.gradle
```

```gradle
implementation 'org.vosk:vosk-android:0.3.38'
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
```

---

# Required Permission

Inside:

```text
AndroidManifest.xml
```

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
```

---

# Project Structure

```text
app/
├── analyzer/
│   ├── HeuristicAnalyzer.kt
│   ├── SuspicionEngine.kt
│   └── DialogueAdvisor.kt
│
├── audio/
│   ├── AudioRecorder.kt
│   └── VoskManager.kt
│
├── graph/
│   ├── TargetGraph.kt
│   └── MafiaGraphView.kt
│
├── keyboard/
│   ├── MafiaKeyboardService.kt
│   ├── VoiceInputManager.kt
│   └── keyboard.xml
│
├── models/
│   ├── Player.kt
│   ├── SpeechLog.kt
│   └── GameState.kt
│
├── storage/
│   └── SaveManager.kt
│
└── ui/
    └── MainActivity.kt
```

---

# Voice Typing Keyboard

The project also supports:

✅ Offline Persian Voice Typing  
✅ Custom Android Keyboard  
✅ Live Dictation  
✅ Direct Text Input  

Powered by:

```text
InputMethodService + Vosk
```

---

# Notes

- Fully Offline
- No Cloud APIs
- No Audio Upload
- Designed for Persian Language
- Optimized for Mid-range Android Devices

---

# License

Open-source educational project.
