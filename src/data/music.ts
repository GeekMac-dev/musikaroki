import { Song } from '@/store/karaokeStore';

export const fallbackSongs: Song[] = [
  {
    id: 101,
    title: 'Tadhana',
    artist: 'Up Dharma Down',
    genre: 'OPM',
    duration: 220,
    is_opm: true,
    popularity: 98,
    cover_url: null,
  },
  {
    id: 102,
    title: 'Huling El Bimbo',
    artist: 'Eraserheads',
    genre: 'OPM',
    duration: 235,
    is_opm: true,
    popularity: 95,
    cover_url: null,
  },
  {
    id: 103,
    title: 'Akin Ka Na Lang',
    artist: 'Morissette',
    genre: 'Love Songs',
    duration: 205,
    is_opm: true,
    popularity: 92,
    cover_url: null,
  },
  {
    id: 104,
    title: 'Ikaw',
    artist: 'Yeng Constantino',
    genre: 'Love Songs',
    duration: 215,
    is_opm: true,
    popularity: 90,
    cover_url: null,
  },
  {
    id: 105,
    title: 'Hanggang',
    artist: 'Wency Cornejo',
    genre: 'Love Songs',
    duration: 208,
    is_opm: true,
    popularity: 88,
    cover_url: null,
  },
  {
    id: 106,
    title: 'As It Was',
    artist: 'Harry Styles',
    genre: 'Pop',
    duration: 185,
    is_opm: false,
    popularity: 97,
    cover_url: null,
  },
  {
    id: 107,
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    genre: 'Pop',
    duration: 200,
    is_opm: false,
    popularity: 96,
    cover_url: null,
  },
  {
    id: 108,
    title: 'Bad Habits',
    artist: 'Ed Sheeran',
    genre: 'Pop',
    duration: 190,
    is_opm: false,
    popularity: 93,
    cover_url: null,
  },
  {
    id: 109,
    title: 'Levitating',
    artist: 'Dua Lipa',
    genre: 'Pop',
    duration: 198,
    is_opm: false,
    popularity: 92,
    cover_url: null,
  },
  {
    id: 110,
    title: 'Love Story',
    artist: 'Taylor Swift',
    genre: 'Love Songs',
    duration: 233,
    is_opm: false,
    popularity: 89,
    cover_url: null,
  },
  {
    id: 111,
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    genre: 'Rock',
    duration: 355,
    is_opm: false,
    popularity: 99,
    cover_url: null,
  },
  {
    id: 112,
    title: 'Nothing Else Matters',
    artist: 'Metallica',
    genre: 'Rock',
    duration: 250,
    is_opm: false,
    popularity: 90,
    cover_url: null,
  },
  {
    id: 113,
    title: 'Nadarang',
    artist: 'Shanti Dope',
    genre: 'OPM',
    duration: 190,
    is_opm: true,
    popularity: 91,
    cover_url: null,
  },
  {
    id: 114,
    title: 'Ikaw at Ako',
    artist: 'Sarah Geronimo',
    genre: 'OPM',
    duration: 205,
    is_opm: true,
    popularity: 85,
    cover_url: null,
  },
  {
    id: 115,
    title: 'Laging Ikaw',
    artist: 'Kyla',
    genre: 'OPM',
    duration: 215,
    is_opm: true,
    popularity: 84,
    cover_url: null,
  },
  {
    id: 116,
    title: 'Kay Tagal Kitang Hinintay',
    artist: 'Sponge Cola',
    genre: 'Rock',
    duration: 225,
    is_opm: true,
    popularity: 87,
    cover_url: null,
  },
  {
    id: 117,
    title: 'Safe and Sound',
    artist: 'Taylor Swift',
    genre: 'Pop',
    duration: 238,
    is_opm: false,
    popularity: 87,
    cover_url: null,
  },
  {
    id: 118,
    title: 'Say You Wont Let Go',
    artist: 'James Arthur',
    genre: 'Love Songs',
    duration: 210,
    is_opm: false,
    popularity: 89,
    cover_url: null,
  },
  {
    id: 119,
    title: 'Mundo',
    artist: 'IV of Spades',
    genre: 'OPM',
    duration: 193,
    is_opm: true,
    popularity: 86,
    cover_url: null,
  },
  {
    id: 120,
    title: 'Buwan',
    artist: 'Juan Karlos',
    genre: 'OPM',
    duration: 215,
    is_opm: true,
    popularity: 94,
    cover_url: null,
  },
];

export interface LyricLine {
  id: number;
  line_text: string;
  start_time: number;
  end_time: number;
}

export const fallbackLyricsBySong: Record<number, LyricLine[]> = {
  101: [
    { id: 1, line_text: 'Ang damdamín ay naglalakbay', start_time: 0, end_time: 5 },
    { id: 2, line_text: 'Sa bawat pag-ikot ng mundo', start_time: 5, end_time: 10 },
    { id: 3, line_text: 'Tila ba may tadhana', start_time: 10, end_time: 15 },
    { id: 4, line_text: 'Na nagdala sa ating dalawa', start_time: 15, end_time: 20 },
    { id: 5, line_text: 'Panaginip na naging totoo', start_time: 20, end_time: 25 },
    { id: 6, line_text: 'Sa iisang awit ng pag-ibig', start_time: 25, end_time: 30 },
  ],
  102: [
    { id: 1, line_text: 'Bumalik ka sa aking alaala', start_time: 0, end_time: 5 },
    { id: 2, line_text: 'Lumalakad sa lumang daan', start_time: 5, end_time: 10 },
    { id: 3, line_text: 'Hawak ang kuwentong hindi matatapos', start_time: 10, end_time: 15 },
    { id: 4, line_text: 'Habang umiikot ang mundo', start_time: 15, end_time: 20 },
    { id: 5, line_text: 'Ang tawa mo ay musika', start_time: 20, end_time: 25 },
  ],
  103: [
    { id: 1, line_text: 'Pag-ibig na walang hanggan', start_time: 0, end_time: 5 },
    { id: 2, line_text: 'Inaawit ng puso ko', start_time: 5, end_time: 10 },
    { id: 3, line_text: 'Ikaw ang aking tadhana', start_time: 10, end_time: 15 },
    { id: 4, line_text: 'Akin ka na lang, mahal', start_time: 15, end_time: 20 },
  ],
  110: [
    { id: 1, line_text: 'Kahit kailan, palagi kang nasa isip', start_time: 0, end_time: 5 },
    { id: 2, line_text: 'Naglalakad sa hangin ng pag-ibig', start_time: 5, end_time: 10 },
    { id: 3, line_text: 'Ang kwento natin ay parang isang awit', start_time: 10, end_time: 15 },
    { id: 4, line_text: 'At sa bawat himig ako ay iyo', start_time: 15, end_time: 20 },
  ],
  111: [
    { id: 1, line_text: 'Sa gabi ng mga tala', start_time: 0, end_time: 5 },
    { id: 2, line_text: 'Isang lihim ang bumabalot', start_time: 5, end_time: 10 },
    { id: 3, line_text: 'Walang hanggan ang awit natin', start_time: 10, end_time: 15 },
    { id: 4, line_text: 'Hawak ang tila himala', start_time: 15, end_time: 20 },
  ],
  120: [
    { id: 1, line_text: 'Sa ilalim ng buwan', start_time: 0, end_time: 5 },
    { id: 2, line_text: 'Ating kwento ay sumisikò', start_time: 5, end_time: 10 },
    { id: 3, line_text: 'Bawat pangarap ay may daan', start_time: 10, end_time: 15 },
    { id: 4, line_text: 'At sa hangin ang awit mo', start_time: 15, end_time: 20 },
  ],
};

export const filterSongs = (songs: Song[], search: string, filter: string) => {
  const normalizedSearch = search.trim().toLowerCase();
  return songs.filter((song) => {
    const matchesSearch =
      !normalizedSearch ||
      song.title.toLowerCase().includes(normalizedSearch) ||
      song.artist.toLowerCase().includes(normalizedSearch);
    const matchesFilter =
      filter === 'All' ||
      (filter === 'OPM' && song.is_opm) ||
      (filter === 'Trending' && song.popularity >= 90) ||
      song.genre === filter;
    return matchesSearch && matchesFilter;
  });
};
