# 👁️‍🗨️ Drishti Sentinel - AI-Powered Security Dashboard

Drishti Sentinel is an advanced, real-time security monitoring application built with Next.js and powered by Google's Generative AI. It provides a centralized dashboard for monitoring multiple camera feeds, detecting security threats, and managing alerts.

PROJECT DOC: https://docs.google.com/document/d/1ajnRF7LXcZfz4Cuqkj3tHdLSpTDkYrIF3s2Jd7sRcPE/edit?usp=sharing

YOUTUBE LINK: https://youtu.be/6umZBk-aDpM

## Project Workflow

The application is designed to provide a seamless experience for security operators, from initial login to real-time threat analysis and response.

1.  **Authentication**: The application begins with a secure login page. Any credentials will grant access, and upon successful authentication, the user is redirected to the main dashboard.
2.  **Dashboard Overview**: The core of the application is the dashboard, which presents a comprehensive view of all security zones.
3.  **Live Camera Feeds**: The dashboard displays live video from multiple sources simultaneously:
    *   **Zone A**: Utilizes the local webcam.
    *   **Zone B**: Connects to an IP camera stream.
4.  **AI-Powered Analysis**: Drishti Sentinel leverages a suite of Genkit AI flows for advanced security analysis:
    *   **Anomaly Detection**: Manually trigger a scan on any feed to detect a wide range of anomalies, including fire, unusual crowd behavior, and potential threats.
    *   **Crowd Density**: Analyze headcounts across all zones to assess crowd levels and identify overcrowding risks.
    *   **Face Matching**: Upload a photo to scan for a person of interest specifically within Zone A.
5.  **Alert Management**:
    *   Detected threats generate real-time alerts, which are prioritized by risk level and displayed in the Centralized Alerts Panel.
    *   Critical and high-risk alerts automatically trigger an audible fire alarm sound.
    *   A prominent **SOS** button allows the operator to manually trigger a critical alert across all zones.
6.  **Zone Status**: A detailed table provides an at-a-glance overview of the current status, risk level, and last detected anomaly for each monitored zone.

USE THESE LINKS FOR TESTING:

FIRE: https://drive.google.com/file/d/1RZM5AQRK_uEvIskJLG_sl-lBmeGiverD/view?usp=sharing

BUILDING DESTRUCTION: https://youtu.be/MYQLMLt-R1s?si=3XedUZVz73WmGrmm 

## Tech Stack

Drishti Sentinel is built on a modern, robust tech stack designed for performance and scalability.

*   **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **UI Components**: [React](https://reactjs.org/), [ShadCN UI](https://ui.shadcn.com/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)
*   **Generative AI**: [Google AI](https://ai.google/) via [Genkit](https://firebase.google.com/docs/genkit)
*   **State Management**: React Context API for global state management.
*   **Data Validation**: [Zod](https://zod.dev/)
*   **Charts & Visualization**: [Recharts](https://recharts.org/)
*   **Audio**: [Tone.js](https://tonejs.github.io/) for generating audio alerts.

## Getting Started

Follow these instructions to get a local copy of Drishti Sentinel up and running.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Google AI API key:
    ```env
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Application

The application requires two processes to run concurrently: the Next.js frontend and the Genkit AI flows.

1.  **Start the Genkit development server:**
    Open a terminal and run the following command to start the Genkit flows and watch for changes:
    ```bash
    npm run genkit:watch
    ```

2.  **Start the Next.js development server:**
    In a separate terminal, run the following command to start the frontend application:
    ```bash
    npm run dev
    ```

3.  **Access the application:**
    Open your browser and navigate to [http://localhost:9002](http://localhost:9002) to view the application.
