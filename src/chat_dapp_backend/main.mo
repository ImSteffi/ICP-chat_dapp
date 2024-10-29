import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import IC "mo:base/ExperimentalInternetComputer";

actor {

  type Message = {
    from : Principal;
    to : Principal;
    content : Text;
  };

  stable var userPrincipalList : [Text] = [];
  stable var chatHistory : [Message] = [];

  public query func get() : async [Text] {
    return userPrincipalList;
  };

  // Save the current user's principal (savePID)
  public shared (msg) func savePID() : async () {
    let upID = Principal.toText(msg.caller);
    let exists = Array.find<Text>(userPrincipalList, func(p : Text) : Bool { p == upID }) != null;
    if (not exists) {
      userPrincipalList := Array.append(userPrincipalList, [upID]);
      return;
    } else {
      return;
    };
  };

  // Search for a user in the principal list
  public query func searchUser(input : Text) : async ?Text {
    var res : ?Text = null;
    let instructionsUsed = IC.countInstructions(
      func() {
        res := Array.find<Text>(
          userPrincipalList,
          func(userPrincipal : Text) : Bool {
            userPrincipal == input;
          },
        );
      }
    );
    Debug.print("cycles used: " # debug_show (instructionsUsed));
    return res;
  };

  // Send a chat message from one user to another
  public shared (msg) func sendChat(content : Text, receiver : Principal) : async [Message] {
    let sender = msg.caller;
    let newMessage : Message = {
      from = sender;
      to = receiver;
      content = content;
    };
    chatHistory := Array.append(chatHistory, [newMessage]);
    return await getChatHistory(sender, receiver);
  };

  // Retrieve the chat history between two users
  public query func getChatHistory(user1 : Principal, user2 : Principal) : async [Message] {
    return Array.filter<Message>(
      chatHistory,
      func(msg : Message) : Bool {
        (msg.from == user1 and msg.to == user2) or (msg.from == user2 and msg.to == user1);
      },
    );
  };
  
};
