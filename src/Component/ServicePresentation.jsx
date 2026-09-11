import { BookOpen, Compass, FileText, Hash, House, Leaf, MessageCircle, Orbit, Route, Signature } from 'lucide-react'

const icons = { book: BookOpen, compass: Compass, chart: FileText, numbers: Hash, home: House, leaf: Leaf, question: MessageCircle, orbit: Orbit, path: Route, name: Signature }

export function ServiceIcon({ name, ...props }) {
  const Icon = icons[name] || Compass
  return <Icon aria-hidden="true" strokeWidth={1.6} {...props} />
}

export function ServiceFocus({ service, className = '' }) {
  return <ul className={`service-focus ${className}`} aria-label={`${service.title} focus areas`}>
    {service.focus.map(item => <li key={item.text}><ServiceIcon name={item.icon} /><span>{item.text}</span></li>)}
  </ul>
}

export function ServicePrice({ service }) {
  return <p className="service-price"><span>{service.price || 'Contact for pricing'}</span>{service.priceUnit && <span className="service-price-unit">{service.priceUnit}</span>}</p>
}

export function ServiceArtwork({ service, eager = false }) {
  return <div className={`service-artwork service-artwork--${service.id}`} style={{ '--art-scale': service.artScale }}>
    <div className="service-artwork-crop"><img src={service.image} alt="" width="800" height="800" loading={eager ? 'eager' : 'lazy'} /></div>
  </div>
}
