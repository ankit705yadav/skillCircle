import FuzzyText from "../components/FuzzyText";

// app/not-found.js
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <FuzzyText
        color="black"
        baseIntensity={0.2}
        hoverIntensity={0.5}
        enableHover={true}
      >
        404
      </FuzzyText>
      <Link href="/">Return Home</Link>
    </div>
  );
}
