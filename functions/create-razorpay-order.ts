// supabase/functions/create-razorpay-order/index.ts
// Deploy: supabase functions deploy create-razorpay-order

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RAZORPAY_KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID')!;
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount } = await req.json();

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const res  = await fetch('https://api.razorpay.com/v1/orders', {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt:  `rcpt_${Date.now()}`,
      }),
    });

    const order = await res.json();
    return new Response(
      JSON.stringify({ orderId: order.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// supabase/functions/send-notification/index.ts
// Deploy: supabase functions deploy send-notification
//
// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
//
// serve(async (req) => {
//   const { toUserId, title, body, data } = await req.json();
//   const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
//
//   const { data: profile } = await sb.from('profiles').select('push_token').eq('id', toUserId).single();
//   if (!profile?.push_token) return new Response('no token', { status: 200 });
//
//   await fetch('https://exp.host/--/api/v2/push/send', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       to: profile.push_token, title, body, data,
//       sound: 'default', badge: 1,
//     }),
//   });
//
//   return new Response('sent', { status: 200 });
// });
