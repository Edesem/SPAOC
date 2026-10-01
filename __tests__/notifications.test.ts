jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

// Load a fresh copy of the module together with the expo-notifications mock it
// sees, so a side effect at import time is observable.
const load = () => {
  let loaded!: {
    notifications: typeof import("@/notifications");
    expo: jest.Mocked<typeof import("expo-notifications")>;
  };
  jest.isolateModules(() => {
    loaded = {
      expo: require("expo-notifications"),
      notifications: require("@/notifications"),
    };
  });
  return loaded;
};

describe("notifications", () => {
  it("does not install the handler just by being imported", () => {
    const { expo } = load();

    expect(expo.setNotificationHandler).not.toHaveBeenCalled();
  });

  it("shows notifications while the app is in the foreground once the handler is set up", async () => {
    const { notifications, expo } = load();

    notifications.setupNotificationHandler();

    expect(expo.setNotificationHandler).toHaveBeenCalledTimes(1);
    const { handleNotification } = expo.setNotificationHandler.mock
      .calls[0][0] as { handleNotification: () => Promise<unknown> };
    expect(await handleNotification()).toEqual(
      expect.objectContaining({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
      }),
    );
  });

  it("removes both listeners when the cleanup returned by setupNotificationListeners runs", () => {
    const { notifications, expo } = load();
    const receivedRemove = jest.fn();
    const responseRemove = jest.fn();
    expo.addNotificationReceivedListener.mockReturnValue({
      remove: receivedRemove,
    });
    expo.addNotificationResponseReceivedListener.mockReturnValue({
      remove: responseRemove,
    });

    const cleanup = notifications.setupNotificationListeners();

    expect(receivedRemove).not.toHaveBeenCalled();
    cleanup();
    expect(receivedRemove).toHaveBeenCalledTimes(1);
    expect(responseRemove).toHaveBeenCalledTimes(1);
  });
});
