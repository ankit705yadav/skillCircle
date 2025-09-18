import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
// import { Button } from "@mui/material";

export default function Header() {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "10px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#fff",
        marginBottom: "1rem",
        marginTop: "1rem",
      }}
    >
      <div style={{ position: "absolute", display: "flex", gap: "8px" }}>
        <Link href="/notifications">Notifications</Link>
        <Link href="/chats">Chats</Link>
      </div>

      <Link href="/" legacyBehavior>
        <a>
          <h1>Skill-Circle</h1>
        </a>
      </Link>
      <div>
        <SignedOut>
          <SignInButton mode="modal">
            <button>Sign In</button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}
