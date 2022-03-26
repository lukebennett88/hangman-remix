import { Guess } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import ReactConfetti from "react-confetti";
import type { ActionFunction, LoaderFunction } from "remix";
import { Form, json, redirect, useCatch, useLoaderData } from "remix";
import invariant from "tiny-invariant";

import {
  addGuess,
  deleteGame,
  Game,
  getGame,
  getGuesses,
} from "~/models/game.server";
import { requireUserId } from "~/session.server";

const UPDATE = "update";
const DELETE = "delete";
const NUM_GUESSES = 10;

type LoaderData = {
  game: Game;
  guesses: Array<Pick<Guess, "letter">>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.gameId, "gameId not found");

  const game = await getGame({ userId, id: params.gameId });
  if (!game) {
    throw new Response("Not Found", { status: 404 });
  }
  const guesses = await getGuesses({ gameId: game.id });

  return json<LoaderData>({ game, guesses });
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  let action = formData.get("action");
  switch (action) {
    case UPDATE: {
      const letter = formData.get("letter");
      if (letter) {
        console.log(letter);
        await addGuess({
          gameId: params.gameId!,
          letter: letter.toString(),
        });
      }
      return null;
    }

    case DELETE: {
      const userId = await requireUserId(request);
      invariant(params.gameId, "gameId not found");
      await deleteGame({ userId, id: params.gameId });
      return redirect("/games");
    }

    default: {
      throw new Error("Unexpected action");
    }
  }
};

export default function GameDetailsPage() {
  const { game, guesses } = useLoaderData<LoaderData>();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    formRef.current?.reset();
    inputRef.current?.focus();
  }, [guesses]);

  const [gameState, setGameState] = useState<"idle" | "won" | "lost">("idle");
  useEffect(() => {
    if (guesses.length >= NUM_GUESSES) {
      setGameState("lost");
    }
    if (
      game.word
        .split("")
        .every((letter) => guesses.some((g) => g.letter === letter))
    ) {
      setGameState("won");
    }
  }, [game.word, guesses]);

  const heading = {
    won: "You won!",
    lost: "You lost!",
    idle: "Guess the word",
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{heading[gameState]}</h1>
      <h2>Remaining guesses: {NUM_GUESSES - guesses.length}</h2>
      {guesses.length > NUM_GUESSES ? (
        <p>Sorry, you lost!</p>
      ) : (
        <>
          <ol className="flex gap-2">
            {game.word.split("").map((letter, index) => (
              <li
                key={index}
                className="w-10 h-10 border flex items-center justify-center"
              >
                {guesses.find((guess) => guess.letter === letter) ? letter : ""}
              </li>
            ))}
          </ol>
          <Form ref={formRef} method="post" className="flex flex-col gap-4">
            <label htmlFor="letter">
              <span className="block font-bold">Letter</span>
              <input
                ref={inputRef}
                id="letter"
                name="letter"
                type="text"
                maxLength={1}
                className="h-10 w-10 flex items-center justify-center border-gray-200"
              />
            </label>
            {gameState === "idle" && (
              <button
                type="submit"
                name="action"
                value={UPDATE}
                className="rounded self-start bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
              >
                Submit guess
              </button>
            )}
          </Form>
          {guesses.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-bold">Guesses</h2>
              <ol className="flex gap-2">
                {guesses.map((guess, index) => (
                  <li key={index}>{guess.letter}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
      <hr className="my-4" />
      <Form method="post" className="flex flex-col gap-4">
        <button
          type="submit"
          name="action"
          value={DELETE}
          className="rounded bg-blue-500 self-end py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Delete
        </button>
      </Form>
      {gameState === "won" && <Confetti />}
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>game not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function Confetti(): JSX.Element | null {
  const { width, height } = useWindowSize();

  const [shouldRecycleConfetti, setShouldRecycleConfetti] = useState(true);

  // Hide confetti after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShouldRecycleConfetti(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 bottom-0 z-50 pointer-events-none"
    >
      <ReactConfetti
        recycle={shouldRecycleConfetti}
        numberOfPieces={400}
        height={height}
        width={width}
      />
    </div>
  );
}

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    // Add event listener
    window.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}
