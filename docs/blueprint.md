# **App Name**: GeoGuard

## Core Features:

- Public Decoy Display: Display decoy coordinates on a public map, fetched in real-time from Firestore.
- Secure Login: Allow secure login for commanders and sub-commanders, with different authentication methods.
- Real-time Unit Tracking: Visualize military unit positions on a map in real-time.
- Target Assignment: Enable the supreme commander to assign operation targets to specific units.
- Secure Mode Toggle: Switch between displaying real or encrypted coordinates for units.
- Decoy Coordinate Generation Tool: Tool to generate decoy coordinates using a multi-layered encryption algorithm, logged for auditing. It will use the LLM to make a decision as to how closely each 'honeypot' will resemble an original objective based on contextual data.
- Unit Management: Create, manage, and delete military units and their assigned commanders.

## Style Guidelines:

- Primary color: Dark blue (#1A237E) to convey trust and authority.
- Background color: Very dark gray (#121212) to provide a high-contrast, distraction-free environment, optimized for map viewing and focus.
- Accent color: Electric lime green (#BEF264) to highlight critical information and interactive elements; CTAs, secure/unsecure toggles.
- Body and headline font: 'Inter', sans-serif, for a modern, neutral, and machined feel, providing maximum legibility of the many labels, names, alerts and targets on-screen.
- Use clear, minimalist icons to represent military units and objectives. Actionable icons (delete, move etc.) can use the lime green accent color.
- A clear and efficient layout is important. Use a sidebar for controls and a main map area for visualization.
- Subtle animations when generating new decoy coordinates to give life to this crucial system function, such as cross-fades on new coordinates in the Encryption Log Panel.