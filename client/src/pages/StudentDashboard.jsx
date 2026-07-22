import { useState } from "react";
import { Users, CalendarDays, User } from "lucide-react";
import Sidebar from "../components/Sidebar";
import BrowseTutors from "../components/BrowseTutors";
import MyBookings from "../components/MyBookings";
import MyProfile from "../components/MyProfile";

export default function StudentDashboard() {
  const [tab, setTab] = useState("browse");
  const items = [
    { key: "browse", label: "Browse Tutors", icon: Users },
{ key: "bookings", label: "My Bookings", icon: CalendarDays },
    { key: "profile", label: "My Profile", icon: User },
  ];
  return (
    <div className="flex">
      <Sidebar items={items} active={tab} onSelect={setTab} />
      <main className="flex-1 p-4 pt-24 pb-16 md:p-10 md:pt-10 md:h-screen md:overflow-y-auto">
        {tab === "browse" && <BrowseTutors />}
          {tab === "bookings" && <MyBookings />}
          {tab === "profile" && <MyProfile />}
      </main>
    </div>
  );
}