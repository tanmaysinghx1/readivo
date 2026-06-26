import { Injectable, signal } from '@angular/core';

export interface Highlight {
  id: string;
  text: string;
  color: 'yellow' | 'teal' | 'rose';
  note?: string;
  createdAt: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  rating: number;
  readTime: string;
  coverGradient: string;
  coverTextColor: string;
  
  // Immersive content for reading
  chapters: { title: string; paragraphs: string[] }[];
  
  // User specific progress & annotations
  progress: number; // Percentage (0 - 100)
  highlights: Highlight[];
  inShelf: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private readonly STORAGE_KEY = 'readivo_user_library_data';
  
  // Signal containing the master list of books with progress & highlights
  public readonly books = signal<Book[]>([]);

  // Default books data structure
  private readonly defaultBooks: Omit<Book, 'progress' | 'highlights' | 'inShelf'>[] = [
    {
      id: '1',
      title: 'Meditations',
      author: 'Marcus Aurelius',
      category: 'Philosophy',
      description: 'A series of personal writings by the Roman Emperor, recording private notes to himself on Stoic philosophy.',
      rating: 4.9,
      readTime: '3h 40m',
      coverGradient: 'from-amber-700 via-amber-800 to-stone-900',
      coverTextColor: 'text-amber-100',
      chapters: [
        {
          title: 'Book IV: The Inner Citadel',
          paragraphs: [
            'Remember this: that very little is needed to make a happy life. It is all within yourself, in your way of thinking. Therefore, if you are able, remove all anxiety and let your mind rest in tranquility. For the mind can shape its own sanctuary.',
            'Look inward. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig. Never seek happiness in external things; the soul that is dependent on others is always in peril.',
            'We are habitually hurt not by the events themselves, but by our opinion and judgment of them. Remove the judgment, and the hurt vanishes. A man is only as unhappy as he has convinced himself he is.',
            'Let the mind be untouched by the agitations of the flesh, whether they be painful or pleasant. It should not blend with them, but wall itself off and confine those passions to their own physical limits. When they rise into the mind through that other sympathy, then you must not strive to resist the sensation, but let the understanding maintain its own sovereign rule.',
            'Time is a river, a fierce torrent of things that come into being; no sooner is a thing brought to sight than it is swept away and another takes its place, and this too will be swept away.',
            'Everything which happens happens justly, and if you observe carefully, you will find it to be so. I do not mean only in accordance with the natural order of things, but in accordance with justice, as if it were distributed by one who assigns to each their due.'
          ]
        }
      ]
    },
    {
      id: '2',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      category: 'Fiction',
      description: 'The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan in 1920s Long Island.',
      rating: 4.7,
      readTime: '4h 15m',
      coverGradient: 'from-indigo-900 via-slate-900 to-stone-950',
      coverTextColor: 'text-indigo-200',
      chapters: [
        {
          title: 'Chapter 1: The Green Light',
          paragraphs: [
            'In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since. "Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven’t had the advantages that you’ve had."',
            'He didn’t say any more, but we’ve always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I’m inclined to reserve all judgments, a habit that has opened up many curious natures to me.',
            'Reserving judgments is a matter of infinite hope. I am still a little afraid of missing something if I forget that, as my father snobbishly suggested, and I snobbishly repeat, a sense of the fundamental decencies is parcelled out unequally at birth.',
            'When I came back from the East last autumn I felt that I wanted the world to be in uniform and at a sort of moral attention forever; I wanted no more riotous excursions with privileged glimpses into the human heart. Only Gatsby, the man who gives his name to this book, was exempt from my reaction—Gatsby, who represented everything for which I have an unaffected scorn.',
            'If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life, as if he were related to one of those intricate machines that register earthquakes ten thousand miles away.',
            'This responsiveness had nothing to do with that flabby impressionability which is dignified under the name of the "creative temperament"—it was an extraordinary gift for hope, a romantic readiness such as I have never found in any other person and which it is not likely I shall ever find again.'
          ]
        }
      ]
    },
    {
      id: '3',
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      category: 'Science',
      description: 'A landmark volume in science writing by one of the great minds of our time, exploring the origins and fate of our universe.',
      rating: 4.8,
      readTime: '6h 10m',
      coverGradient: 'from-purple-900 via-violet-950 to-slate-950',
      coverTextColor: 'text-purple-200',
      chapters: [
        {
          title: 'Chapter 1: Our Picture of the Universe',
          paragraphs: [
            'A well-known scientist (some say it was Bertrand Russell) once gave a public lecture on astronomy. He described how the earth orbits around the sun and how the sun, in turn, orbits around the center of a vast collection of stars called our galaxy.',
            'At the end of the lecture, a little old lady at the back of the room stood up and said: "What you have told us is rubbish. The world is really a flat plate supported on the back of a giant tortoise."',
            'The scientist gave a superior smile before replying, "What is the tortoise standing on?" "You’re very clever, young man, very clever," said the old lady. "But it’s turtles all the way down!"',
            'Most people would find the picture of our universe as an infinite tower of tortoises rather ridiculous, but why do we think we know better? What do we know about the universe, and how do we know it? Where did the universe come from, and where is it going? Did the universe have a beginning, and if so, what happened before then?',
            'In order to talk about the nature of the universe and to discuss questions such as whether it has a beginning or an end, you have to be clear about what a scientific theory is. We shall take the simpleminded view that a theory is just a model of the universe, or a restricted part of it, and a set of rules that relate quantities in the model to observations.',
            'Any physical theory is always provisional, in the sense that it is only a hypothesis: you can never prove it. No matter how many times the results of experiments agree with some theory, you can never be sure that the next time the result will not contradict the theory.'
          ]
        }
      ]
    },
    {
      id: '4',
      title: 'Beyond Good and Evil',
      author: 'Friedrich Nietzsche',
      category: 'Philosophy',
      description: 'Nietzsche dramatically rejects traditional morality and explores the concept of the will to power and the free spirit.',
      rating: 4.6,
      readTime: '5h 20m',
      coverGradient: 'from-rose-900 via-red-950 to-neutral-950',
      coverTextColor: 'text-rose-200',
      chapters: [
        {
          title: 'Chapter 1: Prejudices of Philosophers',
          paragraphs: [
            'The Will to Truth, which is to tempt us to many a hazardous enterprise, this famous Truthfulness of which all philosophers have hitherto spoken with respect, what questions has this Will to Truth not laid before us! What strange, perplexing, questionable questions!',
            'It is already a long story; yet it seems to have hardly begun. Is it any wonder if we at last grow distrustful, lose patience, and turn impatiently away? That this Sphinx should have at last taught us too to ask questions?',
            'Who is it really that puts questions to us here? What really is this "Will to Truth" in us? In fact we made a long halt at the question as to the origin of this Will—until at last we came to an absolute standstill before a yet more fundamental question.',
            'We inquired about the value of this Will. Granted that we want truth: why not rather untruth? And uncertainty? Even ignorance? The problem of the value of truth presented itself before us, or did we present ourselves before the problem?',
            'Which of us is the Oedipus here? Which the Sphinx? It would seem to be a rendezvous of questions and doubts. And would you believe it, we have at last come to the conclusion that the problem has never been posed before—that we are the first to see it, to fix our eyes upon it, and to risk it?',
            'For there is a risk in it, and perhaps there is no greater risk. The falseness of an opinion is not for us any objection to it: it is here, perhaps, that our new language sounds most strangely. The question is, how far an opinion is life-furthering, life-preserving, species-preserving, perhaps even species-rearing.'
          ]
        }
      ]
    },
    {
      id: '5',
      title: 'Alice in Wonderland',
      author: 'Lewis Carroll',
      category: 'Fantasy',
      description: 'A young girl named Alice falls through a rabbit hole into a subterranean fantasy world populated by peculiar creatures.',
      rating: 4.5,
      readTime: '2h 45m',
      coverGradient: 'from-teal-800 via-emerald-950 to-stone-900',
      coverTextColor: 'text-teal-100',
      chapters: [
        {
          title: 'Chapter 1: Down the Rabbit-Hole',
          paragraphs: [
            'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"',
            'So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid) whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.',
            'There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural).',
            'But when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it.',
            'And burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge. In another moment down went Alice after it, never once considering how in the world she was to get out again.',
            'The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well. Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her.'
          ]
        }
      ]
    },
    {
      id: '6',
      title: 'The Art of War',
      author: 'Sun Tzu',
      category: 'Strategy',
      description: 'An ancient Chinese military treatise dating from the Late Spring and Autumn Period, attributed to the military strategist Sun Tzu.',
      rating: 4.8,
      readTime: '1h 50m',
      coverGradient: 'from-red-800 via-amber-950 to-stone-950',
      coverTextColor: 'text-amber-200',
      chapters: [
        {
          title: 'Chapter I: Laying Plans',
          paragraphs: [
            'Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.',
            'The art of war, then, is governed by five constant factors, to be taken into account in one’s deliberations, when seeking to determine the conditions obtaining in the field.',
            'These are: (1) The Moral Law; (2) Heaven; (3) Earth; (4) The Commander; (5) Method and discipline. The Moral Law causes the people to be in complete accord with their ruler, so that they will follow him regardless of their lives, undismayed by any danger.',
            'Heaven signifies night and day, cold and heat, times and seasons. Earth comprises distances, great and small; danger and security; open ground and narrow passes; the chances of life and death.',
            'The Commander stands for the virtues of wisdom, sincerely, benevolence, courage and strictness. Method and discipline are to be understood the marshalling of the army in its proper subdivisions, the graduations of rank among the officers, the maintenance of roads by which supplies may reach the army, and the control of military expenditure.',
            'These five heads should be familiar to every general: he who knows them will be victorious; he who knows them not will fail. Therefore, in your deliberations, when seeking to determine the military conditions, let them be made the basis of a comparison.'
          ]
        }
      ]
    }
  ];

  constructor() {
    this.loadFromLocalStorage();
  }

  // Load user progress & annotations from localStorage and merge with defaults
  private loadFromLocalStorage(): void {
    let userLibraryData: Record<string, { progress: number; highlights: Highlight[]; inShelf?: boolean }> = {};
    
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          userLibraryData = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.error('Failed to read from localStorage', e);
    }

    // Merge default books with user library progress data
    const mergedBooks = this.defaultBooks.map(b => {
      const userData = userLibraryData[b.id];
      return {
        ...b,
        progress: userData ? userData.progress : (b.id === '1' ? 42 : b.id === '2' ? 15 : b.id === '6' ? 100 : 0), // Default mock values
        highlights: userData ? userData.highlights : (b.id === '1' ? [
          {
            id: 'h1',
            text: 'tranquility',
            color: 'yellow' as const,
            note: '“No man is hurt but by himself.” This core Stoic concept reminds us that our internal judgment is the source of all our distress, not the external events themselves.',
            createdAt: Date.now() - 86400000
          }
        ] : []),
        inShelf: userData ? (userData.inShelf !== undefined ? userData.inShelf : true) : (b.id === '1' || b.id === '2' || b.id === '6')
      };
    });

    this.books.set(mergedBooks);
  }

  // Save current progress & annotations map to localStorage
  private saveToLocalStorage(): void {
    const dataToStore: Record<string, { progress: number; highlights: Highlight[]; inShelf: boolean }> = {};
    
    this.books().forEach(b => {
      dataToStore[b.id] = {
        progress: b.progress,
        highlights: b.highlights,
        inShelf: b.inShelf
      };
    });

    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
      }
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // Fetch a single book details by ID
  public getBookById(id: string): Book | undefined {
    return this.books().find(b => b.id === id);
  }

  // Update a book's reading progress percentage
  public updateProgress(id: string, progressPercentage: number): void {
    const updatedBooks = this.books().map(b => {
      if (b.id === id) {
        const validatedProgress = Math.min(100, Math.max(0, Math.round(progressPercentage)));
        return { ...b, progress: validatedProgress };
      }
      return b;
    });

    this.books.set(updatedBooks);
    this.saveToLocalStorage();
  }

  // Add a new highlight with optional note to a book
  public addHighlight(id: string, text: string, color: 'yellow' | 'teal' | 'rose', note?: string): Highlight {
    const newHighlight: Highlight = {
      id: 'h_' + Math.random().toString(36).substring(2, 11),
      text,
      color,
      note: note?.trim() || undefined,
      createdAt: Date.now()
    };

    const updatedBooks = this.books().map(b => {
      if (b.id === id) {
        return {
          ...b,
          highlights: [...b.highlights, newHighlight]
        };
      }
      return b;
    });

    this.books.set(updatedBooks);
    this.saveToLocalStorage();
    return newHighlight;
  }

  // Delete an existing highlight by ID
  public deleteHighlight(id: string, highlightId: string): void {
    const updatedBooks = this.books().map(b => {
      if (b.id === id) {
        return {
          ...b,
          highlights: b.highlights.filter(h => h.id !== highlightId)
        };
      }
      return b;
    });

    this.books.set(updatedBooks);
    this.saveToLocalStorage();
  }

  // Add a book to the user's reading shelf
  public addToShelf(id: string): void {
    const updatedBooks = this.books().map(b => b.id === id ? { ...b, inShelf: true } : b);
    this.books.set(updatedBooks);
    this.saveToLocalStorage();
  }

  // Remove a book from the user's reading shelf
  public removeFromShelf(id: string): void {
    const updatedBooks = this.books().map(b => b.id === id ? { ...b, inShelf: false } : b);
    this.books.set(updatedBooks);
    this.saveToLocalStorage();
  }

  // Edit/update an existing highlight's study note text
  public updateHighlightNote(bookId: string, highlightId: string, note: string): void {
    const updatedBooks = this.books().map(b => {
      if (b.id === bookId) {
        const updatedHighlights = b.highlights.map(h => 
          h.id === highlightId ? { ...h, note: note.trim() || undefined } : h
        );
        return { ...b, highlights: updatedHighlights };
      }
      return b;
    });
    this.books.set(updatedBooks);
    this.saveToLocalStorage();
  }

  // Add a newly created book to the system catalog (admin simulation)
  public addCustomBook(bookData: Omit<Book, 'progress' | 'highlights' | 'inShelf'>): void {
    const newBook: Book = {
      ...bookData,
      progress: 0,
      highlights: [],
      inShelf: false // Starts in the browse catalog
    };
    this.books.set([...this.books(), newBook]);
    this.saveToLocalStorage();
  }
}
