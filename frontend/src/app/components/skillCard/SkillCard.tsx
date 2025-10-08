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
      className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200 h-full flex flex-col"
      key={skill.id}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          src={skill.posterImageUrl || "https://placehold.co/600x400"}
          alt={skill.title}
        />

        {/* Tag overlay */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
              skill.type === "OFFER"
                ? "bg-blue-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {skill.type === "OFFER" ? "Offer" : "Request"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
          {skill.title}
        </h3>
        <p className="text-sm text-gray-600">by {skill.author.username}</p>
      </div>
    </div>
  );
}
