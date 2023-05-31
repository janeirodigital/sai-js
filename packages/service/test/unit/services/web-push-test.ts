import { sendWebPush } from '../../../src/services/web-push';

import webpush, { PushSubscription } from 'web-push';
jest.mock('web-push');

const webId = 'https://alice.example';

const notificationPayload = {
  notification: {
    title: 'SAI authorization agent',
    body: 'Someone shared data with you',
    data: {
      webId
    }
  }
};

const subscriptions = [
  { endpoint: 'a' } as unknown as PushSubscription,
  { endpoint: 'b' } as unknown as PushSubscription,
  { endpoint: 'c' } as unknown as PushSubscription,
  { endpoint: 'd' } as unknown as PushSubscription
];

test('sends notifications', async () => {
  await sendWebPush(webId, subscriptions);
  for (const subscription of subscriptions) {
    expect(webpush.sendNotification).toBeCalledWith(subscription, JSON.stringify(notificationPayload));
  }
});
