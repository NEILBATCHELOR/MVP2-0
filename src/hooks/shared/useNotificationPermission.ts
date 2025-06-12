import { useState, useEffect } from "react";

type NotificationPermissionState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export const useNotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermissionState>(
    !window.Notification ? "unsupported" : Notification.permission,
  );

  useEffect(() => {
    if (!window.Notification) {
      setPermission("unsupported");
      return;
    }

    // Update permission state when it changes
    const updatePermission = () => {
      setPermission(Notification.permission);
    };

    // Check if permission has changed since we last checked
    updatePermission();

    // Some browsers implement the permission change event
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "notifications" as PermissionName })
        .then((status) => {
          status.onchange = updatePermission;
        })
        .catch((error) => {
          console.error("Error querying notification permission:", error);
        });
    }
  }, []);

  const requestPermission = async () => {
    if (!window.Notification) {
      return "unsupported" as NotificationPermissionState;
    }

    if (Notification.permission === "granted") {
      return "granted" as NotificationPermissionState;
    }

    if (Notification.permission === "denied") {
      return "denied" as NotificationPermissionState;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result as NotificationPermissionState;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied" as NotificationPermissionState;
    }
  };

  return { permission, requestPermission };
};
