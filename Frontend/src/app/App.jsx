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

  const [users, setUsers] = useState();
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
    <>
      <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
        <aside className="h-full w-1/5 bg-amber-50 rounded-lg"></aside>

        <section className=" w-4/5 bg-neutral-800 rounded-lg">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            defaultValue="// some content"
            theme="vs-dark"
            onMount={handleMount}
          />
        </section>
      </main>
    </>
  );
}

export default App;
