import { useEffect, useState, useRef } from 'react';
import { normalizeText, levenshtein } from '../utils/TextCheck';
import styles from "./Game.module.css"

type PokemonData = {
    name: string;
    sprite: string;
};

export default function Game() {
    const [pokemon, setPokemon] = useState<PokemonData | null>(null);
    const [guess, setGuess] = useState('');
    const [isRevealed, setIsRevealed] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [soundOn, setSoundOn] = useState(false);
    const [score, setScore] = useState(0);
    const [totalGuesses, setTotalGuesses] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);
    const whosThatSound = useRef(new Audio("/sounds/whos-that.mp3"));
    const correctSound = useRef(new Audio("/sounds/correct.mp3"));
    const wrongSound = useRef(new Audio("/sounds/wrong.mp3"));
    const clefairyVineSound = useRef(new Audio("/sounds/clefairy-vine.mp3"));

    const playFeedback = (isCorrect: boolean) => {
        if (!soundOn) return;
        const audio = isCorrect ? correctSound.current : wrongSound.current;

        try {
            audio.pause();
            audio.currentTime = 0;
            audio.play().catch(() => { });
        } catch (err) {
            console.warn("Sound error:", err);
        }
    };
    // Fetch a random Pokémon
    const fetchRandomPokemon = async (): Promise<void> => {
        let attempts = 0;
        while (attempts < 15) {
            const id = Math.floor(Math.random() * 898) + 1;
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/35`);
            const data = await res.json();

            const sprite = data.sprites.other['official-artwork'].front_default;
            const speciesRes = await fetch(data.species.url);
            const speciesData = await speciesRes.json();
            const baseName = speciesData.name;
            if (sprite) {
                setPokemon({
                    name: baseName,
                    sprite: sprite,
                });
                setIsRevealed(false);
                setFeedback('');
                setGuess('');
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 10);
                break;
            }
            attempts++;
            console.error('Failed to find a Pokémon with a valid sprite after 5 tries.');
            setFeedback('Could not load a Pokémon. Please try again.');
        }
    };

    useEffect(() => {
        fetchRandomPokemon();
    }, []);

    const toggleSound = () => {
        setSoundOn(prev => {
            const next = !prev;
            if (!prev) {
                // Just turned ON
                whosThatSound.current.play().catch(() => {
                    console.warn("Failed to play sound");
                });
            }
            return next;
        });
    };

    const checkClefairyVine = (name: string, guess: string) => {
        const isClefairy = name === "clefairy";
        const isPikachuGuess = guess === "pikachu";

        if (isClefairy && isPikachuGuess) {
            clefairyVineSound.current.currentTime = 0;
            clefairyVineSound.current.play().catch(() => console.warn("Vine sound failed"));
            setFeedback("Fuuuuuuuuuck")
            setIsRevealed(true);
            return true;
        }
        return false;
    }

    const handleSubmit = () => {
        if (!pokemon) return;
        const userGuess = normalizeText(guess.trim().toLowerCase());
        const targetName = normalizeText(pokemon.name.toLowerCase());
        if (checkClefairyVine(pokemon.name, userGuess)) {
            return;
        }
        const distance = levenshtein(userGuess, targetName);
        const correct = distance <= 2;
        const capitalizedName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

        if (correct) {
            setFeedback('Correct!');
            playFeedback(true);
            setScore(prev => prev + 1);

        } else {
            setFeedback(`Oops! It was ${capitalizedName}`);
            playFeedback(false);
        }
        setIsRevealed(true);
        setTotalGuesses(prev => prev + 1);
        setTimeout(() => nextButtonRef.current?.focus(), 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isRevealed) {
                fetchRandomPokemon();
            } else {
                handleSubmit();
            }
        }
    };

    return (
        <div className={styles.gameContainer}>
            <h1 className={styles.title}>Who's That PokéMon?</h1>
            <div className={styles.bezelWrapper}>
                <div className={styles.crtBox}>
                    <button onClick={toggleSound} className={styles.soundToggle} aria-label="Toggle sound">
                        <i className={`fa-solid ${soundOn ? "fa-volume-high" : "fa-volume-off"}`}></i>
                    </button>
                    <div className={styles.scoreDisplay}>
                        Score: {score}/{totalGuesses}
                    </div>
                    <div className={styles.battleZone}>
                        <div className={styles.leftSide}>
                            <img src="/assets/burst.png" className={styles.burst} alt="burst" />
                            {!pokemon ? (
                                <div className={styles.loaderWrapper}>
                                    <img
                                        src="/assets/pokeball.png"
                                        alt="Loading Poké Ball"
                                        className={`${styles.loader} animate__animated animate__zoomIn`}
                                    />
                                    <p className={styles.loadingText}>Loading…</p>
                                </div>
                            ) : (
                                <img
                                    src={pokemon.sprite}
                                    alt="Who's that Pokémon?"
                                    className={`${styles.sprite} ${isRevealed ? styles.revealed : ''}`}
                                />
                            )}
                        </div>
                        <div className={styles.rightSide}>
                            <input
                                ref={inputRef}
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="?"
                                disabled={isRevealed}
                            />
                            <button onClick={isRevealed ? fetchRandomPokemon : handleSubmit} ref={nextButtonRef}>
                                {isRevealed ? 'Next Pokémon' : 'Submit'}
                            </button>
                            <div className={styles.feedback}>
                                {feedback && <p>{feedback}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}