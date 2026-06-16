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
    name:  'Your Name',
    role:  'President',
    bio:   'Short bio here.',
    image: '/images/board/president.jpg',
  },
  {
    name:  'Your Name',
    role:  'Vice President',
    bio:   'Short bio here.',
  },
  {
    name:  'Your Name',
    role:  'Events Chair',
    bio:   'Short bio here.',
  },
  {
    name:  'Your Name',
    role:  'Secretary',
    bio:   'Short bio here.',
  },
  {
    name:  'Your Name',
    role:  'Treasurer',
    bio:   'Short bio here.',
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