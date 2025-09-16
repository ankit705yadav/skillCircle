import CreateOfferForm from "./components/CreateOfferForm";
import CreateAskForm from "./components/CreateAskForm";
import NearbySkills from "./components/NearbySkills";

export default function Home() {
  return (
    <div>
      <NearbySkills />
      <CreateOfferForm />
      <CreateAskForm />
    </div>
  );
}
