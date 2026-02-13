import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const PLANS = {
  standard: {
    name: 'Standard',
    price: 4900, // 49€
    currency: 'eur',
    interval: 'month' as const,
    features: [
      'Jusqu\'à 20 agents',
      'Jusqu\'à 50 sites',
      'Planning en temps réel',
      'Gestion des disponibilités',
      'Export CSV',
      'Support email',
    ],
    limits: {
      agents: 20,
      sites: 50,
    },
  },
  premium: {
    name: 'Premium',
    price: 9900, // 99€
    currency: 'eur',
    interval: 'month' as const,
    features: [
      'Agents illimités',
      'Sites illimités',
      'Planning en temps réel',
      'Gestion des disponibilités',
      'Export CSV et PDF',
      'Notifications par email',
      'Statistiques avancées',
      'Support prioritaire',
    ],
    limits: {
      agents: Infinity,
      sites: Infinity,
    },
  },
}
