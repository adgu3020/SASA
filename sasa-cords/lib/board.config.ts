// ─────────────────────────────────────────────────────────────
// SASA Board Member Configuration
// Edit this file each year to update the board listing
// ─────────────────────────────────────────────────────────────

export interface BoardMember {
  name: string
  role: string
  email?: string
  bio?: string
  image?: string  // place images in public/images/board/
}

export const BOARD_MEMBERS: BoardMember[] = [
  {
    name:  'Ria Kashikar',
    role:  'President',
    bio:   'Short bio here.',
    image: '/images/board/president.jpg',
  },
  {
    name:  'Aditya Gupta',
    role:  'Treasurer',
    bio:   'Short bio here.',
    image: '/images/board/treasurer.jpg'
  },
  {
    name:  'Asmitha Muthukumar',
    role:  'Marketing Chair',
    bio:   'Short bio here.',
    image: '/images/board/marketing.jpg'
  },
  {
    name:  'Neil Sury',
    role:  'Outreach Chair',
    bio:   'Short bio here.',
    image: '/images/board/outreach.jpg'
  },
  {
    name:  'Aditi Patel',
    role:  'Head of Events',
    bio:   'Short bio here.',
    image: '/images/board/events.jpg'
  },
]

// ─────────────────────────────────────────────────────────────
// SASA General Info — used across public pages
// ─────────────────────────────────────────────────────────────
export const SASA_INFO = {
  fullName:    'South Asian Student Association',
  university:  'University of Colorado Boulder',
  email:       'sasa@colorado.edu',
  instagram:   'https://www.instagram.com/sasa_boulder/',
  discord:     '',   // add if you have one
  mailchimp:   'https://your-mailchimp-archive-link.com',  // Mailchimp campaign archive URL
}