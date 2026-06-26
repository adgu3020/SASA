export interface BoardMember {
  name:          string
  role:          string
  bio?:          string
  image?:        string
  imagePosition?: string
  instagram?:    string  // just the handle, e.g. '@yourhandle'
  instagramUrl?: string  // full URL e.g. 'https://instagram.com/yourhandle'
}

export const BOARD_MEMBERS: BoardMember[] = [
  {
    name:         'Ria Kashikar',
    role:         'President',
    bio:          'Short bio here',
    image:        '/images/board/president.jpg',
    imagePosition: 'center top',
    instagram:    '@ria.kash',
    instagramUrl: 'https://instagram.com/ria.kash',
  },
  {
    name:         'Aditya Gupta',
    role:         'Treasurer',
    bio:          'Short bio here.',
    image:        '/images/board/treasurer.jpg',
    imagePosition: 'center top',
    instagram:    '@g_aditya3',
    instagramUrl: 'https://instagram.com/g_aditya3',
  },
  {
    name:         'Asmitha Muthukumar',
    role:         'Marketing Chair',
    bio:          'Short bio here.',
    image:        '/images/board/marketing.jpg',
    imagePosition: 'center top',
    instagram:    '@asmitha_m_',
    instagramUrl: 'https://instagram.com/asmitha_m_',
  },
  {
    name:         'Neil Sury',
    role:         'Outreach Chair',
    bio:          'Short bio here.',
    image:        '/images/board/outreach.jpg',
    imagePosition: 'center top',
    instagram:    '@neilsury',
    instagramUrl: 'https://instagram.com/neilsury',
  },
  {
    name:         'Aditi Patel',
    role:         'Head of Events',
    bio:          'Short bio here.',
    image:        '/images/board/events.jpg',
    imagePosition: 'center top',
    instagram:    '@aditiiipatelll_',
    instagramUrl: 'https://instagram.com/aditiiipatelll_',
  },
]

export const SASA_INFO = {
  fullName:   'South Asian Student Association',
  university: 'University of Colorado Boulder',
  email:      'sasa@colorado.edu',
  instagram:  'https://www.instagram.com/sasa_boulder/',
  discord:    '',
  mailchimp:  'https://your-mailchimp-archive-link.com',
}