import type { ActionFunction } from "remix";
import { Form, redirect } from "remix";

import { createGame } from "~/models/game.server";
import { requireUserId } from "~/session.server";

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const game = await createGame({ userId });

  return redirect(`/games/${game.id}`);
};

export default function GameIndexPage() {
  return (
    <Form method="post">
      No game selected. Select a game on the left, or{" "}
      <button type="submit" className="text-blue-500 underline">
        create a new game.
      </button>
    </Form>
  );
}
