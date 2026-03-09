"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronUp, Menu, X } from "lucide-react"

export function LandingPage() {
  const revealRef = useRef<HTMLDivElement>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const el = revealRef.current
    if (!el) return
    const reveals = el.querySelectorAll(".reveal")
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("visible"), 80 * (i % 4))
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    reveals.forEach((r) => observer.observe(r))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing" ref={revealRef}>
      <nav className={mobileMenuOpen ? "nav-open" : ""}>
        <Link href="/" className="nav-logo" onClick={() => setMobileMenuOpen(false)}>
          <Image src="/logowithoutBG.png" alt="ShiftMe" width={40} height={40} className="rounded object-contain" priority />
          Shift<span>Me</span>
        </Link>
        <button
          type="button"
          className="nav-toggle"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <ul className="nav-menu">
          <li><Link href="#fonctions" onClick={() => setMobileMenuOpen(false)}>Fonctions</Link></li>
          <li><Link href="#comment" onClick={() => setMobileMenuOpen(false)}>Comment ça marche</Link></li>
          <li><Link href="#tarifs" onClick={() => setMobileMenuOpen(false)}>Tarifs</Link></li>
          <li><Link href="/signup" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>Essai gratuit</Link></li>
        </ul>
      </nav>

      <section className="hero" id="top">
        <div className="hero-logo">
          <Image src="/logowithoutBG.png" alt="ShiftMe" width={80} height={80} className="rounded-2xl object-contain" priority />
        </div>
        <div className="hero-tag">Gestion de plannings & suivi d&apos;heures</div>
        <h1>Planifiez vos équipes,<br /><em>simplement.</em></h1>
        <p className="hero-sub">ShiftMe centralise vos plannings, vos agents et vos heures travaillées dans un seul outil clair — pensé pour les responsables d&apos;équipes terrain.</p>
        <div className="hero-actions">
          <Link href="/signup" className="btn-primary">Démarrer l&apos;essai gratuit</Link>
          <Link href="#fonctions" className="btn-ghost">Voir les fonctions</Link>
        </div>
        <p className="hero-note">14 jours offerts — sans engagement, sans carte bancaire.</p>
      </section>

      <div className="stats">
        <div className="stat reveal">
          <div className="stat-num">14 j</div>
          <div className="stat-label">d&apos;essai offerts, sans engagement</div>
        </div>
        <div className="stat reveal">
          <div className="stat-num">100 %</div>
          <div className="stat-label">en ligne, accessible partout</div>
        </div>
        <div className="stat reveal">
          <div className="stat-num">2 rôles</div>
          <div className="stat-label">Admin et Agent, chacun à sa place</div>
        </div>
        <div className="stat reveal">
          <div className="stat-num">0 min</div>
          <div className="stat-label">de formation pour vos agents</div>
        </div>
      </div>

      <section id="fonctions">
        <div className="section-tag">Fonctionnalités</div>
        <h2>Tout ce qu&apos;il faut. Rien de superflu.</h2>
        <p className="section-intro">ShiftMe se concentre sur l&apos;essentiel : planifier, suivre, partager. Vos équipes savent où elles en sont, vous aussi.</p>
        <div className="features-grid">
          <div className="feature reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            <h3>Planning à la semaine</h3>
            <p>Visualisez votre équipe sur une grille agents × jours. Ajoutez, déplacez ou supprimez des créneaux en quelques secondes, jour comme nuit.</p>
          </div>
          <div className="feature reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
            </div>
            <h3>Tableau de bord admin</h3>
            <p>Filtrez par agent, par site, par semaine ou par mois. Consultez les totaux d&apos;heures (jour, nuit, etc.) sans jongler entre des fichiers Excel.</p>
          </div>
          <div className="feature reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            </div>
            <h3>Export PDF instantané</h3>
            <p>Générez un PDF du planning — pour toute l&apos;équipe ou un agent en particulier — en un clic. Prêt à imprimer ou à envoyer.</p>
          </div>
          <div className="feature reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            </div>
            <h3>Lien public de planning</h3>
            <p>Partagez le planning de la semaine via un lien unique. Vos agents consultent leurs horaires sans créer de compte.</p>
          </div>
          <div className="feature reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
            </div>
            <h3>Gestion des agents & sites</h3>
            <p>Créez vos profils, gérez vos sites d&apos;affectation et attribuez les bons agents aux bons créneaux, directement depuis l&apos;interface.</p>
          </div>
          <div className="feature reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            </div>
            <h3>Données sécurisées</h3>
            <p>Votre espace est isolé des autres entreprises. Accès par rôle, hébergement sécurisé. Chaque organisation garde le contrôle total de ses données.</p>
          </div>
        </div>
      </section>

      <section className="how" id="comment">
        <div className="section-tag">Mise en route</div>
        <h2>Opérationnel en moins de dix minutes.</h2>
        <p className="section-intro">Pas de déploiement, pas de serveur, pas de configuration IT. Vous créez votre compte et vous planifiez.</p>
        <div className="steps">
          <div className="step reveal">
            <div className="step-num">01</div>
            <h3>Créez votre organisation</h3>
            <p>Entrez le nom de votre entreprise, choisissez un plan et lancez votre essai de 14 jours. Aucune carte bancaire requise.</p>
          </div>
          <div className="step reveal">
            <div className="step-num">02</div>
            <h3>Ajoutez vos agents & sites</h3>
            <p>Importez ou créez vos profils agents, configurez vos sites. Tout est prêt pour la planification.</p>
          </div>
          <div className="step reveal">
            <div className="step-num">03</div>
            <h3>Construisez votre planning</h3>
            <p>Remplissez la grille hebdomadaire : glissez les créneaux, définissez les horaires, alternez jours et nuits.</p>
          </div>
          <div className="step reveal">
            <div className="step-num">04</div>
            <h3>Publiez & partagez</h3>
            <p>D&apos;un clic, publiez le planning et partagez le lien avec votre équipe. Ils voient leurs horaires, vous gardez la main.</p>
          </div>
        </div>
      </section>

      <section id="roles">
        <div className="section-tag">Qui utilise ShiftMe</div>
        <h2>Un outil, deux expériences distinctes.</h2>
        <p className="section-intro">Chaque rôle dispose d&apos;une vue adaptée à ses besoins — sans fonctions superflues qui noient l&apos;essentiel.</p>
        <div className="roles-grid">
          <div className="role-card reveal">
            <span className="role-badge badge-admin">Admin · Owner</span>
            <h3>Pour les responsables</h3>
            <ul>
              <li>Créer et modifier le planning de l&apos;équipe</li>
              <li>Gérer les profils agents et les sites</li>
              <li>Consulter le tableau de bord et les totaux d&apos;heures</li>
              <li>Exporter le planning en PDF</li>
              <li>Publier le planning et partager le lien public</li>
            </ul>
          </div>
          <div className="role-card reveal">
            <span className="role-badge badge-agent">Agent</span>
            <h3>Pour les équipes terrain</h3>
            <ul>
              <li>Consulter son planning personnel (semaine ou mois)</li>
              <li>Voir le détail de chaque mission journée par journée</li>
              <li>Suivre ses heures travaillées et les exporter en CSV</li>
              <li>Déclarer ses indisponibilités directement depuis l&apos;appli</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="pricing" id="tarifs">
        <div className="section-tag">Tarifs</div>
        <h2>Simple, transparent, sans surprise.</h2>
        <p className="section-intro">Deux plans pour s&apos;adapter à la taille de votre équipe. Passez d&apos;un plan à l&apos;autre à tout moment.</p>
        <div className="plans">
          <div className="plan reveal">
            <span className="plan-label">Standard</span>
            <div className="plan-price"><sup>€</sup>1.99<sub>/mois</sub></div>
            <p className="plan-desc">Pour les petites équipes qui veulent gagner du temps sur la planification.</p>
            <hr className="plan-divider" />
            <ul>
              <li>Jusqu&apos;à 20 agents, 50 sites</li>
              <li>Planning hebdomadaire</li>
              <li>Export PDF & lien public</li>
              <li>Tableau de bord</li>
            </ul>
            <Link href="/signup" className="btn-ghost" style={{ width: '100%', textAlign: 'center' }}>Démarrer l&apos;essai</Link>
          </div>
          <div className="plan plan-featured reveal">
            <span className="plan-label">Premium</span>
            <div className="plan-price"><sup>€</sup>12.99<sub>/mois</sub></div>
            <p className="plan-desc">Pour les équipes plus structurées : agents et sites illimités, support prioritaire.</p>
            <hr className="plan-divider" />
            <ul>
              <li>Tout Standard + agents & sites illimités</li>
              <li>Export PDF</li>
              <li>Support prioritaire</li>
            </ul>
            <Link href="/signup" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>Démarrer l&apos;essai</Link>
          </div>
        </div>
        <p className="trial-note">14 jours d&apos;essai inclus sur les deux plans. Aucune carte bancaire requise pour commencer.</p>
      </section>

      <section className="trust" id="confiance">
        <div className="section-tag">Pourquoi nous faire confiance</div>
        <h2>Conçu pour durer, pensé pour vous.</h2>
        <p className="section-intro">ShiftMe est bâti sur une infrastructure fiable, avec des principes de confidentialité clairs et une interface sans compromis.</p>
        <div className="trust-items">
          <div className="trust-item reveal">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div>
              <h4>Données isolées par entreprise</h4>
              <p>Chaque organisation dispose de son propre espace cloisonné. Aucune donnée n&apos;est partagée entre clients.</p>
            </div>
          </div>
          <div className="trust-item reveal">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
            </div>
            <div>
              <h4>Disponible 24h/24</h4>
              <p>Hébergé sur une infrastructure cloud résiliente. Vos équipes accèdent à leur planning à tout moment.</p>
            </div>
          </div>
          <div className="trust-item reveal">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <div>
              <h4>Accès par rôle stricts</h4>
              <p>Chaque utilisateur voit uniquement ce qu&apos;il doit voir. Les admins gardent le contrôle, les agents restent focalisés.</p>
            </div>
          </div>
          <div className="trust-item reveal">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            </div>
            <div>
              <h4>Paiement sécurisé Stripe</h4>
              <p>Les paiements sont traités par Stripe, référence mondiale en matière de sécurité des transactions en ligne.</p>
            </div>
          </div>
          <div className="trust-item reveal">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <div>
              <h4>Aucune donnée vendue</h4>
              <p>Vos données ne sont jamais revendues ni utilisées à des fins publicitaires. C&apos;est une règle, pas une option.</p>
            </div>
          </div>
          <div className="trust-item reveal">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
            </div>
            <div>
              <h4>Support humain et réactif</h4>
              <p>Une question ? Un problème ? Notre équipe répond rapidement, sans bot, sans ticket perdu.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section" id="essai">
        <h2>Prêt à reprendre la main sur vos plannings ?</h2>
        <p>Rejoignez ShiftMe et planifiez votre première semaine en moins de dix minutes.</p>
        <Link href="/signup" className="btn-primary">Commencer gratuitement — 14 jours offerts</Link>
      </section>

      <footer>
        <Link href="/" className="footer-logo">
          <Image src="/logowithoutBG.png" alt="ShiftMe" width={24} height={24} className="rounded" />
          Shift<span>Me</span>
        </Link>
        <nav>
          <ul>
            <li><Link href="/login">Se connecter</Link></li>
            <li><Link href="/signup">Créer un compte</Link></li>
          </ul>
        </nav>
        <p>© {new Date().getFullYear()} ShiftMe. Tous droits réservés.</p>
      </footer>

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="landing-back-to-top"
          aria-label="Remonter en haut de la page"
        >
          <ChevronUp className="h-5 w-5" />
          <span>Haut de page</span>
        </button>
      )}
    </div>
  )
}
