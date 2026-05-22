const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export interface GeneratedBonusQuest {
  title: string;
  lore: string;
}

export async function generateBonusQuest(
  category: string,
  existingQuestTitles: string[],
  hunterClass: string
): Promise<GeneratedBonusQuest> {
  if (!GROQ_API_KEY) {
    throw new Error("Chave da API do Groq (VITE_GROQ_API_KEY) não configurada no ambiente.");
  }

  // Mapeia detalhes da classe RPG do caçador para moldar o tom e o estilo do desafio
  const classDetails: Record<string, string> = {
    Warrior: "WARRIOR (Guerreiro): Especialista em força física bruta, musculação, determinação inquebrável, combate direto e superação corporal.",
    Scholar: "SCHOLAR (Erudito): Mestre da mente, busca conhecimento, foco intelectual, aprendizado contínuo, lógica e clareza analítica.",
    Monk: "MONK (Monge): Sinergia de agilidade, equilíbrio, flexibilidade, paz mental, vitalidade, respiração e conexão mente-corpo.",
    Titan: "TITAN (Titã): Muralha de resistência inabalável, alta durabilidade, consistência de longo prazo, cardio de elite, e superação de dores e fadiga."
  };

  const currentClassDetail = classDetails[hunterClass] || `Classe: ${hunterClass}`;

  // Prepara o contexto de tarefas existentes hoje para a IA sugerir algo novo/complementar
  const questsContext = existingQuestTitles.length > 0
    ? `O caçador já tem as seguintes missões planejadas para hoje: ${existingQuestTitles.map(t => `"${t}"`).join(", ")}.`
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

ATENÇÃO CRÍTICA: Não inclua nenhuma introdução, explicação ou marcação de bloco de código JSON como \`\`\`json. A resposta deve ser EXATAMENTE um JSON cru. Se você violar essa regra, o sistema quebrará!
Exemplo de resposta válida:
{"title": "Fazer 15 minutos de leitura ativa", "lore": "Ao decifrar escritas ancestrais, sua percepção cognitiva se expande para além do limite humano."}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300,
        top_p: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || "";
    
    // Remove blocos de código JSON caso a IA tenha retornado de qualquer forma
    const cleanJson = content
      .replace(/^```json\s*/i, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(cleanJson);
    return {
      title: parsed.title || `Realizar micro-desafio de ${category}`,
      lore: parsed.lore || "Superar desafios aleatórios e imprevisíveis molda a fortitude do verdadeiro caçador de nível superior."
    };
  } catch (err) {
    console.error("Falha ao gerar quest via Groq Llama, usando fallback imersivo:", err);
    
    // Fallbacks dinâmicos por categoria se a API falhar
    const fallbacks: Record<string, GeneratedBonusQuest> = {
      "Treino": {
        title: "Executar 3 minutos de prancha isométrica",
        lore: "Fortalecer seu núcleo estabilizador garante uma guarda inquebrável contra qualquer impacto físico."
      },
      "Cardio": {
        title: "Completar 10 tiros de corrida de 30 segundos",
        lore: "O bombeamento rápido de sangue eleva sua regeneração passiva de fadiga a novos patamares."
      },
      "Estudo": {
        title: "Anotar 3 conceitos principais do que estudou hoje",
        lore: "Sintetizar o conhecimento decanta a sabedoria e expande permanentemente sua reserva mágica mental."
      },
      "Trabalho": {
        title: "Eliminar todas as distrações por 25 minutos focado",
        lore: "Entrar em estado de foco absoluto cria uma barreira mental impenetrável contra agentes dispersores externos."
      },
      "Saúde": {
        title: "Realizar 5 minutos de alongamento dinâmico",
        lore: "Desbloquear a amplitude das articulações restaura o fluxo harmonioso da sua energia interna."
      },
      "Hobbies": {
        title: "Dedicar 15 minutos extras à prática livre de arte",
        lore: "Nutrir o espírito criativo recarrega sua mana de vitalidade e afasta as sombras da exaustão mental."
      }
    };

    return fallbacks[category] || {
      title: `Superar limite diário de ${category}`,
      lore: "Aceitar a imprevisibilidade das fendas de anomalia solidifica sua posição no topo da hierarquia de caçadores."
    };
  }
}
