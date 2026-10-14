# [Artifex — AI-Powered Canvas](https://artifex-rose.vercel.app/)

**Turn your handwritten math into intelligent solutions.**

Artifex is an interactive, AI-powered mathematical workspace that lets you draw equations, sketch diagrams, assign variables, and solve problems directly on a digital canvas. Instead of typing complicated mathematical expressions, simply draw them and let AI interpret your work and return the results.

---

<p align="center">
<a  href="https://artifex-rose.vercel.app/">
    <img src="/UI/Canvas.png" alt="UI" ">
</a>
</p>

## 🚀 Overview

Artifex combines an interactive drawing canvas with Google's Gemini AI to create a more natural way to explore and solve mathematical problems.

Draw an expression, equation, or graphical problem on the canvas, click **Calculate**, and Artifex sends the drawing to its backend for AI-powered analysis. The interpreted expressions and results are then displayed in a dedicated results panel.

Whether you're solving a quick arithmetic problem, working with variables, or exploring a visual math problem, Artifex makes the process intuitive and interactive.

## ✨ Features

- **✍️ Interactive Math Canvas** — Write and sketch mathematical expressions using a freehand drawing tool.
- **🧠 AI-Powered Problem Solving** — Use Google Gemini to interpret handwritten equations and analyze mathematical problems.
- **➕ Multiple Math Expressions** — Process arithmetic expressions, equations, variable assignments, and visual math problems.
- **🔺 Shape Drawing Tools** — Draw circles, squares, and triangles to represent geometric and graphical problems.
- **🎨 Customizable Drawing** — Choose colors and adjust brush and eraser sizes.
- **↩️ Undo & Redo** — Correct mistakes and restore previous canvas states.
- **🧹 Clear Canvas** — Start fresh whenever you want.
- **📊 Calculation Results Panel** — View interpreted expressions and their corresponding results in a dedicated panel.
- **🔢 Variable Tracking** — Preserve assigned variable values for use in subsequent calculations.
- **⚡ Responsive Canvas** — Draw using mouse or touch interactions.
- **🌐 Dedicated Landing Page** — Explore the project through a separate landing page before entering the application.

---

## 🛠️ Tech Stack

### Frontend

- **React 18** — Component-based user interface.
- **TypeScript** — Type safety and maintainable code.
- **Vite** — Development server and production build tooling.
- **Tailwind CSS** — Utility-first styling.
- **Mantine UI** — UI components and theming.
- **Framer Motion** — Animations and interactive visual effects.
- **Lucide React** — Icons.
- **Axios** — HTTP communication with the backend.
- **React Router** — Client-side navigation.

### Backend

- **Python** — Backend application logic.
- **FastAPI** — REST API development.
- **Uvicorn** — ASGI server.
- **Google Gemini API** — AI-powered interpretation and problem solving.
- **Pillow (PIL)** — Image decoding and processing.
- **Python-dotenv** — Environment variable management.

### AI & Processing

- **Gemini Flash** — Analyzes canvas images containing handwritten expressions, equations, and visual problems.
- **Base64 Image Encoding** — Transfers the canvas image from the frontend to the backend.
- **Python AST Parsing** — Parses the model's structured response into Python data structures.
- **Contextual Variable Handling** — Passes previously assigned variable values to the AI during subsequent calculations.

---

## ⚙️ How It Works

Artifex connects an interactive drawing interface to an AI-powered calculation pipeline.

1. **Draw:** Write an equation, expression, or graphical problem on the canvas.
2. **Capture:** The frontend captures the canvas content as a PNG image.
3. **Send:** Axios sends the image and the current variable dictionary to the FastAPI backend.
4. **Analyze:** The backend decodes the image and passes it to the Gemini model with instructions for interpreting and solving the problem.
5. **Process:** The backend parses the AI response and prepares structured results.
6. **Display:** The frontend displays the expressions and results in the calculation panel.
7. **Reuse Variables:** When the response contains variable assignments, the frontend updates its variable dictionary for subsequent calculations.

---

## 📂 Project Structure

```text
Artifex/
│
├── CalcAI/                       # React + TypeScript frontend
│   ├── public/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── screens/
│   │   │   ├── home/             # Interactive math canvas
│   │   │   └── landing/          # Landing page
│   │   ├── constants/            # Frontend constants
│   │   ├── App.tsx               # Application routes
│   │   └── main.tsx              # Frontend entry point
│   ├── package.json
│   └── vite.config.ts
│
├── CalcAI_BE/                    # Python backend
│   ├── apps/
│   │   └── calculator/
│   │       ├── route.py          # Calculation API endpoint
│   │       └── utils.py          # Image analysis and AI logic
│   ├── main.py                   # FastAPI application
│   ├── constants.py              # Server and API configuration
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=39FF14&center=true&width=435&lines=Thank+You+For+Checking+!">
</p>
