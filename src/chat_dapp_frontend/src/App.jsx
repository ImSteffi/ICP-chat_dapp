import React, { useState, useEffect } from "react";
import { createActor, chat_dapp_backend } from "declarations/chat_dapp_backend";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";

function App() {
  const [actor, setActor] = useState(chat_dapp_backend);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const authClient = await AuthClient.create();
      await new Promise((resolve, reject) => {
        authClient.login({
          identityProvider: `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/`,
          onSuccess: resolve,
          onError: reject,
        });
      });
      const identity = authClient.getIdentity();
      const agent = new HttpAgent({ identity });
      const authenticatedActor = createActor(
        process.env.CANISTER_ID_CHAT_DAPP_BACKEND,
        { agent }
      );
      await authenticatedActor.savePID();
      const pId = identity.getPrincipal().toText();
      setIsAuthenticated(true);
      setActor(authenticatedActor);
      setGreeting(`Hello ____ ${pId}`);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    const authClient = await AuthClient.create();
    await authClient.logout();
    setIsAuthenticated(false);
    setGreeting("");
  };

  const searchUser = async () => {
    if (searchInput) {
      let res = await actor.searchUser(searchInput);
      setSearchResults(res);
    }
  };

  // Debounce effect: waits for 2 seconds after the user stops typing to trigger search
  useEffect(() => {
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeoutId = setTimeout(() => {
      searchUser();
    }, 2000);
    setTypingTimeout(timeoutId);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />
      {!isAuthenticated ? (
        <form onSubmit={handleLogin}>
          <button type="submit">Login</button>
        </form>
      ) : (
        <div>
          <button onClick={handleLogout}>Logout</button>
          <section id="greeting">{greeting}</section>
          <input
            type="text"
            placeholder="Search user"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchResults && (
            <div>
              <h3>Search Results:</h3>
              <p>{searchResults}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default App;
