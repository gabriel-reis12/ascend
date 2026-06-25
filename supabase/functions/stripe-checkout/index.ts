import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Tratar requisição CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const premiumUnitAmount = Number(Deno.env.get("STRIPE_PREMIUM_UNIT_AMOUNT") ?? "199");
    const premiumCurrency = (Deno.env.get("STRIPE_PREMIUM_CURRENCY") ?? "usd").toLowerCase();

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Configurações do Supabase ausentes no ambiente.");
    }
    if (!stripeSecretKey) {
      throw new Error("Chave secreta do Stripe (STRIPE_SECRET_KEY) não configurada no Supabase.");
    }
    if (!Number.isFinite(premiumUnitAmount) || premiumUnitAmount < 50) {
      throw new Error("Valor da assinatura premium inválido no ambiente.");
    }

    // 1. Obter e validar o usuário autenticado do Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Cabeçalho de autorização ausente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autorizado ou sessão expirada." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Inicializar o Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // 3. Buscar se o usuário já possui um customer_id no banco para reutilizar
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    // Se não tiver, cria um novo cliente no Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Salva o stripe_customer_id no profile
      await adminClient
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // 4. Criar a sessão do Stripe Checkout
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: premiumCurrency,
            unit_amount: premiumUnitAmount,
            recurring: {
              interval: "month",
            },
            product_data: {
              name: "Ascend Premium",
              description: "Acesso premium mensal aos módulos avançados do Sistema.",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      client_reference_id: user.id,
      success_url: `${origin}/settings?payment=success`,
      cancel_url: `${origin}/settings?payment=cancel`,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Erro na Edge Function stripe-checkout:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno no servidor" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
