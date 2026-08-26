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
    bio:          'Hi y\'all!! My name is Ria and I\'m from Centennial, Colorado! I am going into my final year at Boulder and am majoring in Statistics and Data Science with a minor in MCDB. I grew up playing Just Dance 4 and so I\'ve memorized the routines for Beauty and the Beat, On the Floor, and Living La Vida Loca!! ',
    image:        '/images/board/president.jpg',
    imagePosition: 'center top',
    instagram:    '@ria.kash',
    instagramUrl: 'https://instagram.com/ria.kash',
  },
  {
    name:         'Aditya Gupta',
    role:         'Treasurer',
    bio:          'Hey! I\'m Aditya, a sophomore at CU majoring in Computer Science and minoring in Business. I\'m from Aurora, Colorado and I love to play video games, watch movies, and listen to music in my free time!',
    image:        '/images/board/treasurer.jpg',
    imagePosition: 'center top',
    instagram:    '@g_aditya3',
    instagramUrl: 'https://instagram.com/g_aditya3',
  },
  {
    name:         'Asmitha Muthukumar',
    role:         'Marketing Chair',
    bio:          'Hey! I\'m Asmitha and I\'m a senior this year at CU with a major in Creative Technology and Design! I love art, fashion, and playing games!',
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
    bio:          'Hi, I\'m Aditi, a second year pre-med student at CU studying Integrative Physiology and minoring in Biochemistry and Chemistry! In my free time, I like to crochet, hike, make mixes on Spotify, and go shopping. I\'m so excited for another amazing year of SASA!!!',
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