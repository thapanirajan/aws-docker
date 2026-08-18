import "./App.css";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useRef, useMemo, useState, useEffect } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { editor } from "monaco-editor";

function App() {
  const [username, setUsername] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("username") || "";
    } catch (e) {
      return "";
    }
  });

  const [users, setUsers] = useState([]);
  const editorRef = useRef(null);
  const [nameInput, setNameInput] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("username") || "";
    } catch (e) {
      return "";
    }
  });

  const ydc = useMemo(() => new Y.Doc(), []);

  const yText = useMemo(() => ydc.getText("monaco"), [ydc]);

  const handleMount = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (username && editorRef.current) {
      const provider = new SocketIOProvider(
        "http://localhost:3000",
        "monaco",
        ydc,
        { autoConnect: true },
      );

      provider.awareness.setLocalStateField("user", { username });

      provider.awareness.on("change", () => {
        const states = Array.from(provider.awareness.getStates().values());
        setUsers(
          states
            .map((state) => state.user)
            .filter((user) => Boolean(user.username)),
        );
      });
      const monacoBinding = new MonacoBinding(
        yText,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        provider.awareness,
      );
    }
  }, [editorRef.current, username]);

  if (!username) {
    const handleJoin = (e) => {
      e.preventDefault();
      const trimmed = nameInput.trim();
      if (!trimmed) return;
      setUsername(trimmed);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("username", trimmed);
        window.history.pushState({ username: trimmed }, "", url.toString());
      } catch (err) {
        // ignore
      }
    };

    return (
      <main className="h-screen w-full bg-gray-950 flex p-4 items-center justify-center">
        <form
          onSubmit={handleJoin}
          className="w-full max-w-sm bg-neutral-800 p-6 rounded-lg"
        >
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Username
          </label>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter username"
            className="w-full px-3 py-2 rounded-md bg-gray-900 text-white focus:outline-none"
            autoFocus
          />
          <div className="mt-4 text-right">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-400 text-black rounded-md hover:opacity-90"
            >
              Join
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-gray-950 p-4">
      <div className="max-w-full mx-auto h-full flex gap-4">
        <aside className="h-full w-64 bg-neutral-800/60 backdrop-blur rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-400">Live Editor</h2>
            <span className="text-sm text-gray-300">{username}</span>
          </div>

          <div className="text-xs uppercase text-gray-400 mb-2">Active Users</div>
          <div className="flex-1 overflow-auto">
            {users && users.length > 0 ? (
              <ul className="space-y-3">
                {users.map((u, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-amber-400 flex items-center justify-center text-black font-medium">
                      {u.username ? u.username.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <div className="text-sm text-gray-100">{u.username}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-400">No users online</div>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={() => {
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.delete("username");
                  window.history.pushState({}, "", url.toString());
                } catch (e) {
                  // ignore
                }
                window.location.reload();
              }}
              className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600"
            >
              Leave Session
            </button>
          </div>
        </aside>

        <section className="flex-1 flex flex-col bg-neutral-800 rounded-lg overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="text-sm text-amber-400 font-semibold">/src/index.js</div>
              <div className="text-xs text-gray-400">JavaScript</div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-1 bg-amber-400 text-black rounded-md hover:opacity-95">Run</button>
              <div className="text-sm text-gray-300">Connected</div>
            </div>
          </header>

          <div className="flex-1">
            <Editor
              height="calc(100vh - 5.5rem)"
              defaultLanguage="javascript"
              defaultValue="// Start coding collaboratively\nfunction hello() {\n  console.log('Hello from the live editor')\n}\n"
              theme="vs-dark"
              onMount={handleMount}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
