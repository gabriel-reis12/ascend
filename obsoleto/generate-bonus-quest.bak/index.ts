import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rate limiting em memória por instância da Edge Function (janela deslizante de 1 hora)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_WINDOW = 30; // Máximo de 30 gerações de IA por hora por usuário
const WINDOW_MS = 60 * 60 * 1000; // 1 hora

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userRate = rateLimitMap.get(userId);

  if (!userRate || now > userRate.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (userRate.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  userRate.count += 1;
  return false;
}

interface RequestBody {
  category: string;
  existingQuestTitles?: string[];
  hunterClass?: string;
}

const ALLOWED_CATEGORIES = new Set([
  "Treino",
  "Cardio",
  "Estudo",
  "Trabalho",
  "Saúde",
  "Hobbies",
]);

const ALLOWED_CLASSES = new Set([
  "Warrior",
  "Scholar",
  "Monk",
  "Titan",
  "Creator",
  "Leader",
]);

Deno.serve(async (req) => {
  // 1. Tratar requisição CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Configurações do Supabase ausentes no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: "Chave GROQ_API_KEY não configurada no Supabase Secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validar autenticação do usuário
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
        JSON.stringify({ error: "Usuário não autenticado ou sessão expirada." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Rate limiting por usuário
    if (isRateLimited(user.id)) {
      return new Response(
        JSON.stringify({
          error: "Limite de gerações de missões por IA excedido para esta hora. Tente novamente mais tarde.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Validar e sanitizar o corpo da requisição
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Corpo da requisição inválido (JSON esperado)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const category = typeof body.category === "string" ? body.category.trim() : "";
    if (!category || !ALLOWED_CATEGORIES.has(category)) {
      return new Response(
        JSON.stringify({
          error: `Categoria inválida. Categorias permitidas: ${Array.from(ALLOWED_CATEGORIES).join(", ")}.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawHunterClass = typeof body.hunterClass === "string" ? body.hunterClass.trim() : "Warrior";
    const hunterClass = ALLOWED_CLASSES.has(rawHunterClass) ? rawHunterClass : "Warrior";

    const rawQuestTitles = Array.isArray(body.existingQuestTitles) ? body.existingQuestTitles : [];
    const existingQuestTitles = rawQuestTitles
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.slice(0, 100))
      .slice(0, 15);

    // 5. Preparar prompt
    const classDetails: Record<string, string> = {
      Warrior: "WARRIOR (Guerreiro): Especialista em força física bruta, musculação, determinação inquebrável, combate direto e superação corporal.",
      Scholar: "SCHOLAR (Erudito): Mestre da mente, busca conhecimento, foco intelectual, aprendizado contínuo, lógica e clareza analítica.",
      Monk: "MONK (Monge): Sinergia de agilidade, equilíbrio, flexibilidade, paz mental, vitalidade, respiração e conexão mente-corpo.",
      Titan: "TITAN (Titã): Muralha de resistência inabalável, alta durabilidade, consistência de longo prazo, cardio de elite, e superação de dores e fadiga.",
      Creator: "CREATOR (Criador): Mestre do foco, expressão criativa, resolução de problemas visuais, design e inovação.",
      Leader: "LEADER (Líder): Foco estratégico, liderança disciplinada, organização, influência e visão de longo alcance.",
    };

    const currentClassDetail = classDetails[hunterClass] || `Classe: ${hunterClass}`;
    const questsContext = existingQuestTitles.length > 0
      ? `O caçador já tem as seguintes missões planejadas para hoje: ${existingQuestTitles.map((t) => `"${t}"`).join(", ")}.`
      : "O caçador ainda não possui nenhuma missão definida para hoje.";

    const prompt = `Você é o "Sistema de Calibração de Caçadores" (estilo RPG de Solo Leveling). O usuário pertence à classe:
${currentClassDetail}

Ele precisa de um DESAFIO EXTRA DIÁRIO (missão secundária bônus) na categoria "${category}" para complementar suas tarefas normais hoje.
${questsContext}

Gere uma tarefa bônus (quest secundária) muito específica, prática, curta e motivadora na categoria "${category}". Ela deve ser desafiadora, mas realizável em no máximo 15-30 minutos hoje.
A missão e sua lore explicativa DEVEM fazer sentido com o arquétipo e a classe do caçador:
- Se for um WARRIOR escolhendo "Estudo/Intelecto", a tarefa deve ser sobre leitura tática de combate ou memorização de fórmulas corporais. A lore deve interpretar o intelecto como a calibração de um guerreiro de alto nível ("A mente é a espada invisível").
- Se for um SCHOLAR escolhendo "Treino/Físico", a tarefa deve envolver calibração de respiração, alongamento de precisão ou um teste de foco corporal ("Fortalecer o recipiente físico para conter a imensidade do poder mental").
- Se for um MONK escolhendo "Trabalho", o desafio pode ser sobre foco total imperturbável no trabalho como se fosse uma meditação ativa zen ("A ação disciplinada no caos do trabalho flui como água").
- Se for um TITAN escolhendo "Cardio", a missão deve desafiar sua resiliência extrema, superando a fadiga com tiros curtos e persistência.

Retorne APENAS um objeto JSON válido, contendo exatamente as seguintes chaves:
1. "title": Uma frase de ação empolgante, estilo ordem do sistema, com no máximo 50 caracteres (em Português do Brasil).
2. "lore": Uma frase explicativa e motivadora de RPG de Solo Leveling descrevendo o efeito metafórico de poder que a conclusão desta quest dará ao caçador da classe dele, com no máximo 120 caracteres (em Português do Brasil).

ATENÇÃO CRÍTICA: Não inclua nenhuma introdução, explicação ou marcação de bloco de código JSON como \`\`\`json. A resposta deve ser EXATAMENTE um JSON cru.
Exemplo de resposta válida:
{"title": "Fazer 15 minutos de leitura ativa", "lore": "Ao decifrar escritas ancestrais, sua percepção cognitiva se expande para além do limite humano."}`;

    // 6. Chamada com timeout para a API Groq
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 12000); // 12s timeout

    let groqResponse: Response;
    try {
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.9,
          max_completion_tokens: 300,
          top_p: 1,
          stream: false,
        }),
        signal: abortController.signal,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === "AbortError";
      return new Response(
        JSON.stringify({
          error: isTimeout
            ? "Tempo limite esgotado ao contatar o provedor neural de IA."
            : "Falha de rede ao contatar a API da Groq.",
        }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error(`[generate-bonus-quest] Erro da API Groq (${groqResponse.status}):`, errText);
      return new Response(
        JSON.stringify({
          error: `Provedor neural retornou status ${groqResponse.status}.`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    const cleanJson = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/, "")
      .trim();

    let parsed: { title?: string; lore?: string };
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      console.error("[generate-bonus-quest] Resposta não-JSON da Groq:", content);
      return new Response(
        JSON.stringify({
          error: "Resposta da inteligência artificial retornou formato inválido.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const title = typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim().slice(0, 80)
      : `Realizar micro-desafio de ${category}`;

    const lore = typeof parsed.lore === "string" && parsed.lore.trim()
      ? parsed.lore.trim().slice(0, 160)
      : "Superar desafios aleatórios e imprevisíveis molda a fortitude do verdadeiro caçador de nível superior.";

    return new Response(
      JSON.stringify({ title, lore }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    console.error("[generate-bonus-quest] Exceção inesperada:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor ao processar a geração neural." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

