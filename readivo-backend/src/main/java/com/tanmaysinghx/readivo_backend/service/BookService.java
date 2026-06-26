package com.tanmaysinghx.readivo_backend.service;

import com.tanmaysinghx.readivo_backend.dto.BookResponse;
import com.tanmaysinghx.readivo_backend.dto.HighlightRequest;
import com.tanmaysinghx.readivo_backend.model.*;
import com.tanmaysinghx.readivo_backend.repository.BookRepository;
import com.tanmaysinghx.readivo_backend.repository.HighlightRepository;
import com.tanmaysinghx.readivo_backend.repository.ReadingProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private HighlightRepository highlightRepository;

    @Autowired
    private ReadingProgressRepository progressRepository;

    // Retrieve the catalog for a user, merging static books with user progress and highlights
    @Transactional(readOnly = true)
    public List<BookResponse> getAllBooksForUser(Long userId) {
        List<Book> books = bookRepository.findAll();
        
        // Fetch progress map for this user if authenticated
        Map<String, ReadingProgress> progressMap = new HashMap<>();
        Map<String, List<Highlight>> highlightsMap = new HashMap<>();
        
        if (userId != null) {
            progressRepository.findByIdUserId(userId)
                    .forEach(p -> progressMap.put(p.getId().getBookId(), p));
            
            highlightRepository.findByUserId(userId)
                    .stream()
                    .collect(Collectors.groupingBy(Highlight::getBookId))
                    .forEach(highlightsMap::put);
        }

        return books.stream().map(b -> {
            ReadingProgress progress = progressMap.get(b.getId());
            List<Highlight> highlights = highlightsMap.getOrDefault(b.getId(), new ArrayList<>());

            int progressPercent = 0;
            boolean inShelf = false;

            if (progress != null) {
                progressPercent = progress.getProgress();
                inShelf = progress.getInShelf();
            }

            return BookResponse.builder()
                    .id(b.getId())
                    .title(b.getTitle())
                    .author(b.getAuthor())
                    .category(b.getCategory())
                    .description(b.getDescription())
                    .rating(b.getRating())
                    .readTime(b.getReadTime())
                    .coverGradient(b.getCoverGradient())
                    .coverTextColor(b.getCoverTextColor())
                    .chapters(b.getChapters())
                    .progress(progressPercent)
                    .inShelf(inShelf)
                    .highlights(highlights)
                    .build();
        }).collect(Collectors.toList());
    }

    // Fetch a single book by ID, merging progress and highlights
    @Transactional(readOnly = true)
    public Optional<BookResponse> getBookForUser(Long userId, String bookId) {
        return bookRepository.findById(bookId).map(b -> {
            int progressPercent = 0;
            boolean inShelf = false;
            List<Highlight> highlights = new ArrayList<>();

            if (userId != null) {
                Optional<ReadingProgress> progressOpt = progressRepository.findByUserIdAndBookId(userId, bookId);
                if (progressOpt.isPresent()) {
                    progressPercent = progressOpt.get().getProgress();
                    inShelf = progressOpt.get().getInShelf();
                }
                highlights = highlightRepository.findByUserIdAndBookId(userId, bookId);
            }

            return BookResponse.builder()
                    .id(b.getId())
                    .title(b.getTitle())
                    .author(b.getAuthor())
                    .category(b.getCategory())
                    .description(b.getDescription())
                    .rating(b.getRating())
                    .readTime(b.getReadTime())
                    .coverGradient(b.getCoverGradient())
                    .coverTextColor(b.getCoverTextColor())
                    .chapters(b.getChapters())
                    .progress(progressPercent)
                    .inShelf(inShelf)
                    .highlights(highlights)
                    .build();
        });
    }

    // Save or update reading progress percentage & shelf status
    @Transactional
    public void updateProgress(Long userId, String bookId, Integer progressPercent, Boolean inShelf) {
        ReadingProgressId progressId = new ReadingProgressId(userId, bookId);
        ReadingProgress progress = progressRepository.findById(progressId)
                .orElse(new ReadingProgress(progressId, 0, true, null));

        if (progressPercent != null) {
            progress.setProgress(Math.min(100, Math.max(0, progressPercent)));
        }
        if (inShelf != null) {
            progress.setInShelf(inShelf);
        }

        progressRepository.save(progress);
    }

    // Add a new highlight with an optional note
    @Transactional
    public Highlight addHighlight(Long userId, String bookId, HighlightRequest req) {
        String highlightId = req.getId();
        if (highlightId == null || highlightId.trim().isEmpty()) {
            highlightId = "h_" + UUID.randomUUID().toString().substring(0, 8);
        }

        Highlight highlight = new Highlight(
                highlightId,
                bookId,
                userId,
                req.getText(),
                req.getColor(),
                req.getNote(),
                System.currentTimeMillis()
        );

        return highlightRepository.save(highlight);
    }

    // Update an existing highlight's study note text
    @Transactional
    public Optional<Highlight> updateHighlightNote(Long userId, String highlightId, String note) {
        return highlightRepository.findById(highlightId)
                .filter(h -> h.getUserId().equals(userId))
                .map(h -> {
                    h.setNote(note == null ? null : note.trim());
                    return highlightRepository.save(h);
                });
    }

    // Delete a highlight
    @Transactional
    public boolean deleteHighlight(Long userId, String highlightId) {
        return highlightRepository.findById(highlightId)
                .filter(h -> h.getUserId().equals(userId))
                .map(h -> {
                    highlightRepository.delete(h);
                    return true;
                }).orElse(false);
    }

    // Create and save a brand new book (admin dashboard simulation)
    @Transactional
    public Book createBook(Book book) {
        return bookRepository.save(book);
    }

    // Seed the MySQL database with our 6 masterpieces on application startup if catalog is empty
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedCatalog() {
        if (bookRepository.count() > 0) {
            return;
        }

        List<Book> seedBooks = new ArrayList<>();

        // 1. Meditations
        Book meditations = new Book(
                "1",
                "Meditations",
                "Marcus Aurelius",
                "Philosophy",
                "A series of personal writings by the Roman Emperor, recording private notes to himself on Stoic philosophy.",
                4.9,
                "3h 40m",
                "from-amber-700 via-amber-800 to-stone-900",
                "text-amber-100",
                new ArrayList<>()
        );
        Chapter medChapter = new Chapter();
        medChapter.setTitle("Book IV: The Inner Citadel");
        medChapter.setParagraphs(Arrays.asList(
                "Remember this: that very little is needed to make a happy life. It is all within yourself, in your way of thinking. Therefore, if you are able, remove all anxiety and let your mind rest in tranquility. For the mind can shape its own sanctuary.",
                "Look inward. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig. Never seek happiness in external things; the soul that is dependent on others is always in peril.",
                "We are habitually hurt not by the events themselves, but by our opinion and judgment of them. Remove the judgment, and the hurt vanishes. A man is only as unhappy as he has convinced himself he is.",
                "Let the mind be untouched by the agitations of the flesh, whether they be painful or pleasant. It should not blend with them, but wall itself off and confine those passions to their own physical limits. When they rise into the mind through that other sympathy, then you must not strive to resist the sensation, but let the understanding maintain its own sovereign rule.",
                "Time is a river, a fierce torrent of things that come into being; no sooner is a thing brought to sight than it is swept away and another takes its place, and this too will be swept away.",
                "Everything which happens happens justly, and if you observe carefully, you will find it to be so. I do not mean only in accordance with the natural order of things, but in accordance with justice, as if it were distributed by one who assigns to each their due."
        ));
        meditations.getChapters().add(medChapter);
        seedBooks.add(meditations);

        // 2. The Great Gatsby
        Book gatsby = new Book(
                "2",
                "The Great Gatsby",
                "F. Scott Fitzgerald",
                "Fiction",
                "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan in 1920s Long Island.",
                4.7,
                "4h 15m",
                "from-indigo-900 via-slate-900 to-stone-950",
                "text-indigo-200",
                new ArrayList<>()
        );
        Chapter gatsbyChapter = new Chapter();
        gatsbyChapter.setTitle("Chapter 1: The Green Light");
        gatsbyChapter.setParagraphs(Arrays.asList(
                "In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since. \"Whenever you feel like criticizing any one,\" he told me, \"just remember that all the people in this world haven’t had the advantages that you’ve had.\"",
                "He didn’t say any more, but we’ve always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I’m inclined to reserve all judgments, a habit that has opened up many curious natures to me.",
                "Reserving judgments is a matter of infinite hope. I am still a little afraid of missing something if I forget that, as my father snobbishly suggested, and I snobbishly repeat, a sense of the fundamental decencies is parcelled out unequally at birth.",
                "When I came back from the East last autumn I felt that I wanted the world to be in uniform and at a sort of moral attention forever; I wanted no more riotous excursions with privileged glimpses into the human heart. Only Gatsby, the man who gives his name to this book, was exempt from my reaction—Gatsby, who represented everything for which I have an unaffected scorn.",
                "If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life, as if he were related to one of those intricate machines that register earthquakes ten thousand miles away.",
                "This responsiveness had nothing to do with that flabby impressionability which is dignified under the name of the \"creative temperament\"—it was an extraordinary gift for hope, a romantic readiness such as I have never found in any other person and which it is not likely I shall ever find again."
        ));
        gatsby.getChapters().add(gatsbyChapter);
        seedBooks.add(gatsby);

        // 3. A Brief History of Time
        Book hawking = new Book(
                "3",
                "A Brief History of Time",
                "Stephen Hawking",
                "Science",
                "A landmark volume in science writing by one of the great minds of our time, exploring the origins and fate of our universe.",
                4.8,
                "6h 10m",
                "from-purple-900 via-violet-950 to-slate-950",
                "text-purple-200",
                new ArrayList<>()
        );
        Chapter hawkingChapter = new Chapter();
        hawkingChapter.setTitle("Chapter 1: Our Picture of the Universe");
        hawkingChapter.setParagraphs(Arrays.asList(
                "A well-known scientist (some say it was Bertrand Russell) once gave a public lecture on astronomy. He described how the earth orbits around the sun and how the sun, in turn, orbits around the center of a vast collection of stars called our galaxy.",
                "At the end of the lecture, a little old lady at the back of the room stood up and said: \"What you have told us is rubbish. The world is really a flat plate supported on the back of a giant tortoise.\"",
                "The scientist gave a superior smile before replying, \"What is the tortoise standing on?\" \"You’re very clever, young man, very clever,\" said the old lady. \"But it’s turtles all the way down!\"",
                "Most people would find the picture of our universe as an infinite tower of tortoises rather ridiculous, but why do we think we know better? What do we know about the universe, and how do we know it? Where did the universe come from, and where is it going? Did the universe have a beginning, and if so, what happened before then?",
                "In order to talk about the nature of the universe and to discuss questions such as whether it has a beginning or an end, you have to be clear about what a scientific theory is. We shall take the simpleminded view that a theory is just a model of the universe, or a restricted part of it, and a set of rules that relate quantities in the model to observations.",
                "Any physical theory is always provisional, in the sense that it is only a hypothesis: you can never prove it. No matter how many times the results of experiments agree with some theory, you can never be sure that the next time the result will not contradict the theory."
        ));
        hawking.getChapters().add(hawkingChapter);
        seedBooks.add(hawking);

        // 4. Beyond Good and Evil
        Book nietzsche = new Book(
                "4",
                "Beyond Good and Evil",
                "Friedrich Nietzsche",
                "Philosophy",
                "Nietzsche dramatically rejects traditional morality and explores the concept of the will to power and the free spirit.",
                4.6,
                "5h 20m",
                "from-rose-900 via-red-950 to-neutral-950",
                "text-rose-200",
                new ArrayList<>()
        );
        Chapter nietzscheChapter = new Chapter();
        nietzscheChapter.setTitle("Chapter 1: Prejudices of Philosophers");
        nietzscheChapter.setParagraphs(Arrays.asList(
                "The Will to Truth, which is to tempt us to many a hazardous enterprise, this famous Truthfulness of which all philosophers have hitherto spoken with respect, what questions has this Will to Truth not laid before us! What strange, perplexing, questionable questions!",
                "It is already a long story; yet it seems to have hardly begun. Is it any wonder if we at last grow distrustful, lose patience, and turn impatiently away? That this Sphinx should have at last taught us too to ask questions?",
                "Who is it really that puts questions to us here? What really is this \"Will to Truth\" in us? In fact we made a long halt at the question as to the origin of this Will—until at last we came to an absolute standstill before a yet more fundamental question.",
                "We inquired about the value of this Will. Granted that we want truth: why not rather untruth? And uncertainty? Even ignorance? The problem of the value of truth presented itself before us, or did we present ourselves before the problem?",
                "Which of us is the Oedipus here? Which the Sphinx? It would seem to be a rendezvous of questions and doubts. And would you believe it, we have at last come to the conclusion that the problem has never been posed before—that we are the first to see it, to fix our eyes upon it, and to risk it?",
                "For there is a risk in it, and perhaps there is no greater risk. The falseness of an opinion is not for us any objection to it: it is here, perhaps, that our new language sounds most strangely. The question is, how far an opinion is life-furthering, life-preserving, species-preserving, perhaps even species-rearing."
        ));
        nietzsche.getChapters().add(nietzscheChapter);
        seedBooks.add(nietzsche);

        // 5. Alice in Wonderland
        Book alice = new Book(
                "5",
                "Alice in Wonderland",
                "Lewis Carroll",
                "Fantasy",
                "A young girl named Alice falls through a rabbit hole into a subterranean fantasy world populated by peculiar creatures.",
                4.5,
                "2h 45m",
                "from-teal-800 via-emerald-950 to-stone-900",
                "text-teal-100",
                new ArrayList<>()
        );
        Chapter aliceChapter = new Chapter();
        aliceChapter.setTitle("Chapter 1: Down the Rabbit-Hole");
        aliceChapter.setParagraphs(Arrays.asList(
                "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, \"and what is the use of a book,\" thought Alice \"without pictures or conversations?\"",
                "So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid) whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.",
                "There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, \"Oh dear! Oh dear! I shall be late!\" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural).",
                "But when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it.",
                "And burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge. In another moment down went Alice after it, never once considering how in the world she was to get out again.",
                "The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well. Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her."
        ));
        alice.getChapters().add(aliceChapter);
        seedBooks.add(alice);

        // 6. The Art of War
        Book artOfWar = new Book(
                "6",
                "The Art of War",
                "Sun Tzu",
                "Strategy",
                "An ancient Chinese military treatise dating from the Late Spring and Autumn Period, attributed to the military strategist Sun Tzu.",
                4.8,
                "1h 50m",
                "from-red-800 via-amber-950 to-stone-950",
                "text-amber-200",
                new ArrayList<>()
        );
        Chapter artChapter = new Chapter();
        artChapter.setTitle("Chapter I: Laying Plans");
        artChapter.setParagraphs(Arrays.asList(
                "Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.",
                "The art of war, then, is governed by five constant factors, to be taken into account in one’s deliberations, when seeking to determine the conditions obtaining in the field.",
                "These are: (1) The Moral Law; (2) Heaven; (3) Earth; (4) The Commander; (5) Method and discipline. The Moral Law causes the people to be in complete accord with their ruler, so that they will follow him regardless of their lives, undismayed by any danger.",
                "Heaven signifies night and day, cold and heat, times and seasons. Earth comprises distances, great and small; danger and security; open ground and narrow passes; the chances of life and death.",
                "The Commander stands for the virtues of wisdom, sincerely, benevolence, courage and strictness. Method and discipline are to be understood the marshalling of the army in its proper subdivisions, the graduations of rank among the officers, the maintenance of roads by which supplies may reach the army, and the control of military expenditure.",
                "These five heads should be familiar to every general: he who knows them will be victorious; he who knows them not will fail. Therefore, in your deliberations, when seeking to determine the military conditions, let them be made the basis of a comparison."
        ));
        artOfWar.getChapters().add(artChapter);
        seedBooks.add(artOfWar);

        bookRepository.saveAll(seedBooks);
    }
}
