// Re-export Clerk components and hooks
export {
  ClerkProvider,
  SignIn,
  SignUp,
  SignInButton,
  SignUpButton,
  SignOutButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useAuth,
  useClerk,
  useSession,
  useSignIn,
  useSignUp,
} from "@clerk/nextjs";

export { auth, currentUser } from "@clerk/nextjs/server";

// Custom auth utilities
export * from "./middleware";
export * from "./utils";
