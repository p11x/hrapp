import { signInWithEmailAndPassword } from "firebase/auth";
import { mockAuth } from "./src/mock/mockAuth.js";
console.log(typeof signInWithEmailAndPassword);
try {
  signInWithEmailAndPassword(mockAuth as any, "admin@hrcore.dev", "admin123");
} catch (e) {
  console.log(e);
}
