# 🗳️ CivicGuide AI

**Your Personal Voting Assistant**

🔗 **Live App:** [civicguide-ai-election.web.app](https://civicguide-ai-election.web.app)

Voting shouldn't feel confusing. But let's be real, between registration deadlines, ID requirements, mail ballot requests, and early voting windows, it's easy to lose track of what you need to do and when you need to do it. That's exactly why CivicGuide AI exists.

CivicGuide AI is a free, non-partisan chatbot that walks you through every step of the voting process based on your state and how you want to vote. No accounts, no data collection, no political bias. Just clear answers.

## What It Actually Does

You open it up, tell it your state and whether you're voting in person or by mail, and it builds you a personalized roadmap. Not a generic "go register" kind of thing. It gives you the actual deadlines for your state, the exact documents you'll need, links to your state's official portal, and countdown timers so you know how much time you've got left.

Here's the kind of stuff it covers:

- **Registration deadlines** with direct links to check your status or register online
- **Mail-in / absentee ballot steps** including request deadlines, how to fill it out properly, and return options
- **Early voting windows** so you can skip the Election Day rush
- **Election Day checklist** with polling place lookup, ID requirements, and what to do if something goes wrong at the polls
- **Same-day registration info** for states that support it
- **State-specific notes** like ranked-choice voting in Alaska and Maine, all-mail states like Oregon and Colorado, or North Dakota's no-registration setup

## Why This Matters

Every election cycle, millions of people miss their chance to vote over stuff that's totally avoidable. They didn't know the registration deadline passed. They forgot to request their mail ballot. They showed up without the right ID. CivicGuide AI is built to prevent all of that.

It's especially helpful if you're:

- A **first-time voter** who has no idea where to start
- Someone who **moved to a new state** and doesn't know the local rules yet
- A **busy person** who just needs a quick, clear checklist without digging through government websites
- Anyone who wants to **vote by mail** but isn't sure about the timeline or process

## How to Use It

1. Head over to [civicguide-ai-election.web.app](https://civicguide-ai-election.web.app)
2. The chatbot will greet you and ask for your state and voting method
3. You can type naturally (like "I'm in Texas and want to vote in person") or use the quick reply buttons
4. It generates your personalized voting roadmap with all relevant milestones
5. Click on any milestone to get detailed, step-by-step instructions
6. Follow the links to your state's official election portal to take action

That's it. No sign-up, no email, no tracking.

## Built-In Safeguards

A couple of things that make this different from a random voting FAQ page:

**Completely neutral.** If you try asking it who to vote for or mention any political party or candidate, it politely redirects you. It's a logistics tool, not a persuasion tool.

**Security-first.** All user input is sanitized against XSS and injection attacks. There's rate limiting to prevent spam. The app runs entirely in your browser with no backend and no data ever leaves your device.

**50-state + DC coverage.** Every US state has different rules, and CivicGuide AI has data for all of them, sourced from vote.org, usa.gov, and individual Secretary of State websites.

## Coverage

All 50 US states and the District of Columbia are supported, with data tailored for the **2026 Midterm Elections** (Election Day: November 3, 2026). The dataset includes:

| Data Point | Description |
|---|---|
| Registration deadlines | Days before Election Day, by state |
| Online registration | Whether your state supports it |
| Same-day registration | States where you can register at the polls |
| Absentee/mail ballot deadlines | Request cutoff dates |
| Early voting windows | How many days before Election Day |
| ID requirements | What you need to bring to vote |
| Official portals | Direct links to register, check status, find polling places |

## Tech Stack

This is a lightweight, static web app. No frameworks, no build tools, no server.

- **HTML5** with semantic structure and accessibility attributes
- **Vanilla CSS** with animations, glassmorphism, and responsive design
- **Vanilla JavaScript** using a state machine architecture for conversation flow
- **Firebase Hosting** for deployment

## Project Structure

```
Promptwar/
├── index.html              # Main app shell
├── css/
│   └── style.css           # All styling, animations, responsive design
├── js/
│   ├── data.js             # 50-state election dataset
│   ├── security.js         # Input sanitization, rate limiting, XSS prevention
│   ├── utils.js            # Date formatting, markdown parsing, helpers
│   ├── chatbot.js          # Conversation engine (state machine)
│   └── app.js              # UI controller, message rendering, event handling
└── assets/
    └── favicon.svg         # App icon
firebase.json               # Firebase Hosting configuration
```

## Run It Locally

Just open `Promptwar/index.html` in any modern browser. That's literally it. No npm install, no build step.

If you want to use a local server (for stricter CSP testing):

```bash
npx serve Promptwar
```

## Deploy Your Own

Make sure you have the [Firebase CLI](https://firebase.google.com/docs/cli) installed and a Firebase project set up.

```bash
firebase login
firebase init hosting
firebase deploy --only hosting
```

## Disclaimer

CivicGuide AI is an informational tool. Election rules change, and while the data here is carefully researched, you should always double-check deadlines and requirements with your local election authority before relying on any of it. The app does not collect, store, or transmit any personal data.

## License

MIT
