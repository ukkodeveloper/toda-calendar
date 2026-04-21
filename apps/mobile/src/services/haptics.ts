import * as Haptics from "expo-haptics"

export async function triggerSaveHaptic() {
  // Expo injects EXPO_OS at build time for platform branching.
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.EXPO_OS !== "ios") {
    return
  }

  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
}

export async function triggerSelectionHaptic() {
  // Expo injects EXPO_OS at build time for platform branching.
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.EXPO_OS !== "ios") {
    return
  }

  await Haptics.selectionAsync()
}
