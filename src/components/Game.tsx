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
    const inputRef = useRef<HTMLInputElement>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);

    // Fetch a random Pokémon
    const fetchRandomPokemon = async (): Promise<void> => {
        let attempts = 0;
        while (attempts < 15) {
            const id = Math.floor(Math.random() * 898) + 1;
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const data = await res.json();

            const sprite = data.sprites.other['official-artwork'].front_default;
            const rawName = data.name;
            const cleanName = rawName.split('-')[0];
            if (sprite) {
                setPokemon({
                    name: cleanName,
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

    const handleSubmit = () => {
        if (!pokemon) return;
        const userGuess = normalizeText(guess.trim().toLowerCase());
        const targetName = normalizeText(pokemon.name.toLowerCase());

        const distance = levenshtein(userGuess, targetName);
        const correct = distance <= 2;
        const capitalizedName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

        if (correct) {
            setFeedback('Correct! 🎉');
        } else {
            setFeedback(`Oops! It was ${capitalizedName}`);
        }
        setIsRevealed(true);
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

    if (!pokemon) return <p>Loading Pokémon...</p>;

    return (
        <div className={styles.gameContainer}>
            <h1 className={styles.title}>Who's That Pokémon?</h1>
            <div className={styles.bezelWrapper}>

                <div className={styles.crtBox}>
                    <div className={styles.battleZone}>
                        <div className={styles.leftSide}>
                            <img src="/assets/burst.png" className={styles.burst} alt="burst" />
                            <img
                                src={pokemon.sprite}
                                alt="Who's that Pokémon?"
                                className={`${styles.sprite} ${isRevealed ? styles.revealed : ''}`}
                            />
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