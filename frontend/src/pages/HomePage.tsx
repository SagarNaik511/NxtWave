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
  { label: '01', category: 'IDEATION', title: 'Find the signal in your idea', description: 'Turn a broad curiosity into a small problem that is ready to build.', icon: WandSparkles, accent: 'peach' },
  { label: '02', category: 'WORKFLOW', title: 'Connect input to output', description: 'Shape a practical AI workflow without getting lost in the noise.', icon: Workflow, accent: 'cream' },
  { label: '03', category: 'BUILD', title: 'Ship a first working version', description: 'Leave with a project direction and the next action you can take.', icon: Code2, accent: 'blue' },
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
    <div className="sosc-landing cloudwave-landing">
      <section className="cloudwave-hero" aria-labelledby="hero-heading">
        <div className="cloudwave-cloud cloudwave-cloud-left" aria-hidden="true" />
        <div className="cloudwave-cloud cloudwave-cloud-right" aria-hidden="true" />
        <div className="cloudwave-cloud cloudwave-cloud-low" aria-hidden="true" />
        <div className="cloudwave-hero-topline"><span>AI SPRINT / WORKSHOP 01</span><span>STATUS: OPEN</span></div>

        <div className="cloudwave-hero-main">
          <div className="cloudwave-copy">
            <div className="cloudwave-eyebrow"><Sparkles size={14} aria-hidden="true" /> PRACTICAL AI / STUDENT BUILDING</div>
            <h1 id="hero-heading"><span>BUILD YOUR</span><span>FIRST AI</span><span>PROJECT</span></h1>
            <div className="cloudwave-subtitle">IN 60 MINUTES</div>
            <p>One focused online workshop to move from “I want to build something” to a real first project direction.</p>
            <div className="cloudwave-actions"><Link className="cloudwave-button cloudwave-button-primary" to="/register">Reserve your spot <ArrowRight size={16} aria-hidden="true" /></Link><a className="cloudwave-button cloudwave-button-ghost" href="#workshop">Explore the sprint <ArrowDown size={16} aria-hidden="true" /></a></div>
            <div className="cloudwave-facts"><span>ONLINE</span><span>FREE TO ATTEND</span><span>BEGINNER FRIENDLY</span></div>
          </div>

          <div className="cloudwave-poster" aria-label="AI Sprint workshop overview">
            <div className="cloudwave-poster-label">BUILD / SHARE / BEGIN</div>
            <div className="cloudwave-poster-cloud poster-cloud-one" aria-hidden="true" />
            <div className="cloudwave-poster-cloud poster-cloud-two" aria-hidden="true" />
            <div className="cloudwave-poster-orbit poster-orbit-one" aria-hidden="true" />
            <div className="cloudwave-poster-orbit poster-orbit-two" aria-hidden="true" />
            <div className="cloudwave-poster-core"><Braces size={46} strokeWidth={1.4} aria-hidden="true" /><strong>AI</strong><span>PROJECT<br />STARTER</span></div>
            <div className="cloudwave-poster-side poster-side-left"><span>01</span><strong>IDEA</strong><small>Start small.</small></div>
            <div className="cloudwave-poster-side poster-side-right"><span>02</span><strong>SHIP</strong><small>Make it real.</small></div>
            <div className="cloudwave-poster-footer"><span>60 MINUTE WORKSHOP</span><span>NO EXPERIENCE NEEDED</span></div>
          </div>
        </div>

        <div className="cloudwave-hero-bottom"><span>LOC_DATA / ONLINE</span><span>SCROLL TO EXPLORE <ArrowDown size={14} aria-hidden="true" /></span><span>01 / 04</span></div>
      </section>

      <section id="about" className="sosc-section cloudwave-section cloudwave-about" aria-labelledby="about-heading">
        <div className="cloudwave-section-index">01 / THE SPRINT</div>
        <div className="cloudwave-section-heading"><div><div className="cloudwave-eyebrow"><Activity size={14} aria-hidden="true" /> OPEN BUILDING SESSION</div><h2 id="about-heading">A first project<br /><em>starts here.</em></h2></div><p>AI Sprint is a student-first workshop for learning by making. No hype, no long lecture - just a clear path from an idea to an AI project you can continue after the session.</p></div>
        <div className="cloudwave-stats"><article><span>FORMAT</span><strong>ONLINE</strong><small>Join from anywhere.</small></article><article><span>TIMEBOX</span><strong>60 MIN</strong><small>Focused and practical.</small></article><article><span>ACCESS</span><strong>FREE</strong><small>Built for curious students.</small></article><article><span>GOAL</span><strong>01 PROJECT</strong><small>Leave with momentum.</small></article></div>
      </section>

      <section id="workshop" className="sosc-section cloudwave-section cloudwave-workshop" aria-labelledby="workshop-heading">
        <div className="cloudwave-section-index">02 / WORKSHOP MODULES</div>
        <div className="cloudwave-section-heading"><div><div className="cloudwave-eyebrow"><Layers3 size={14} aria-hidden="true" /> WHAT WE BUILD</div><h2 id="workshop-heading">The path from<br /><em>curious to capable.</em></h2></div><Link className="cloudwave-inline-link" to="/register">Register for the session <ArrowRight size={15} aria-hidden="true" /></Link></div>
        <div className="cloudwave-module-grid">{modules.map(({ label, category, title, description, icon: Icon, accent }) => <article className={`cloudwave-module module-${accent}`} key={label}><div className="cloudwave-module-top"><span>{label}</span><Icon size={20} aria-hidden="true" /></div><div className="cloudwave-module-art"><Icon size={42} strokeWidth={1.1} aria-hidden="true" /><span>{category}</span></div><h3>{title}</h3><p>{description}</p><span className="cloudwave-module-arrow"><ArrowRight size={15} aria-hidden="true" /></span></article>)}</div>
      </section>

      <section id="build" className="sosc-section cloudwave-section cloudwave-build" aria-labelledby="build-heading">
        <div className="cloudwave-section-index">03 / HOW IT WORKS</div>
        <div className="cloudwave-build-grid"><div className="cloudwave-section-heading"><div className="cloudwave-eyebrow"><Zap size={14} aria-hidden="true" /> FROM PROMPT TO PROJECT</div><h2 id="build-heading">Make the<br /><em>first move.</em></h2><p>You do not need a perfect idea or a deep AI background. You need a small question, a simple workflow and one hour to try.</p></div><ol className="cloudwave-step-list"><li><span>01</span><div><h3>Choose a useful question</h3><p>Start with something you already notice, care about or want to improve.</p></div></li><li><span>02</span><div><h3>Shape the workflow</h3><p>Connect the prompt, input and output into a buildable first version.</p></div></li><li><span>03</span><div><h3>Take it forward</h3><p>Leave with a clear next action instead of another unfinished tab.</p></div></li></ol></div>
      </section>

      <section id="faq" className="sosc-section cloudwave-section cloudwave-faq" aria-labelledby="faq-heading">
        <div className="cloudwave-section-index">04 / QUESTIONS</div>
        <div className="cloudwave-faq-grid"><div className="cloudwave-section-heading"><div className="cloudwave-eyebrow"><CircleHelp size={14} aria-hidden="true" /> BEFORE YOU BEGIN</div><h2 id="faq-heading">Good questions<br /><em>make good projects.</em></h2></div><div className="cloudwave-faq-list">{faqs.map((faq, index) => <FaqItem key={faq.question} index={index} question={faq.question} answer={faq.answer} isOpen={openFaq === index} onToggle={() => setOpenFaq(openFaq === index ? null : index)} />)}</div></div>
      </section>

      <section className="cloudwave-final" aria-labelledby="final-cta-heading"><div className="cloudwave-final-mark"><Check size={22} aria-hidden="true" /></div><div><div className="cloudwave-eyebrow">BUILD WITH US</div><h2 id="final-cta-heading">Your first AI project<br />is waiting.</h2><p>Registration is free. Workshop details will be shared when they are confirmed.</p></div><Link className="cloudwave-button cloudwave-button-primary" to="/register">Join AI Sprint <ArrowRight size={15} aria-hidden="true" /></Link></section>
    </div>
  )
}
