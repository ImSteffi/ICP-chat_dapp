import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Array "mo:base/Array";

actor {
  stable var upList : [Text] = [];

  public shared (msg) func savePID() : async () {
    let upID = Principal.toText(msg.caller);
    let exists = Array.find<Text>(upList, func(p : Text) : Bool { p == upID }) != null;
    if (not exists) {
      upList := Array.append(upList, [upID]);
      return;
    } else {
      return;
    };
  };
};
