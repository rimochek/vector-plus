let audio: HTMLAudioElement | null = null

export function playNotificationSound() {
  if (typeof window === "undefined") return

  try {
    if (!audio) {
      audio = new Audio("/sounds/new-notification.mp3")
      audio.volume = 0.65
    }
    audio.currentTime = 0
    void audio.play().catch(() => {})
  } catch {
    // Ignore autoplay or missing file errors.
  }
}
