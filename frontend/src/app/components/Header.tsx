import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
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
      }}
    >
      <h1>Skill-Circle</h1>
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
