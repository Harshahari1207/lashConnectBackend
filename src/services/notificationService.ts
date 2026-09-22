export interface PushNotification {
  title: string;
  body: string;
  data?: Record<
    string,
    string
  >;
}

export const sendPushNotification =
  async (
    userId: string,
    notification: PushNotification
  ) => {
    /*
     * Firebase Admin SDK will be integrated
     * here in the next stage.
     *
     * Example:
     *
     * await admin.messaging().send(...)
     */

    console.log(
      "Push notification:",
      {
        userId,
        notification
      }
    );
  };