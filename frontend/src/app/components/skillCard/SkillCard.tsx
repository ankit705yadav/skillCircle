import "./skillCard.css";

interface Skill {
  id: number;
  title: string;
  description: string;
  type: "OFFER" | "ASK";
  posterImageUrl?: string;
  author: {
    clerkUserId: string;
    username: string;
  };
}

interface User {
  id: string;
}

interface SkillCardProps {
  skill: Skill;
  user: User | null | undefined;
  handleRequestConnection: (skillId: number) => void;
}

export default function SkillCard({
  skill,
  user,
  handleRequestConnection,
}: SkillCardProps) {
  return (
    <div
      className="skill-card"
      // style={{
      //   backgroundColor: skill.type === "OFFER" ? "#E9B3FB" : "green",
      // }}
      key={skill.id}
    >
      {/* Conditionally render the image */}
      <img
        className="skill-card-media"
        src={skill.posterImageUrl || "https://placehold.co/600x400"}
        alt={skill.title}
      />

      {/* Tag */}
      <p className="skill-card-tag">
        {skill.type === "OFFER" ? "Offer" : "Request"}
      </p>

      <div className="skill-card-content">
        <h3 className="skill-card-title">{skill.title}</h3>
        <p className="skill-card-author">by {skill.author.username}</p>
        {/*<p className="skill-card-description">{skill.description}</p>*/}
      </div>

      {/* Conditional rendering for the button */}
      {/*{user?.id !== skill.author.clerkUserId && (
        <div className="skill-card-actions">
          <button
            className="skill-card-button"
            onClick={() => handleRequestConnection(skill.id)}
          >
            {skill.type === "OFFER" ? "Request Help" : "Offer Help"}
          </button>
        </div>
      )}*/}
    </div>
  );
}
