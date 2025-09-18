import CalendarMain from "@/components/calendar/CalendarMain";

export const dynamic = "force-dynamic";

export default function Page() {
  return <CalendarMain />; // ← defaultCatId prop を削除
}
