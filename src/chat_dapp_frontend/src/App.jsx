import React, { useState } from "react";
import { createActor, chat_dapp_backend } from "declarations/chat_dapp_backend";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";

function App() {
  const [actor, setActor] = useState(chat_dapp_backend);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [greeting, setGreeting] = useState("");

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
      const response = await authenticatedActor.savePID();
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
        </div>
      )}
    </main>
  );
}

export default App;
