import { ChevronDown } from 'lucide-react'

interface FaqItemProps {
  index: number
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

export function FaqItem({ index, question, answer, isOpen, onToggle }: FaqItemProps) {
  const answerId = `faq-answer-${index}`

  return (
    <div className={`faq-item ${isOpen ? 'is-open' : ''}`}>
      <h3>
        <button
          className="faq-trigger"
          type="button"
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={onToggle}
        >
          <span>{question}</span>
          <ChevronDown size={19} aria-hidden="true" />
        </button>
      </h3>
      <div id={answerId} className="faq-answer" hidden={!isOpen}>
        <p>{answer}</p>
      </div>
    </div>
  )
}

