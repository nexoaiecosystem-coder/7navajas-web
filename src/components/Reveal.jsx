import { useReveal } from '../hooks/useReveal'

// Envuelve cualquier elemento para que aparezca con un fade + slide al entrar en pantalla
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...props }) {
  const [ref, visible] = useReveal()
  return (
    <Tag
      ref={ref}
      className={['reveal', visible && 'reveal-visible', className].filter(Boolean).join(' ')}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  )
}
