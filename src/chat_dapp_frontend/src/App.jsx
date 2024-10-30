import React, { useState, useEffect, useRef } from "react";
import { createActor, chat_dapp_backend } from "declarations/chat_dapp_backend";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

function App() {
  const [actor, setActor] = useState(chat_dapp_backend); // actor that talks to the backend
  const [isAuthenticated, setIsAuthenticated] = useState(false); // authenticator
  const [activeUser, setActiveUser] = useState(""); // user that is logged in
  const [greeting, setGreeting] = useState(""); // greeter
  const [searchInput, setSearchInput] = useState(""); // search input
  const [searchResults, setSearchResults] = useState(""); // search results
  const [typingTimeout, setTypingTimeout] = useState(null); // timer for search
  const [displayChat, setDisplayChat] = useState(false); // chat enabler
  const [chatHistory, setChatHistory] = useState([]); // chat history
  const [receiver, setReceiver] = useState(""); // end user that receives msg's
  const [messageInput, setMessageInput] = useState(""); // message input
  const [getRes, setGetRes] = useState([]); // list of users
  const [isSending, setIsSending] = useState(false); // track sending state

  const chatHistoryRef = useRef(null);

  const scrollToBottom = () => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

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

  const resetStates = async () => {
    const authClient = await AuthClient.create();
    await authClient.logout();
    setIsAuthenticated(false);
    setActiveUser("");
    setGreeting("");
    setSearchInput("");
    setSearchResults("");
    setDisplayChat(false);
    setChatHistory([]);
    setReceiver("");
    setMessageInput("");
  };

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
      setChatHistory(res);
      setDisplayChat(true);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (isSending || messageInput.trim() === "") return;
    setIsSending(true);
    try {
      let receiverPrincipal = Principal.fromText(receiver);
      let res = await actor.sendChat(messageInput, receiverPrincipal);
      setChatHistory(res);
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const get = async () => {
    let res = await actor.get();
    setGetRes(res);
  };

  return (
    <main className="app-container">
      <header className="top-section">
        <img src="/logo2.svg" alt="DFINITY logo" className="logo" />

        <div className="get-section">
          {getRes.length > 0 ? (
            <button onClick={() => setGetRes([])} className="close-btn">
              Close List
            </button>
          ) : (
            <button onClick={get} className="get-btn">
              Get List
            </button>
          )}

          {getRes.length > 0 && (
            <div className="get-list">
              {getRes.map((item, index) => (
                <p key={index} className="get-item">
                  {item}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="auth-section">
          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="login-form">
              <button type="submit" className="login-btn">
                Login
              </button>
            </form>
          ) : (
            <div className="user-interface">
              <button onClick={resetStates} className="logout-btn">
                Logout
              </button>
              <section id="greeting" className="greeting">
                {greeting}
              </section>

              <input
                type="text"
                placeholder="Search user"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="search-input"
              />

              {searchResults && (
                <div className="search-results">
                  {searchResults === "No such user" ? (
                    <h3>No such user</h3>
                  ) : (
                    <button
                      onClick={() => openChat(searchResults)}
                      className="search-result-btn"
                    >
                      {searchResults}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {displayChat && (
        <div className="chat-container">
          <div className="chat-history" ref={chatHistoryRef}>
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${
                  msg.from?.toText() === activeUser
                    ? "sent-message"
                    : "received-message"
                }`}
              >
                <strong>{msg.content}</strong>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="message-form">
            <input
              type="text"
              placeholder="Your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="message-input"
            />
            <button type="submit" className="send-btn" disabled={isSending}>
              &rarr;
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

export default App;
