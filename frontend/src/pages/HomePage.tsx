import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Check,
  CircleHelp,
  Clock3,
  Compass,
  Leaf,
  Lightbulb,
  Moon,
  Sprout,
  Star,
  UsersRound,
  Workflow,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { FaqItem } from '../components/FaqItem'

const faqs = [
  {
    question: 'Is the workshop free?',
    answer: 'Yes. This workshop is designed as a free learning experience for students. There is no payment step in the current registration flow.',
  },
  {
    question: 'Who should attend?',
    answer: 'It is intended for final-year engineering students—especially CSE, IT, AI/ML and related branches—as well as curious beginners who want a practical first step.',
  },
  {
    question: 'Do I need prior AI experience?',
    answer: 'No advanced AI background is expected. Curiosity and a willingness to try are enough to start.',
  },
  {
    question: 'How long is the workshop?',
    answer: 'The guided workshop is designed to take 60 minutes. No additional schedule details have been announced yet.',
  },
  {
    question: 'What happens after registration?',
    answer: 'You will receive confirmed next-step information when it is available. We do not invent a meeting link or schedule.',
  },
]

const featureCards = [
  {
    icon: Lightbulb,
    label: '01 / Mindful tools',
    title: 'Start with a small idea',
    description: 'Use a simple prompt, a curious question and a little structure to find your first AI project direction.',
    accent: 'coral',
  },
  {
    icon: BrainCircuit,
    label: '02 / Creative space',
    title: 'Build without the noise',
    description: 'A focused 60-minute workshop that turns the blank page into a gentle, practical workflow.',
    accent: 'violet',
  },
  {
    icon: Leaf,
    label: '03 / Gentle reminders',
    title: 'Leave with momentum',
    description: 'You do not need to master everything today. You only need a clear next step to keep exploring.',
    accent: 'green',
  },
]

function updatePageMeta(title: string, description: string) {
  document.title = title
  document.querySelector('meta[name="description"]')?.setAttribute('content', description)
}

export function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    updatePageMeta(
      'AI Sprint | Where curiosity meets creation',
      'A calm, beginner-friendly online workshop to help students build their first AI project in 60 minutes.',
    )
  }, [])

  return (
    <div className="landing-page quiet-landing">
      <section className="quiet-hero" aria-labelledby="hero-heading">
        <div className="quiet-hero-copy">
          <div className="quiet-kicker"><Sprout size={14} aria-hidden="true" /> AI SPRINT / A QUIETER WAY TO START</div>
          <h1 id="hero-heading">Where calm meets <span>creativity.</span></h1>
          <p className="quiet-hero-description">
            In the rush of learning AI, take one focused hour to make something real. Build your first AI project with a gentle, practical guide for beginners.
          </p>
          <div className="quiet-hero-actions">
            <Link className="button quiet-primary-button" to="/register">Start your journey <ArrowRight size={15} aria-hidden="true" /></Link>
            <a className="quiet-text-link" href="#features">Explore features <ArrowDown size={15} aria-hidden="true" /></a>
          </div>
          <div className="quiet-hero-facts" aria-label="Workshop facts">
            <span><Check size={14} aria-hidden="true" /> Free workshop</span>
            <span><Clock3 size={14} aria-hidden="true" /> 60 minutes</span>
            <span><UsersRound size={14} aria-hidden="true" /> Beginner friendly</span>
          </div>
        </div>
        <PixelGarden />
      </section>

      <section id="features" className="quiet-section quiet-features" aria-labelledby="features-heading">
        <div className="quiet-section-heading">
          <div className="quiet-kicker"><Star size={13} aria-hidden="true" /> A little room to think</div>
          <h2 id="features-heading">Small tools for a <em>big first step.</em></h2>
          <p>AI Sprint is a quiet place to move from “I want to build something” to a practical idea you can actually begin.</p>
        </div>
        <div className="quiet-feature-grid">
          {featureCards.map(({ icon: Icon, label, title, description, accent }) => (
            <article className={`quiet-feature-card feature-${accent}`} key={label}>
              <div className="quiet-feature-icon"><Icon size={20} aria-hidden="true" /></div>
              <span>{label}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workshop" className="quiet-section quiet-workshop" aria-labelledby="workshop-heading">
        <div className="quiet-workshop-card">
          <div className="quiet-workshop-symbol"><Compass size={24} aria-hidden="true" /></div>
          <div>
            <div className="quiet-kicker">Inside the sprint</div>
            <h2 id="workshop-heading">Build your first AI project in 60 minutes.</h2>
            <p>The exact curriculum will be confirmed before registration opens. The session is designed to help you frame an idea, follow a basic workflow and choose your next step.</p>
          </div>
          <div className="quiet-workshop-tags" aria-label="Workshop details">
            <span>Online</span><span>Free</span><span>60 min</span>
          </div>
        </div>
        <div className="quiet-process-grid" id="build">
          <article><span>01</span><Wrench size={18} aria-hidden="true" /><h3>Find your idea</h3><p>Make a broad curiosity concrete enough to explore.</p></article>
          <article><span>02</span><Workflow size={18} aria-hidden="true" /><h3>Shape the workflow</h3><p>Connect the prompt, input and output into a first project.</p></article>
          <article><span>03</span><BookOpenCheck size={18} aria-hidden="true" /><h3>Take it forward</h3><p>Leave with a clear next move instead of another open tab.</p></article>
        </div>
      </section>

      <section id="faq" className="quiet-section quiet-faq" aria-labelledby="faq-heading">
        <div className="quiet-section-heading">
          <div className="quiet-kicker"><CircleHelp size={13} aria-hidden="true" /> Questions, answered</div>
          <h2 id="faq-heading">Before you <em>begin.</em></h2>
          <p>We will keep adding confirmed details as the workshop is prepared.</p>
        </div>
        <div className="quiet-faq-list">
          {faqs.map((faq, index) => (
            <FaqItem
              key={faq.question}
              index={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFaq === index}
              onToggle={() => setOpenFaq(openFaq === index ? null : index)}
            />
          ))}
        </div>
      </section>

      <section className="quiet-final-cta" aria-labelledby="final-cta-heading">
        <div className="quiet-final-icon"><Moon size={22} aria-hidden="true" /></div>
        <div>
          <div className="quiet-kicker">Your next step is waiting</div>
          <h2 id="final-cta-heading">Make a little space for what you can build.</h2>
          <p>Registration is free. Workshop access details will be shared when they are confirmed.</p>
        </div>
        <Link className="button quiet-primary-button" to="/register">Register free <ArrowRight size={15} aria-hidden="true" /></Link>
      </section>
    </div>
  )
}

function PixelGarden() {
  return (
    <div className="pixel-garden" role="img" aria-label="A calm pixel-art garden with trees, clouds and a small path toward the horizon">
      <div className="pixel-cloud cloud-one" /><div className="pixel-cloud cloud-two" /><div className="pixel-cloud cloud-three" />
      <div className="pixel-hill hill-back" /><div className="pixel-hill hill-front" />
      <PixelTree className="tree-left tree-large" /><PixelTree className="tree-left tree-small" />
      <PixelTree className="tree-right tree-large" /><PixelTree className="tree-right tree-small" />
      <div className="pixel-path" /><div className="pixel-person"><span className="person-head" /><span className="person-body" /></div>
      <div className="pixel-flower flower-one" /><div className="pixel-flower flower-two" />
      <div className="pixel-ground"><span /><span /><span /></div>
      <div className="pixel-water"><i /><i /><i /><i /></div>
      <div className="garden-caption"><span>AI SPRINT</span><span>MAKE / REFLECT / BEGIN</span></div>
    </div>
  )
}

function PixelTree({ className }: { className: string }) {
  return <div className={`pixel-tree ${className}`} aria-hidden="true"><span /><span /><span /><b /></div>
}
