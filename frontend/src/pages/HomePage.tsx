import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Braces,
  Check,
  CircleHelp,
  Code2,
  Layers3,
  Sparkles,
  WandSparkles,
  Workflow,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { FaqItem } from '../components/FaqItem'

const faqs = [
  { question: 'Is the workshop free?', answer: 'Yes. AI Sprint is a free learning experience for students. There is no payment step in the current registration flow.' },
  { question: 'Who should attend?', answer: 'It is designed for curious beginners and students who want a practical first step into AI project building.' },
  { question: 'Do I need prior AI experience?', answer: 'No advanced AI background is expected. Curiosity and a willingness to try are enough to start.' },
  { question: 'How long is the workshop?', answer: 'The guided workshop is designed to take 60 minutes. No additional schedule details have been announced yet.' },
  { question: 'What happens after registration?', answer: 'You will receive confirmed next-step information when it is available. We do not invent a meeting link or schedule.' },
]

const modules = [
  { label: 'MODULE / 01', category: 'IDEATION', title: 'Find the signal in your idea', description: 'Turn a broad curiosity into a small problem that is ready to build.', icon: WandSparkles, accent: 'violet' },
  { label: 'MODULE / 02', category: 'WORKFLOW', title: 'Connect input to output', description: 'Shape a practical AI workflow without getting lost in the noise.', icon: Workflow, accent: 'pink' },
  { label: 'MODULE / 03', category: 'BUILD', title: 'Ship a first working version', description: 'Leave with a project direction and the next action you can take.', icon: Code2, accent: 'blue' },
]

function updatePageMeta(title: string, description: string) {
  document.title = title
  document.querySelector('meta[name="description"]')?.setAttribute('content', description)
}

export function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    updatePageMeta('AI Sprint | Build your first AI project', 'A free 60-minute workshop for students who want to build their first practical AI project.')
  }, [])

  return (
    <div className="sosc-landing">
      <section className="sosc-hero" aria-labelledby="hero-heading">
        <div className="sosc-hero-meta sosc-hero-meta-top"><span>STATUS: OPEN</span><span>WORKSHOP_01 / AI SPRINT</span></div>
        <div className="sosc-hero-grid">
          <div className="sosc-hero-copy">
            <div className="sosc-kicker"><Sparkles size={14} aria-hidden="true" /> PRACTICAL AI / STUDENT BUILDING</div>
            <h1 id="hero-heading">BUILD YOUR<br /><span>FIRST AI PROJECT</span><small>IN 60 MINUTES</small></h1>
            <p>One focused online workshop to move from &quot;I want to build something&quot; to a real first project direction.</p>
            <div className="sosc-hero-actions"><Link className="sosc-button sosc-button-primary" to="/register">Reserve your spot <ArrowRight size={15} aria-hidden="true" /></Link><a className="sosc-button sosc-button-quiet" href="#workshop">Explore the sprint <ArrowDown size={15} aria-hidden="true" /></a></div>
          </div>
          <div className="sosc-hero-visual" aria-label="AI Sprint workshop overview">
            <div className="sosc-visual-corner">CORE_SYS // SPRINT_01</div><div className="sosc-visual-orbit orbit-one" /><div className="sosc-visual-orbit orbit-two" />
            <div className="sosc-visual-core"><Braces size={42} strokeWidth={1.2} aria-hidden="true" /><span>BUILD<br />/ SHARE<br />/ BEGIN</span></div>
            <div className="sosc-visual-note note-left"><span>01</span><strong>IDEA</strong><small>Start small.</small></div><div className="sosc-visual-note note-right"><span>02</span><strong>SHIP</strong><small>Make it real.</small></div>
            <div className="sosc-visual-footer"><span>ONLINE / FREE</span><span>60 MIN / BEGINNER FRIENDLY</span></div>
          </div>
        </div>
        <div className="sosc-hero-meta sosc-hero-meta-bottom"><span>LOC_DATA / ONLINE</span><span>SCROLL TO EXPLORE <ArrowDown size={13} aria-hidden="true" /></span><span>01 / 04</span></div>
      </section>

      <section id="about" className="sosc-section sosc-about" aria-labelledby="about-heading">
        <div className="sosc-section-index">01 / THE SPRINT</div>
        <div className="sosc-section-heading"><div><div className="sosc-kicker"><Activity size={14} aria-hidden="true" /> OPEN BUILDING SESSION</div><h2 id="about-heading">A first project<br /><em>starts here.</em></h2></div><p>AI Sprint is a student-first workshop for learning by making. No hype, no long lecture - just a clear path from an idea to an AI project you can continue after the session.</p></div>
        <div className="sosc-stat-grid"><article><span>FORMAT</span><strong>ONLINE</strong><small>Join from anywhere.</small></article><article><span>TIMEBOX</span><strong>60 MIN</strong><small>Focused and practical.</small></article><article><span>ACCESS</span><strong>FREE</strong><small>Built for curious students.</small></article><article><span>GOAL</span><strong>01 PROJECT</strong><small>Leave with momentum.</small></article></div>
      </section>

      <section id="workshop" className="sosc-section sosc-workshop" aria-labelledby="workshop-heading">
        <div className="sosc-section-index">02 / WORKSHOP MODULES</div>
        <div className="sosc-section-heading"><div><div className="sosc-kicker"><Layers3 size={14} aria-hidden="true" /> WHAT WE BUILD</div><h2 id="workshop-heading">The path from<br /><em>curious to capable.</em></h2></div><Link className="sosc-inline-link" to="/register">Register for the session <ArrowRight size={15} aria-hidden="true" /></Link></div>
        <div className="sosc-module-grid">{modules.map(({ label, category, title, description, icon: Icon, accent }) => <article className={`sosc-module-card module-${accent}`} key={label}><div className="sosc-card-topline"><span>{label}</span><Icon size={20} aria-hidden="true" /></div><div className="sosc-module-visual"><Icon size={42} strokeWidth={1.1} aria-hidden="true" /><span>{category}</span></div><h3>{title}</h3><p>{description}</p><span className="sosc-card-arrow"><ArrowRight size={15} aria-hidden="true" /></span></article>)}</div>
      </section>

      <section id="build" className="sosc-section sosc-build" aria-labelledby="build-heading">
        <div className="sosc-section-index">03 / HOW IT WORKS</div>
        <div className="sosc-build-grid"><div className="sosc-section-heading"><div className="sosc-kicker"><Zap size={14} aria-hidden="true" /> FROM PROMPT TO PROJECT</div><h2 id="build-heading">Make the<br /><em>first move.</em></h2><p>You do not need a perfect idea or a deep AI background. You need a small question, a simple workflow and one hour to try.</p></div><ol className="sosc-step-list"><li><span>01</span><div><h3>Choose a useful question</h3><p>Start with something you already notice, care about or want to improve.</p></div></li><li><span>02</span><div><h3>Shape the workflow</h3><p>Connect the prompt, input and output into a buildable first version.</p></div></li><li><span>03</span><div><h3>Take it forward</h3><p>Leave with a clear next action instead of another unfinished tab.</p></div></li></ol></div>
      </section>

      <section id="faq" className="sosc-section sosc-faq" aria-labelledby="faq-heading">
        <div className="sosc-section-index">04 / QUESTIONS</div>
        <div className="sosc-faq-grid"><div className="sosc-section-heading"><div className="sosc-kicker"><CircleHelp size={14} aria-hidden="true" /> BEFORE YOU BEGIN</div><h2 id="faq-heading">Good questions<br /><em>make good projects.</em></h2></div><div className="sosc-faq-list">{faqs.map((faq, index) => <FaqItem key={faq.question} index={index} question={faq.question} answer={faq.answer} isOpen={openFaq === index} onToggle={() => setOpenFaq(openFaq === index ? null : index)} />)}</div></div>
      </section>

      <section className="sosc-final-cta" aria-labelledby="final-cta-heading"><div className="sosc-final-mark"><Check size={22} aria-hidden="true" /></div><div><div className="sosc-kicker">BUILD WITH US</div><h2 id="final-cta-heading">Your first AI project<br />is waiting.</h2><p>Registration is free. Workshop details will be shared when they are confirmed.</p></div><Link className="sosc-button sosc-button-primary" to="/register">Join AI Sprint <ArrowRight size={15} aria-hidden="true" /></Link></section>
    </div>
  )
}
