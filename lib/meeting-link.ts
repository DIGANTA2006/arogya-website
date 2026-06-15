export function isOnlineAppointment(value: string) {
  const text = String(value || "").toLowerCase();

  return (
    text.includes("online") ||
    text.includes("virtual") ||
    text.includes("video") ||
    text.includes("tele")
  );
}

export function buildOnlineConsultationLink(appointmentId: string) {
  const safeId =
    String(appointmentId || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 48) || crypto.randomUUID().replace(/-/g, "");

  return `https://meet.jit.si/ArogyaSpeechTherapy-${safeId}`;
}