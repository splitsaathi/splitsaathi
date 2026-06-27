import { useEffect } from "react";
import * as Updates from "expo-updates";
import { Alert } from "react-native";

export function useAppUpdate() {
  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      if (__DEV__) return;
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(
          "Update Available!",
          "SplitSaathi ka naya version aa gaya. Restart karein?",
          [
            { text: "Baad mein", style: "cancel" },
            { text: "Abhi Update Karo", onPress: async () => await Updates.reloadAsync() }
          ]
        );
      }
    } catch (e) {
      console.log("Update check:", e.message);
    }
  };
}
