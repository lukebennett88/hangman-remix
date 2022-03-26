import type { Game, Guess, User } from "@prisma/client";

import { prisma } from "~/db.server";
import { getRandomWord } from "~/utils";

export type { Game } from "@prisma/client";

export function getGame({
  id,
  userId,
}: Pick<Game, "id"> & {
  userId: User["id"];
}) {
  return prisma.game.findFirst({
    where: { id, userId },
  });
}

export function getGameListItems({ userId }: { userId: User["id"] }) {
  return prisma.game.findMany({
    where: { userId },
    select: {
      createdAt: true,
      id: true,
      word: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function getGuesses({ gameId }: { gameId: Game["id"] }) {
  return prisma.guess.findMany({
    where: { gameId },
    select: {
      letter: true,
    },
  });
}

export function addGuess({
  gameId,
  letter,
}: {
  gameId: Game["id"];
  letter: Guess["letter"];
}) {
  return prisma.game.update({
    where: { id: gameId },
    data: {
      Guess: {
        create: {
          letter,
        },
      },
    },
  });
}

export function createGame({ userId }: { userId: User["id"] }) {
  return prisma.game.create({
    data: {
      word: getRandomWord(),
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function deleteGame({
  id,
  userId,
}: Pick<Game, "id"> & { userId: User["id"] }) {
  return prisma.game.deleteMany({
    where: { id, userId },
  });
}
