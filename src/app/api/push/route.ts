import { NextResponse, NextRequest } from 'next/server'
import {
  getSubscriptionsFromDb,
  saveSubscriptionToDb,
} from '@/utils/db/in-memory-db'
import webpush, { PushSubscription } from 'web-push'
import { CONFIG } from '@/config'

webpush.setVapidDetails(
  'mailto:test@example.com',
  CONFIG.PUBLIC_KEY,
  CONFIG.PRIVATE_KEY
)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cydjretpcgmuezpkbkql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGpyZXRwY2dtdWV6cGtia3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDYxMTkxOTEsImV4cCI6MjAyMTY5NTE5MX0.oXmm_fYwbkvK1ezeh8Ns6MlDPNYP1h7w6wr9hQ3aXdA';

const supabase = createClient(supabaseUrl, supabaseKey);


export async function POST(request: NextRequest) {
  const subscription = (await request.json()) as PushSubscription | null

  if (!subscription) {
    console.error('No subscription was provided!')
    return
  }

  const updatedDb = await saveSubscriptionToDb1(subscription)

  return NextResponse.json({ message: 'success', updatedDb })
}

export async function GET(_: NextRequest) {
  const subscriptions = await getSubscriptionsFromDb1()

  subscriptions.forEach((s:any) => {
    const payload = JSON.stringify({
      title: 'WebPush Notification!',
      body: 'Hello World',
    })
    webpush.sendNotification(s, payload)
  })

  return NextResponse.json({
    message: `${subscriptions.length} messages sent!`,
  })
}

async function saveSubscriptionToDb1(subscription1:any) {
  console.log(subscription1);
  delete subscription1['expirationTime'];
  const subscription = {
    "endpoint": "https://example.com/push/subscription",
    "keys": {
      "p256dh": "BOb8lXwNkSxXxtIHu28N5i0tnLlXoPhMfLrEenOCyq9VzNrmKm21_2LQFp-z6zbKrp7ZwCdiF6INaEEoJYWT1IY",
      "auth": "8gJIsqXpbLWIRhCHcFcc1g"
    },
  };
  
  try {
    const { data, error } = await supabase.from('subscriptions').insert([subscription1]);
    if (error) {
      throw error;
    }
    return data;
  } catch (error:any) {
    console.error('Error saving subscription to Supabase:', error.message);
    throw error;
  }
}

async function getSubscriptionsFromDb1() {
  try {
    const { data, error } = await supabase.from('subscriptions').select('*');
    if (error) {
      throw error;
    }
    return data || [];
  } catch (error:any) {
    console.error('Error fetching subscriptions from Supabase:', error.message);
    throw error;
  }
}