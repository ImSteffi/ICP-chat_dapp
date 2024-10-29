import React, { useState, useEffect } from "react";
import { createActor, chat_dapp_backend } from "declarations/chat_dapp_backend";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

function App() {
  const [actor, setActor] = useState(chat_dapp_backend);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState("");
  const [greeting, setGreeting] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [displayChat, setDisplayChat] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const [getRes, setGetRes] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      const authClient = await AuthClient.create();
      if (await authClient.isAuthenticated()) {
        const identity = authClient.getIdentity();
        const agent = new HttpAgent({ identity });
        const authenticatedActor = createActor(
          process.env.CANISTER_ID_CHAT_DAPP_BACKEND,
          { agent }
        );
        const pID = identity.getPrincipal().toText();
        setIsAuthenticated(true);
        setActor(authenticatedActor);
        setActiveUser(pID);
        setGreeting(`Welcome back, ${pID}`);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeoutId = setTimeout(() => {
      searchUser();
    }, 2000);
    setTypingTimeout(timeoutId);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

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
      const pID = identity.getPrincipal().toText();
      setIsAuthenticated(true);
      setActor(authenticatedActor);
      setActiveUser(pID);
      setGreeting(`Hello, ${pID}`);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    const authClient = await AuthClient.create();
    await authClient.logout();
    setIsAuthenticated(false);
    setGreeting("");
    setSearchResults("");
  };

  const searchUser = async () => {
    if (searchInput) {
      let res = await actor.searchUser(searchInput);
      if (res.length === 0) {
        setSearchResults("No such user");
      } else {
        setSearchResults(res);
      }
    }
  };

  const openChat = async (value) => {
    setSearchResults("");
    if (activeUser && value) {
      let receiver = value[0];
      setReceiver(receiver);
      let activeUserPrincipal = Principal.fromText(activeUser);
      let receiverPrincipal = Principal.fromText(receiver);
      let res = await actor.getChatHistory(
        activeUserPrincipal,
        receiverPrincipal
      );
      const messages = res.map((msg) => msg.content);
      setChatHistory(messages);
      setDisplayChat(true);
    }
  };

  const get = async () => {
    let res = await actor.get();
    setGetRes(res);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (messageInput.trim() === "") return;
    try {
      let receiverPrincipal = Principal.fromText(receiver);
      let res = await actor.sendChat(messageInput, receiverPrincipal);
      const messages = res.map((msg) => msg.content);
      setChatHistory(messages);
      setMessageInput("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <div>
        <button onClick={get}>Get</button>
        <div>
          {getRes.length > 0
            ? getRes.map((item, index) => <p key={index}>{item}</p>)
            : null}
        </div>
      </div>
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
              {searchResults === "No such user" ? (
                <h3>No such user</h3>
              ) : (
                <button onClick={() => openChat(searchResults)}>
                  {searchResults}
                </button>
              )}
            </div>
          )}
          {displayChat ? (
            <div>
              <div>
                <div>MESSAGES</div>
                <div>
                  {chatHistory.map((msg, index) => (
                    <div key={index}>
                      <strong>{msg}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <form onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button type="submit">&rarr;</button>
              </form>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}

export default App;
