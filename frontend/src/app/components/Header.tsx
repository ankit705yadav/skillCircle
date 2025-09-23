import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "10px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        padding: "0 1rem",
        marginBottom: "1rem",
        marginTop: "1rem",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", color: "black" }}>
        <h2> Skill Circle</h2>
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          gap: 30,
        }}
      >
        <Link href="/notifications">Notifications</Link>
        <Link href="/chats">Chats</Link>
        <Link href="/my-skills">my skills</Link>
      </div>

      <div>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              style={{
                backgroundColor: "blue",
                border: "none",
                color: "white",
                padding: "12px 20px",
                // textAlign: "center",
                // textDecoration: "none",
                // display: "inline-block",
                borderRadius: "5px",
                fontSize: "14px",
              }}
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
