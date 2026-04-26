# 🌊 Beneath the Panic

*A Real-Time Adaptive Survival Game with Machine Learning*

---

## 📌 Overview

**Beneath the Panic** is a browser-based survival game that explores the psychology of fear and control under extreme conditions.
The player progresses through three intense phases — escaping collapse, sinking into water, and navigating the unknown depths.

What makes this project unique is its **real-time adaptive AI system**, powered by an in-browser machine learning model that continuously learns from player behavior and dynamically adjusts the game difficulty.

---

## 🚀 Features

### 🎮 Gameplay

* 3 immersive levels:

  * **Bridge Escape** – avoid collapse and falling debris
  * **Sinking Phase** – manage oxygen and panic
  * **Underwater Depths** – exploration, puzzles, and survival
* Smooth player movement and physics
* Environmental hazards and dynamic obstacles
* Interactive puzzle system

---

### 🧠 AI / Machine Learning

* Real-time player behavior tracking:

  * Panic level
  * Oxygen level
  * Movement speed
* On-device ML model (no backend required)
* Continuous training during gameplay
* Dynamic difficulty adjustment:

  * Struggling player → easier gameplay
  * Skilled player → harder challenges

---

### 🎧 Immersion

* Dynamic sound effects (heartbeat, impact tones)
* Panic-based visual effects
* Atmospheric lighting and underwater visuals

---

## 🛠️ Technologies Used

* **HTML5 Canvas** – rendering and game visuals
* **CSS3** – UI and visual effects
* **JavaScript (Vanilla)** – game logic and mechanics
* **TensorFlow.js** – in-browser machine learning

---

## ⚙️ How It Works

1. The game continuously collects player performance data
2. Data is used to train a lightweight neural network
3. The model predicts player performance in real-time
4. Difficulty is adjusted dynamically:

   * Enemy speed
   * Oxygen drain
   * Environmental pressure

---

## 🧪 AI Model Details

* Input features:

  * Panic (normalized)
  * Oxygen (normalized)
  * Movement speed
* Output:

  * Player performance score (0 → struggling, 1 → strong)
* Model type:

  * Feedforward Neural Network
* Training:

  * Runs periodically during gameplay

---

## ▶️ How to Run

1. Download or clone the repository
2. Open the `.html` file in any modern browser
3. Ensure internet connection (for TensorFlow.js CDN)
4. Start the game and play

---

## 🎯 Controls

* **Move Left/Right:** Arrow Keys / A, D
* **Jump:** Space / Up Arrow
* **Interact:** E
* **Boost (panic risk):** Shift

---

## 💡 Inspiration

This project is inspired by the idea that panic, not environment, is often the real enemy.
The adaptive AI reflects how difficulty in life often scales with how we respond under pressure.

---

## 🔮 Future Improvements

* Advanced reinforcement learning model
* Save/load player behavior profiles
* Multiplayer adaptive experience
* Visual AI analytics dashboard

---

## 🏁 Conclusion

**Beneath the Panic** is not just a game — it's an experiment in combining emotional storytelling with adaptive AI systems.
It demonstrates how machine learning can enhance user experience in real-time interactive environments.

---

## 👩‍💻 Author

Developed by Ayesha

---

## 📜 License

This project is open-source and available for educational and non-commercial use.
