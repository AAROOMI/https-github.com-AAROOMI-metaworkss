
import type { StoryScenario } from '../types';

export const storyScenarios: StoryScenario[] = [
    {
        id: 'scenario-ceo-urgent',
        title: "The CEO's Urgent Request",
        description: "It's late on a Thursday. You receive an urgent email from the CEO asking for immediate assistance with a payment. What do you do?",
        coverImage: "https://images.unsplash.com/photo-1557568192-2fa698f6d63e?auto=format&fit=crop&q=80&w=800",
        difficulty: "Easy",
        initialSceneId: "scene-1",
        scenes: [
            {
                id: "scene-1",
                title: "The Inbox Notification",
                narrative: "You are about to pack up for the day when a notification pops up. Subject: 'URGENT: Vendor Payment Overdue'. The sender name says 'John Doe (CEO)'.\n\n'Hi,\nI'm in a meeting with a key vendor and my banking token isn't working. I need you to process a wire transfer of $15,000 immediately to account #998877 to keep the supply chain moving. I'll authorize it formally when I get out. Do this now.'\n\nWhat is your immediate reaction?",
                imageUrl: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&q=80&w=800",
                choices: [
                    {
                        text: "Reply immediately to confirm you are on it.",
                        nextSceneId: "scene-fail-reply",
                        feedback: "You engaged with the attacker. This confirms your email is active and you are willing to help.",
                        isCorrect: false
                    },
                    {
                        text: "Process the payment. It's the CEO, you can't delay.",
                        nextSceneId: "scene-fail-pay",
                        feedback: "You fell for the urgency trap. Bypassing procedure for 'executives' is a classic social engineering vulnerability.",
                        isCorrect: false
                    },
                    {
                        text: "Check the sender's actual email address.",
                        nextSceneId: "scene-investigate",
                        feedback: "Good instinct! Always verify the source, not just the display name.",
                        isCorrect: true
                    }
                ]
            },
            {
                id: "scene-investigate",
                title: "The Closer Look",
                narrative: "You hover over 'John Doe (CEO)'. The actual email address reveals itself as <john.doe.ceo@gmail.com>, not your company domain (@techcorp.com). This is definitely suspicious.",
                imageUrl: "https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&q=80&w=800",
                choices: [
                    {
                        text: "Forward it to the IT Security team immediately.",
                        nextSceneId: "scene-success",
                        feedback: "Perfect. Reporting is the best defense.",
                        isCorrect: true
                    },
                    {
                        text: "Reply asking 'Is this really you?'",
                        nextSceneId: "scene-fail-reply",
                        feedback: "Never reply to a suspicious email. It validates your address to the scammer.",
                        isCorrect: false
                    }
                ]
            },
            {
                id: "scene-fail-reply",
                title: "Hook, Line, and Sinker",
                narrative: "The attacker replies instantly: 'Yes, it is me. Why are you questioning me? The vendor is waiting. Process it now or I will have to speak to your manager.'\n\nThe pressure mounts. You feel intimidated.",
                imageUrl: "https://images.unsplash.com/photo-1580983218765-f663bec07b37?auto=format&fit=crop&q=80&w=800",
                choices: [
                    {
                        text: "Apologize and process the payment.",
                        nextSceneId: "scene-fail-pay",
                        feedback: "Intimidation is a key tool for social engineers.",
                        isCorrect: false
                    },
                    {
                        text: "Stop. Call the CEO on his official office number.",
                        nextSceneId: "scene-success-call",
                        feedback: "Excellent recovery. Out-of-band verification saves the day.",
                        isCorrect: true
                    }
                ]
            },
            {
                id: "scene-fail-pay",
                title: "Money Gone",
                narrative: "You process the wire transfer. The next morning, the real CEO walks in and asks why $15,000 was sent to an account in the Cayman Islands. The money is unrecoverable. You have fallen victim to Business Email Compromise (BEC).",
                imageUrl: "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&q=80&w=800",
                choices: [] // End of path
            },
            {
                id: "scene-success",
                title: "Threat Neutralized",
                narrative: "IT Security confirms it was a phishing attempt targeting the finance department. They block the sender domain and alert the company. Your vigilance saved the company $15,000.",
                imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800",
                choices: [] // End of path
            },
            {
                id: "scene-success-call",
                title: "Verification Complete",
                narrative: "You call the CEO. He picks up and says, 'What email? I'm having dinner with my family.' You realized the email was fake. You report it to IT.",
                imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
                choices: [] // End of path
            }
        ]
    },
    {
        id: 'scenario-lost-usb',
        title: "The Mysterious Drive",
        description: "You find a USB drive in the parking lot labeled 'Executive Salaries 2024'. Curiosity strikes. What is your move?",
        coverImage: "https://images.unsplash.com/photo-1606229338636-214a8b2f26bd?auto=format&fit=crop&q=80&w=800",
        difficulty: "Medium",
        initialSceneId: "usb-1",
        scenes: [
            {
                id: "usb-1",
                title: "The Discovery",
                narrative: "Walking into the office, you spot a silver USB drive on the ground near the entrance. It has a label: 'Q1 Executive Bonuses'. It looks brand new.",
                imageUrl: "https://images.unsplash.com/photo-1599307086850-93bf24a30e48?auto=format&fit=crop&q=80&w=800",
                choices: [
                    {
                        text: "Pick it up and plug it into your work laptop to see who it belongs to.",
                        nextSceneId: "usb-fail-plug",
                        feedback: "Curiosity killed the cat... and the network.",
                        isCorrect: false
                    },
                    {
                        text: "Pick it up and give it to the reception/security desk.",
                        nextSceneId: "usb-success",
                        feedback: "Safe choice. Let physical security handle lost items.",
                        isCorrect: true
                    },
                    {
                        text: "Leave it there.",
                        nextSceneId: "usb-ignore",
                        feedback: "Safe for you, but risky if someone else picks it up.",
                        isCorrect: true
                    }
                ]
            },
            {
                id: "usb-fail-plug",
                title: "Malware Deployment",
                narrative: "The moment you plug it in, nothing happens on screen. However, in the background, a script executes (Rubber Ducky attack), installing a keylogger and opening a reverse shell to an attacker. Your machine is compromised.",
                imageUrl: "https://images.unsplash.com/photo-1555532538-dcdbd01d373d?auto=format&fit=crop&q=80&w=800",
                choices: []
            },
            {
                id: "usb-success",
                title: "Secure Disposal",
                narrative: "Security takes the drive. They scan it on an isolated, air-gapped machine and find it was loaded with malware. Your action prevented a breach.",
                imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=800",
                choices: []
            },
            {
                id: "usb-ignore",
                title: "The Bystander",
                narrative: "You walk past. Later, you hear that an intern plugged it in and crashed the HR server. While you are safe, reporting it would have been better.",
                imageUrl: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&q=80&w=800",
                choices: []
            }
        ]
    }
];
