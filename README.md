🐾 PawSOS: Emergency Veterinary Response System

PawSOS is a mission-critical mobile application designed to bridge the gap between pet owners in crisis and a tiered network of veterinary volunteers. Built with React Native and Firebase, it provides a real-time "War Room" for animal emergencies.

🛠 Technologies
Frontend: React Native (Expo SDK)

State Management: React Hooks & Navigation Params

Backend: Firebase (Auth, Firestore, Cloud Messaging)

Navigation: React Navigation (Stack)

Styling: Custom Design System (Theme-based CSS-in-JS)

Calculations: Haversine Formula for real-time distance tracking

<p align="center">
  <video src="https://github.com/qhamietech/PawSOS/blob/main/PawSOS-Demo.mp4?raw=true" width="400" autoplay loop muted playsinline></video>
  <br>
  <strong>Real-time SOS Orchestration: Pet Owner (Left) vs. Volunteer Responder (Right)</strong>
</p>

✨ Core Features
Tiered Volunteer Verification: A custom RBAC (Role-Based Access Control) system categorizing rescuers into Student, Graduate, and Expert tiers.

Real-time SOS Orchestration: Live Firestore listeners that update owner clipboards instantly when a case is accepted.

CPR Metronome: A haptic and visual pulse tool to guide owners through emergency resuscitation.

Smart Triage Handoff: Allows students to stabilize a case before "Escalating" it to a senior vet for physical intervention.

Live Location Tracking: Dynamic distance calculation between the responder and the pet in distress.

⌨️ Keyboard Shortcuts (Development)
While running in the Expo development environment:

r - Reload the app.

d - Open the developer menu.

shift + i - Open iOS simulator.

shift + a - Open Android emulator.

🏗 The Process
Requirement Analysis: Identified the "Rescue Gap"—the terrifying minutes between an accident and arriving at a clinic.

Architecture Design: Designed a two-sided marketplace logic (Owner/Volunteer) with a focus on data integrity.

UI/UX Prototyping: Created a "Low-Stress" UI using dark-mode inspired primary colors (#1a1a2e) to keep users calm.

Implementation: Iterative development of the registration funnel followed by the real-time SOS logic.

🧠 What I Learned
Atomic State Management: How to handle complex object merging in multi-step registration forms.

Real-time Database Architecture: Designing Firestore schemas that minimize "Reads" while maintaining instant updates.

Asynchronous UX: Managing loading states and "optimistic UI" updates during high-stakes API calls.

🚧 Challenges I Faced
The "Leaky Data" Problem: Ensuring that a volunteer who switches tiers during registration doesn't leave trailing data (e.g., a Student ID remaining in a Qualified Vet's profile).

Navigation Hygiene: Managing the back-stack to prevent users from "backing" into a completed emergency or a registration form.

Device Permission Latency: Handling the asynchronous nature of requesting Push Notification tokens and Location permissions simultaneously.

✅ How I Overcame Them
Input Sanitization: Implemented a "Reset on Switch" logic in the VolunteerTierSelect screen to wipe state when a user changes their professional status.

Stack Reset: Utilized navigation.replace and custom initialRoute logic in the Navigator to strictly control the user journey.

Permission Guards: Created a robust registerForPushNotifications service that handles "Denied" or "Undetermined" statuses gracefully without crashing the app.

🚀 Future Improvements
Offline Mode: Implement redux-persist or AsyncStorage to allow owners to access first-aid guides even without a signal.

In-App Video Calls: Integration with Twilio or Daily.co for live video triage.

Pharmacy Integration: Using Map APIs to show the nearest 24/7 open veterinary pharmacies.

🏃‍♂️ How to Run the Project
Clone the Repo:

Bash

git clone https://github.com/yourusername/pawsos.git
Install Dependencies:

Bash

cd pawsos
npm install
Configure Firebase:

Create a project at Firebase Console.

Add your firebaseConfig.js to the root directory.

Start the App:

Bash

npx expo start
View the App: Scan the QR code with the Expo Go app on your phone 
or press i for the simulator.
