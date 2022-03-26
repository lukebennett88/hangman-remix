import { formatRelative } from "date-fns";
import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  NavLink,
  Outlet,
  redirect,
  useLoaderData,
} from "remix";

import { createGame, getGameListItems } from "~/models/game.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

type LoaderData = {
  gameListItems: Awaited<ReturnType<typeof getGameListItems>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const gameListItems = await getGameListItems({ userId });
  return json<LoaderData>({ gameListItems });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const game = await createGame({ userId });

  return redirect(`/games/${game.id}`);
};

export default function GamesPage() {
  const { gameListItems } = useLoaderData<LoaderData>();
  const user = useUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">Games</Link>
        </h1>
        <p>{user.email}</p>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>

      <main className="flex h-full bg-white">
        <div className="h-full w-80 border-r bg-gray-50">
          <Form method="post">
            <button type="submit" className="block p-4 text-xl text-blue-500">
              + New Game
            </button>
          </Form>

          <hr />

          {gameListItems.length === 0 ? (
            <p className="p-4">No games yet</p>
          ) : (
            <ol>
              {gameListItems.map((game) => (
                <li key={game.id}>
                  <NavLink
                    className={({ isActive }) =>
                      `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
                    }
                    to={game.id}
                  >
                    🎲 {formatRelative(new Date(game.createdAt), new Date())}
                  </NavLink>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
