// src/app/api/push/route.ts
import { NextRequest, NextResponse } from 'next/server';
import webpush, { PushSubscription } from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cydjretpcgmuezpkbkql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGpyZXRwY2dtdWV6cGtia3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDYxMTkxOTEsImV4cCI6MjAyMTY5NTE5MX0.oXmm_fYwbkvK1ezeh8Ns6MlDPNYP1h7w6wr9hQ3aXdA';
const supabase = createClient(supabaseUrl, supabaseKey);

webpush.setVapidDetails(
  'mailto:test@example.com',
  'your-public-key',
  'your-private-key'
);

// Middleware function to handle CORS
const handleCors = (req: NextRequest, res: NextResponse) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Set appropriate origin
    'Access-Control-Allow-Methods': 'GET, POST', // Allow GET and POST methods
    'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
  };

  if (req.method === 'OPTIONS') {
    // Preflight request, respond with headers only
    return res.writeHead(200, headers).end();
  }

  // Continue to the next handler
  return;
};

export default async function handler(req: NextRequest, res: NextResponse) {
  // Apply CORS middleware here
  handleCors(req, res);

  if (req.method === 'POST') {
    const subscription = req.body as PushSubscription | null;

    if (!subscription) {
      console.error('No subscription was provided!');
      return res.status(400).json({ message: 'No subscription provided' });
    }

    try {
      await saveSubscriptionToDb(subscription);
      return res.status(200).json({ message: 'Success' });
    } catch (error) {
      console.error('Error saving subscription to Supabase:', error.message);
      return res.status(500).json({ message: 'Error saving subscription' });
    }
  }

  if (req.method === 'GET') {
    try {
      const subscriptions = await getSubscriptionsFromDb();
      
      subscriptions.forEach((s) => {
        const payload = JSON.stringify({
          title: 'WebPush Notification!',
          body: 'Hello World',
        });
        webpush.sendNotification(s, payload);
      });

      return res.status(200).json({ message: `${subscriptions.length} messages sent!` });
    } catch (error) {
      console.error('Error fetching subscriptions from Supabase:', error.message);
      return res.status(500).json({ message: 'Error fetching subscriptions' });
    }
  }

  return res.status(404).json({ message: 'Route not found' });
}

async function saveSubscriptionToDb(subscription: PushSubscription) {
  try {
    const { data, error } = await supabase.from('subscriptions').insert([subscription]);
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error saving subscription to Supabase:', error.message);
    throw error;
  }
}

async function getSubscriptionsFromDb() {
  try {
    const { data, error } = await supabase.from('subscriptions').select('*');
    if (error) {
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching subscriptions from Supabase:', error.message);
    throw error;
  }
}
