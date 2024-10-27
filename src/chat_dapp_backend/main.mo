import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Debug "mo:base/Debug";

actor {

  stable var userPrincipalList : [Text] = [];

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

  public query func searchUser(input : Text) : async ?Text {
    let res = Array.find<Text>(userPrincipalList, func (userPrincipal : Text) : Bool {
      userPrincipal == input;
    });
    return res;
  };

};
