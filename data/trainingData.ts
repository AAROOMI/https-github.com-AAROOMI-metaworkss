
import type { TrainingCourse } from '../types';

export const trainingCourses: TrainingCourse[] = [
  // Module 1
  {
    id: 'course-fundamentals',
    title: 'Cybersecurity Fundamentals',
    description: 'Start here. Learn the basic principles of cybersecurity, identify key assets, and understand the threat landscape.',
    standard: 'NCA ECC',
    badgeId: 'fundamentals-badge',
    lessons: [
      {
        id: 'fundamentals-l1',
        title: 'The CIA Triad: Core Principles',
        content: `
# Lesson 1: The CIA Triad

Welcome to Cybersecurity Fundamentals! The foundation of all information security is a model called the **CIA Triad**. It stands for Confidentiality, Integrity, and Availability. Understanding these three principles is the first step to thinking securely.

### Confidentiality
**Confidentiality is about keeping secrets.** It's the principle of ensuring that data is accessible only to authorized individuals. Think of it as digital privacy. Unauthorized disclosure of sensitive information is a breach of confidentiality.

*   **Example:** Your personal health records or the company's financial statements should only be visible to you and other authorized personnel.
*   **How we protect it:** Using strong passwords, encryption (scrambling data so it's unreadable without a key), and access control lists (defining who can see what).

### Integrity
**Integrity is about ensuring data is trustworthy and accurate.** It means preventing unauthorized modification or deletion of information. Data should be reliable and not tampered with.

*   **Example:** The amount of money in your bank account should not be alterable by an attacker. A project plan should not be changed without authorization.
*   **How we protect it:** Using file permissions, checksums (a digital fingerprint for data), version control systems, and blockchain technology.

### Availability
**Availability means that information and systems are accessible when needed by authorized users.** If you can't access your data or services, it's not useful and can halt business operations.

*   **Example:** You should be able to log in to the company's email system during work hours. Our public website must be accessible to customers.
*   **How we protect it:** Using backups, disaster recovery plans, redundant systems (like backup power generators), and protecting against Denial-of-Service (DoS) attacks.
`,
        quiz: {
          title: 'CIA Triad Quick Check',
          questions: [
            {
              question: 'Encrypting a hard drive primarily supports which principle?',
              options: ['Confidentiality', 'Integrity', 'Availability'],
              correctAnswer: 0,
            },
            {
              question: 'Using a digital signature to ensure a document has not been altered relates to which principle?',
              options: ['Confidentiality', 'Integrity', 'Availability'],
              correctAnswer: 1,
            },
             {
              question: 'Having a backup server that takes over if the primary server fails supports which principle?',
              options: ['Confidentiality', 'Integrity', 'Availability'],
              correctAnswer: 2,
            }
          ]
        }
      }
    ]
  },
  // Module 2
  {
    id: 'course-phishing',
    title: 'Phishing & Social Engineering',
    description: 'Learn to identify and protect yourself from phishing attacks, business email compromise, and other social engineering tactics.',
    standard: 'NCA ECC',
    badgeId: 'phishing-badge',
    lessons: [
      {
        id: 'phishing-l1',
        title: 'What is Social Engineering?',
        content: `
# Lesson 1: The Art of Deception

**Social engineering** is the art of manipulating people so they give up confidential information. The criminals are trying to trick you, not your computer. They prey on human psychology—our trust, fear, curiosity, and desire to be helpful.

Phishing is the most common form of social engineering.

### Common Psychological Tricks
- **Authority:** Pretending to be someone important, like a CEO or a government official, to intimidate you into acting.
- **Urgency:** Creating a false sense of emergency (e.g., "Your account will be deleted in 1 hour!") to make you act without thinking.
- **Intimidation/Fear:** Threatening you with negative consequences (e.g., "A warrant has been issued for your arrest") if you don't comply.
- **Scarcity/Greed:** Luring you with an offer that seems too good to be true, like winning a lottery you never entered.
- **Helpfulness:** Posing as a help desk technician and asking for your password to "fix a problem."
`,
        quiz: {
          title: 'Social Engineering Tactics',
          questions: [
            {
              question: 'An attacker pretending to be from the IT help desk and asking for your password is using what tactic?',
              options: ['Urgency', 'Authority', 'Helpfulness'],
              correctAnswer: 2,
            }
          ]
        }
      },
      {
        id: 'phishing-l2',
        title: 'Recognizing Phishing Attacks',
        content: `
# Lesson 2: Spotting the Phish

Phishing is a fraudulent attempt to trick you into revealing sensitive information by disguising as a trustworthy source. Here's how to spot them.

## Red Flags in Emails
- **Sense of Urgency:** Language like "Urgent Action Required" or "Your Account will be Suspended."
- **Generic Greetings:** "Dear Customer" instead of your name.
- **Poor Grammar and Spelling:** Professional organizations proofread their emails.
- **Suspicious Links:** Hover your mouse over a link (don't click!) to see the actual web address. If it doesn't match the sender, it's likely malicious. **Example:** The link text says <code>www.mybank.com</code>, but the hover-link shows <code>www.hacker-site.net/mybank</code>.
- **Unexpected Attachments:** Be wary of attachments you weren't expecting, especially ZIP files or documents that ask you to "Enable Content" or "Enable Macros."
- **Mismatched Sender Address:** The "From" name might say "IT Support," but the email address might be something strange like <code>it-support@hotmail.com</code>.

## Types of Phishing
- **Spear Phishing:** A targeted attack against a specific individual or company. The email will seem much more personal and may reference your name, job title, or recent projects.
- **Whaling:** A type of spear phishing aimed at senior executives (the "big fish").
- **Smishing (SMS Phishing):** Phishing attacks sent via text message.
- **Vishing (Voice Phishing):** Phishing attacks conducted over the phone.
`,
        quiz: {
          title: 'Phishing Recognition Quiz',
          questions: [
            {
              question: 'You receive a text message from an unknown number saying "Your package has a customs fee. Click here to pay: [link]". What is this called?',
              options: ['Whaling', 'Smishing', 'Vishing'],
              correctAnswer: 1,
            },
            {
              question: 'You hover over a link in an email from "Microsoft" and the URL is <code>http://microsft-login.com</code>. What should you do?',
              options: ['Click it to see where it goes', 'Trust it, it looks close enough', 'Delete the email and report it as phishing'],
              correctAnswer: 2,
            }
          ]
        }
      }
    ]
  }
];
