import { LAST_CONTENT_UPDATE } from './site';

export type BancaSlug =
  | 'enare'
  | 'usp-sp'
  | 'sus-sp'
  | 'unicamp'
  | 'unifesp'
  | 'ses-pe'
  | 'psu-ba'
  | 'psu-mg'
  | 'amrigs'
  | 'revalida';

export interface GuiaSectionTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface GuiaSectionCallout {
  title: string;
  body: string;
  tone?: 'info' | 'tip' | 'warning';
}

export interface GuiaSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  callout?: GuiaSectionCallout;
  table?: GuiaSectionTable;
}

export interface GuiaFaq {
  question: string;
  answer: string;
}

export interface GuiaSeoEntry {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  readingTimeMinutes: number;
  lastModified: string;
  keywords: string[];
  keyTakeaways: string[];
  sections: GuiaSection[];
  faqs: GuiaFaq[];
  relatedBancas: BancaSlug[];
  relatedGuias: string[];
}

export const BANCA_LINKS_META: Record<BancaSlug, { name: string; subtitle: string }> = {
  enare: {
    name: 'ENARE',
    subtitle: 'Exame Nacional de Residência (Ebserh)',
  },
  'usp-sp': {
    name: 'USP-SP',
    subtitle: 'FMUSP / Hospital das Clínicas',
  },
  'sus-sp': {
    name: 'SUS-SP',
    subtitle: 'Secretaria de Estado da Saúde de SP',
  },
  unicamp: {
    name: 'UNICAMP',
    subtitle: 'Faculdade de Ciências Médicas (Campinas)',
  },
  unifesp: {
    name: 'UNIFESP',
    subtitle: 'Escola Paulista de Medicina',
  },
  'ses-pe': {
    name: 'SES-PE',
    subtitle: 'Secretaria Estadual de Saúde de Pernambuco',
  },
  'psu-ba': {
    name: 'PSU-BA',
    subtitle: 'Processo Seletivo Unificado da Bahia',
  },
  'psu-mg': {
    name: 'PSU-MG',
    subtitle: 'Processo Seletivo Unificado de Minas Gerais',
  },
  amrigs: {
    name: 'AMRIGS',
    subtitle: 'Associação Médica do Rio Grande do Sul',
  },
  revalida: {
    name: 'Revalida INEP',
    subtitle: 'Exame Nacional de Revalidação de Diplomas',
  },
};

export const GUIAS_SEO: GuiaSeoEntry[] = [
  {
    slug: 'fsrs-6-vs-revisoes-fixas-residencia-medica',
    title: 'FSRS-6 vs Revisões Fixas 1-7-15-30 na Residência Médica',
    shortTitle: 'FSRS-6 vs Revisões Fixas 1-7-15-30',
    description:
      'Entenda por que planilhas com revisões fixas 1-7-15-30 geram bola de neve e super-revisão, e como o algoritmo FSRS-6 adapta intervalos e volume de questões para a Residência Médica.',
    category: 'Ciência da Memória',
    readingTimeMinutes: 9,
    lastModified: LAST_CONTENT_UPDATE,
    keywords: [
      'FSRS-6 residência médica',
      'revisões fixas 1 7 15 30',
      'repetição espaçada medicina',
      'algoritmo FSRS estudo médico',
      'curva do esquecimento residência',
    ],
    keyTakeaways: [
      'Revisões fixas (1-7-15-30) tratam um tema em que você tirou 94% igual a um tema em que tirou 52%, desperdiçando horas nobres.',
      'O FSRS-6 estima Estabilidade (S) e Dificuldade (D) individuais de cada assunto para agendar a revisão exatamente antes de a retenção cair abaixo de 90%.',
      'Combinado ao teto de horizonte até a prova (Cepeda et al., 2008) e ao volume dinâmico de 10 a 30 questões, o FSRS-6 evita tanto o esquecimento quanto o overlearning.',
    ],
    sections: [
      {
        id: 'problema-revisoes-fixas',
        heading: 'Por que o modelo fixo 1-7-15-30 quebra no meio do ano',
        paragraphs: [
          'Quase todo candidato à Residência Médica começa o ano com uma planilha clássica de revisões fixas: estudar o tema hoje e revisar em 1, 7, 15 e 30 dias. Em fevereiro, com apenas 10 ou 15 assuntos no radar, a planilha parece organizada. Em julho, depois de acumular mais de 120 temas entre Clínica Médica, Cirurgia, GO, Pediatria e Preventiva, o modelo colapsa.',
          'O colapso não acontece por falta de disciplina — acontece por um erro estrutural do método. O calendário fixo assume que todos os assuntos têm a mesma curva de esquecimento e que o seu domínio em Pré-Natal de Baixo Risco é idêntico ao seu domínio em Distúrbios Ácido-Base ou Glomerulopatias. O resultado é duplo: você revisa cedo demais o que já domina (overlearning) e tarde demais o que errou feio na última bateria.',
        ],
        bullets: [
          'Efeito bola de neve: cada semana nova de aulas do cursinho injeta 4 a 6 assuntos que multiplicam revisões fixas simultâneas.',
          'Desperdício de tempo útil: refazer 30 questões de um assunto onde você já mantém 92% de acerto rouba tempo de temas abaixo de 65%.',
          'Cegueira ao desempenho real: tirar 45% em uma revisão de 15 dias não encurta o ciclo seguinte se a planilha apenas empurra para D+30.',
          'Sem freio na reta final: um assunto revisado em setembro com intervalo fixo longo pode simplesmente sumir da fila até depois da prova.',
        ],
      },
      {
        id: 'como-funciona-fsrs-6',
        heading: 'Como o algoritmo FSRS-6 modela a sua memória médica',
        paragraphs: [
          'O FSRS-6 (Free Spaced Repetition Scheduler, 6ª geração) é um modelo de memória baseado na teoria DSR — Dificuldade (Difficulty), Estabilidade (Stability) e Recuperabilidade (Retrievability). Diferente de regras fixas ou do antigo SM-2, seus parâmetros foram calibrados sobre centenas de milhões de revisões reais para prever com precisão a probabilidade de você lembrar um conteúdo em qualquer dia futuro.',
          'No AdaptiveMed, o motor FSRS-6 opera com meta de retenção de 90% (request_retention = 0,90) ao longo de ciclos progressivos R0 até R8. Cada vez que você registra uma bateria de questões, seu percentual de acerto é traduzido em um grau de avaliação FSRS-6 que recalcula instantaneamente a estabilidade e a dificuldade daquele assunto específico.',
        ],
        table: {
          caption: 'Mapeamento de desempenho para o motor FSRS-6 no AdaptiveMed',
          headers: ['Acerto na revisão', 'Rating FSRS-6', 'Diagnóstico pedagógico', 'Ação do algoritmo'],
          rows: [
            ['Abaixo de 50%', 'Again (Lapse)', 'Ruptura Crítica', 'Reteste corretivo em 48h (2 dias) com bloco enxuto para estancar o erro.'],
            ['50% a 69,9%', 'Hard', 'Retenção Instável', 'Intervalo curto e pico de volume de questões para treinar diferenciação.'],
            ['70% a 89,9%', 'Good', 'Dificuldade Desejável / Fixação Sólida', 'Expansão progressiva da estabilidade com volume equilibrado.'],
            ['90% ou mais', 'Easy', 'Fixação Sólida / Domínio Pleno', 'Intervalo mais longo e micro-checagem de manutenção (anti-overlearning).'],
          ],
        },
        callout: {
          title: 'Por que o ciclo R0..R8 não volta para o zero em uma recaída',
          body: 'Se você escorrega em uma revisão (Rating.Again), o AdaptiveMed reduz a estabilidade FSRS e agenda um reteste em 48h, mas mantém o contador de ciclos monotônico. Isso preserva o histórico real de quantas vezes você já encarou o tema, sem apagar sua linha do tempo evolutiva.',
          tone: 'info',
        },
      },
      {
        id: 'comparativo-pratico',
        heading: 'Comparativo prático: 1-7-15-30 vs FSRS-6 em um mês real de estudo',
        paragraphs: [
          'Imagine dois assuntos estudados na mesma segunda-feira: Hipertensão Arterial Sistêmica (onde você acerta 93% já no primeiro bloco) e Cetoacidose Diabética / EHH (onde você fecha em 55%). Em uma planilha 1-7-15-30, ambos vão consumir exatamente as mesmas quatro datas e a mesma carga horária ao longo do mês.',
          'Com o FSRS-6 integrado ao dimensionamento dinâmico de questões do AdaptiveMed, os dois caminhos se separam imediatamente. Em HAS, o algoritmo alonga o intervalo e reduz o bloco seguinte para uma validação enxuta (~10 a 14 questões), economizando energia mental. Em Cetoacidose, o algoritmo traz a próxima revisão para poucos dias depois, concentra o volume na zona de esforço produtivo (~20 questões) e ainda aplica peso extra se houver erros de Lacuna Teórica registrados no Caderno de Erros.',
        ],
        table: {
          caption: 'Diferença operacional entre revisão fixa e FSRS-6 adaptativo',
          headers: ['Critério', 'Planilha Fixa (1-7-15-30)', 'AdaptiveMed com FSRS-6'],
          rows: [
            ['Intervalo entre revisões', 'Idêntico para todos os assuntos', 'Personalizado por Estabilidade (S) e Dificuldade (D)'],
            ['Volume de questões', 'Manual ou fixo (ex.: sempre 30)', 'Curva contínua de 10 a 30 questões conforme acurácia'],
            ['Atraso por plantão/prova', 'Acumula bola de neve manual', 'Rebalanceamento automático respeitando cota diária'],
            ['Horizonte até a prova', 'Ignora a data do edital', 'Teto dinâmico de 14 a 90 dias (Cepeda et al., 2008)'],
            ['Impacto do Caderno de Erros', 'Desconectado do cronograma', 'Causa do erro encurta intervalo (até -45%) e soma questões'],
          ],
        },
      },
      {
        id: 'horizonte-prova-e-volume',
        heading: 'Horizonte até a prova e volume dinâmico: o que o FSRS puro não resolve sozinho',
        paragraphs: [
          'Aplicar um algoritmo de flashcards de idiomas diretamente na Residência Médica sem adaptação gera dois problemas práticos: intervalos que passam de 120 dias (depois da data da prova) e baterias longas demais em temas já dominados ou exaustivas demais em temas que colapsaram.',
          'Por isso o AdaptiveMed acopla duas camadas científicas ao FSRS-6. A primeira vem de Cepeda et al. (2008): o intervalo máximo nunca excede 20% dos dias restantes até o exame (entre 14 e 90 dias), garantindo pelo menos um ciclo de consolidação na reta final. A segunda segue as Dificuldades Desejáveis de Bjork & Bjork: uma curva gaussiana centrada em 60% de acerto direciona o maior volume de questões para onde o ganho marginal de aprendizado é máximo, reduzindo o bloco tanto abaixo de 50% (reteste rápido para evitar fadiga) quanto acima de 85% (micro-checagem anti-overlearning).',
        ],
        callout: {
          title: 'Regra prática para começar hoje',
          body: 'Cadastre seus temas já vistos em R0 com o percentual real da sua última lista. Em vez de tentar adivinhar datas no papel, deixe o FSRS-6 calcular a primeira janela e ajuste sua cota máxima diária no Diário Semanal de acordo com o rodízio atual.',
          tone: 'tip',
        },
      },
    ],
    faqs: [
      {
        question: 'O FSRS-6 funciona para questões de Residência Médica ou só para flashcards (Anki)?',
        answer:
          'Funciona perfeitamente para revisão por blocos de questões. Em vez de avaliar carta por carta, o AdaptiveMed traduz o percentual de acerto de cada bateria (0% a 100%) em ratings FSRS-6 (Again, Hard, Good, Easy), mantendo o rigor matemático da curva de memória com a velocidade de registro que o internato exige.',
      },
      {
        question: 'Qual é a taxa de retenção alvo usada pelo FSRS-6 no AdaptiveMed?',
        answer:
          'O motor utiliza meta de retenção de 90% (request_retention = 0,90). Essa faixa equilibra alta probabilidade de acerto no dia da prova com uma carga diária sustentável de revisões ao longo de 6 a 12 meses de preparação.',
      },
      {
        question: 'Preciso abandonar minha planilha antiga do zero para migrar para o FSRS-6?',
        answer:
          'Não. Você pode cadastrar apenas os assuntos que está revisando nesta semana com o percentual real obtido e ir migrando os blocos anteriores gradualmente. Em duas semanas o cronograma já está calibrado pelo seu histórico real.',
      },
      {
        question: 'O que acontece se eu atrasar uma revisão agendada pelo FSRS-6?',
        answer:
          'O FSRS-6 considera o tempo real decorrido (actualElapsedDays) no momento em que você finalmente faz a revisão, e não apenas o intervalo planejado. Além disso, o botão "Rebalancear Atrasados" no Diário Semanal redistribui pendências sem estourar seu limite diário.',
      },
    ],
    relatedBancas: ['enare', 'usp-sp', 'sus-sp', 'unifesp'],
    relatedGuias: [
      'caderno-de-erros-inteligente-residencia-medica',
      'cronograma-revisoes-internato-sem-atrasos',
      'combinar-cursinho-com-repeticao-espacada',
    ],
  },
  {
    slug: 'caderno-de-erros-inteligente-residencia-medica',
    title: 'Como Montar um Caderno de Erros Inteligente para Residência Médica',
    shortTitle: 'Caderno de Erros Inteligente na Prática',
    description:
      'Aprenda a transformar questões erradas em ganho real de pontuação classificando a causa do erro e conectando o Caderno de Erros diretamente ao agendamento FSRS-6.',
    category: 'Estratégia de Questões',
    readingTimeMinutes: 8,
    lastModified: LAST_CONTENT_UPDATE,
    keywords: [
      'caderno de erros residência médica',
      'como fazer caderno de erros medicina',
      'classificação de erros provas médicas',
      'revisar questões erradas residência',
      'lacuna teórica pegadinha banca',
    ],
    keyTakeaways: [
      'Copiar enunciados inteiros ou prints sem diagnóstico cria um cemitério de anotações que ninguém relê em outubro.',
      'Classificar a causa do erro (Lacuna teórica, Interpretação, Pegadinha da banca ou Distração) define qual intervenção realmente corrige a falha.',
      'No AdaptiveMed, erros ativos no Caderno aplicam peso direto no FSRS-6: encurtam o intervalo de revisão (de -2% até -45%) e adicionam questões extras automaticamente.',
    ],
    sections: [
      {
        id: 'erro-classico-caderno',
        heading: 'Por que a maioria dos cadernos de erros vira um arquivo morto',
        paragraphs: [
          'Todo estudante de medicina já tentou montar um caderno de erros no Notion, no OneNote ou em um caderno físico: printa a questão, cola o comentário inteiro do professor e promete reler tudo na véspera da prova. Três meses depois, existem 400 páginas acumuladas, zero revisão efetiva e os mesmos erros continuam se repetindo nos simulados.',
          'O problema central é confundir arquivamento com correção ativa. Um caderno de erros só sobe a sua nota quando cumpre três requisitos: registro ultra-rápido (menos de 45 segundos por questão), síntese do mecanismo do erro em 2 a 4 linhas e retorno programado para reteste ativo antes que o padrão errado volte a se consolidar.',
        ],
        bullets: [
          'Não copie o enunciado completo: anote apenas a referência (ex.: USP-SP 2024 Q18) e o gatilho clínico que você deixou passar.',
          'Escreva a regra de decisão em primeira pessoa ("Em gestante com PA 160x110 sem proteinúria, checar lesão de órgão-alvo antes de descartar pré-eclâmpsia").',
          'Evite acumular anotações incompletas: no AdaptiveMed você pode salvar um registro rápido durante o bloco e filtrar depois por "Para complementar" (<60 caracteres) para lapidar no fim do dia.',
        ],
      },
      {
        id: 'quatro-causas-de-erro',
        heading: 'As 4 causas de erro que mudam a forma como você deve revisar',
        paragraphs: [
          'Errar uma questão de Sepse porque você não sabia o ponto de corte do SOFA é completamente diferente de errar porque não leu a palavra "EXCETO" no comando. Tratar os dois erros da mesma maneira desperdiça revisões e mascara onde estão os pontos mais baratos da sua prova.',
          'No Caderno de Erros do AdaptiveMed, cada registro recebe uma das 4 causas estruturais. Essa classificação não serve apenas para gráfico bonito: ela altera matematicamente o próximo agendamento FSRS-6 daquele assunto enquanto o erro permanecer ativo (não marcado como revisado).',
        ],
        table: {
          caption: 'Peso real de cada causa do Caderno de Erros no motor FSRS-6 do AdaptiveMed',
          headers: ['Causa do erro', 'Ajuste no intervalo FSRS-6', 'Questões extras', 'Ação prática recomendada'],
          rows: [
            ['Lacuna teórica', '-22% no intervalo (fator 0,78)', '+3 questões', 'Rever critério diagnóstico, fluxograma ou dose em resumo enxuto e retestar cedo.'],
            ['Interpretação', '-12% no intervalo (fator 0,88)', '+2 questões', 'Sublinhar faixa etária, tempo de evolução e comando antes de ler as alternativas.'],
            ['Pegadinha da banca', '-8% no intervalo (fator 0,92)', '+1 questão', 'Registrar o distrator típico da instituição (ex.: conduta de exceção ou diretriz específica).'],
            ['Distração', '-2% no intervalo (fator 0,98)', 'Sem extras', 'Monitorar fadiga e ritmo no Modo Foco; não inflar revisões teóricas sem necessidade.'],
          ],
        },
        callout: {
          title: 'Efeito combinado com proteção contra sobrecarga',
          body: 'Quando um mesmo tema acumula múltiplos erros ativos, os fatores são combinados com piso de segurança de 0,55 (redução máxima de 45% no intervalo) e teto de +8 questões bônus, nunca ultrapassando 30 questões por revisão. Assim o sistema intensifica o ataque sem travar seu cronograma.',
          tone: 'info',
        },
      },
      {
        id: 'fluxo-revisao-ativa-flashcards',
        heading: 'O ritual de 15 minutos que transforma erros em acertos na prova',
        paragraphs: [
          'De nada adianta registrar erros com perfeição se eles nunca voltarem para a sua memória de trabalho. A forma mais eficiente de fechar o ciclo é combinar duas engrenagens: o peso automático nas revisões FSRS-6 e sessões curtas no Modo Flashcards de Erros antes de dormir ou nos intervalos do hospital.',
          'No Modo Flashcards do Caderno de Erros do AdaptiveMed, você vê primeiro o tema, a referência da questão e a causa registrada, tenta reconstruir mentalmente o raciocínio correto (prática de recuperação ativa) e só então revela seu resumo conceitual. Quando você percebe que o conceito já está automático — e acertou questões equivalentes na revisão seguinte — marca o erro como "Revisado", liberando o FSRS-6 para voltar ao espaçamento normal.',
        ],
        bullets: [
          'Durante a bateria de questões: anote apenas o assunto, a causa e uma frase curta (20 segundos).',
          'Ao final do bloco: complete os rascunhos pendentes e destaque o critério decisivo que diferenciava a alternativa correta da marcada.',
          '2 a 3 vezes por semana (15 min): rode o Modo Flashcards ("Treinar Meus Erros") filtrando por "A revisar" ou por "Lacuna teórica".',
          'Na semana pré-simulado: filtre os erros da banca-alvo para revisar pegadinhas recorrentes de instituições como USP-SP, ENARE ou PSU-MG.',
        ],
      },
      {
        id: 'quando-arquivar-um-erro',
        heading: 'Quando marcar um erro como resolvido (e quando mantê-lo ativo)',
        paragraphs: [
          'Um erro comum de estudantes perfeccionistas é nunca marcar um item do caderno como revisado. Se você mantiver 15 erros antigos presos em Cardiologia indefinidamente, o peso no FSRS-6 vai continuar comprimindo o intervalo mesmo depois de você já ter dominado o tema.',
          'Use uma regra objetiva de graduação: um erro só sai da fila ativa depois que você conseguiu explicar o raciocínio sem consulta no Modo Flashcards e bateu pelo menos 80% na revisão FSRS-6 subsequente daquele assunto. Se o mesmo erro aparecer em um simulado futuro, reative-o — esse sinal mostra uma confusão persistente que merece atenção cirúrgica.',
        ],
        callout: {
          title: 'Dica de ouro para bancas discursivas e casos longos',
          body: 'Para bancas como USP-SP, UNICAMP e UNIFESP, crie registros focados em conduta passo a passo (ex.: "1º exame vs exame padrão-ouro", "critério de internação em UTI"). São esses detalhes de conduta imediata que separam 78% de 86%.',
          tone: 'tip',
        },
      },
    ],
    faqs: [
      {
        question: 'Devo colocar TODAS as questões que erro no Caderno de Erros?',
        answer:
          'Sim para o diagnóstico, mas com profundidade proporcional à causa. Erros de Lacuna teórica e Pegadinha da banca merecem um resumo conceitual claro de 2 a 4 linhas. Erros puros de Distração podem ter registro breve apenas para monitorar se o cansaço está derrubando sua nota no fim das baterias.',
      },
      {
        question: 'Como o Caderno de Erros conversa com o FSRS-6 no AdaptiveMed?',
        answer:
          'Sempre que você conclui uma revisão, o AdaptiveMed verifica os erros ainda ativos daquele assunto. Cada causa aplica um fator no próximo intervalo (de -2% em Distração até -22% em Lacuna teórica, limitado a -45% no acumulado) e soma questões extras (até +8, respeitando o teto de 30 questões).',
      },
      {
        question: 'Quanto tempo por dia devo gastar alimentando o Caderno de Erros?',
        answer:
          'Entre 10 e 20 minutos ao final da bateria de questões. Se você está gastando mais de 1 hora por dia formatando caderno, está reescrevendo teoria em vez de registrar o gatilho exato do erro.',
      },
      {
        question: 'É melhor fazer Caderno de Erros por banca ou por grande área?',
        answer:
          'Estruture por assunto dentro da Grande Área (para alimentar a repetição espaçada) e coloque o nome e o ano da banca no campo de referência da questão. Assim você consegue tanto fortalecer o tema no FSRS-6 quanto filtrar padrões específicos de uma instituição.',
      },
    ],
    relatedBancas: ['usp-sp', 'unicamp', 'psu-mg', 'enare'],
    relatedGuias: [
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
      'simulados-provas-na-integra-nota-de-corte',
      'combinar-cursinho-com-repeticao-espacada',
    ],
  },
  {
    slug: 'cronograma-revisoes-internato-sem-atrasos',
    title: 'Cronograma de Revisões no Internato Sem Acumular Atrasos',
    shortTitle: 'Cronograma de Revisões no Internato',
    description:
      'Como montar um cronograma realista de revisões para o 5º e 6º ano de Medicina entre plantões, enfermarias e ambulatórios — sem deixar o atraso virar desistência.',
    category: 'Rotina & Internato',
    readingTimeMinutes: 8,
    lastModified: LAST_CONTENT_UPDATE,
    keywords: [
      'cronograma internato residência médica',
      'estudar para residência no internato',
      'como não atrasar revisões medicina',
      'rotina de estudos 6º ano medicina',
      'rebalancear revisões atrasadas',
    ],
    keyTakeaways: [
      'O erro número 1 no internato é planejar a semana pela sua energia do domingo à tarde em vez da sua carga real de plantões e rodízios.',
      'Limitar a cota máxima diária de revisões (ex.: 2 a 3 revisões/dia) e usar o Rebalanceamento Automático impede que um plantão de 24h destrua o mês inteiro.',
      'Alternar Grandes Áreas na mesma semana (Interleaving) e usar blocos curtos de 25 a 45 minutos no Modo Foco mantém a constância mesmo em rodízios cirúrgicos.',
    ],
    sections: [
      {
        id: 'armadilha-do-cronograma-ideal',
        heading: 'A armadilha do cronograma perfeito no internato',
        paragraphs: [
          'Quem está no 5º ou 6º ano sabe que nenhuma semana do internato é igual à anterior. Um rodízio de Atenção Primária pode liberar 4 horas líquidas por dia; na semana seguinte, um rodízio de Pronto-Socorro ou Cirurgia Geral com plantão noturno reduz esse tempo para 45 minutos quebrados.',
          'Quando o estudante monta um cronograma rígido exigindo 5 revisões + 2 aulas por dia, o primeiro plantão mais pesado cria um passivo de 8 revisões atrasadas. Em duas semanas, o painel fica vermelho, a culpa aumenta e o aluno abandona o sistema inteiro — perdendo justo o hábito que garante aprovação.',
        ],
        bullets: [
          'Planeje pelo piso de tempo disponível nos dias puxados, não pelo teto dos dias tranquilos.',
          'Separe o "dia de manutenção" (pós-plantão: só 1 revisão curta + 10 min de flashcards de erro) do "dia de avanço" (aula nova + 2 a 3 revisões).',
          'Troque a meta de "horas sentado" por "revisões concluídas com qualidade e registro de acurácia".',
        ],
      },
      {
        id: 'cota-diaria-e-rebalanceamento',
        heading: 'Cota diária máxima e rebalanceamento: a vacina contra a bola de neve',
        paragraphs: [
          'Um sistema sustentável no internato precisa de duas válvulas de escape automáticas: limite de vagas por dia e redistribuição inteligente de atrasos. No AdaptiveMed, o algoritmo anti-sobrecarga respeita a sua cota máxima diária (por exemplo, 3 revisões/dia). Se uma revisão calculada pelo FSRS-6 cair em um dia que já está lotado, ela é deslocada automaticamente para o próximo dia com vaga livre.',
          'E quando um imprevisto real acontece — semana de provas da faculdade, plantão extra ou doença — você não precisa remarcar 18 datas manualmente. Na Grade Semanal do Diário, o botão "Rebalancear Atrasados" reorganiza todas as revisões vencidas a partir de hoje respeitando sua cota diária e preservando o que já estava agendado.',
        ],
        table: {
          caption: 'Sugestão de cota diária de revisões por intensidade do rodízio',
          headers: ['Perfil do rodízio', 'Tempo líquido/dia', 'Cota sugerida no Diário', 'Estratégia de execução'],
          rows: [
            ['Rodízio leve (UBS / Ambulatório)', '3h a 4h30', '3 a 4 revisões/dia', '2 blocos de revisão FSRS-6 + teoria nova do cursinho + Caderno de Erros.'],
            ['Rodízio moderado (Enfermaria)', '1h30 a 2h30', '2 a 3 revisões/dia', 'Priorizar revisões FSRS-6 e manter teoria nova apenas em temas de alta prevalência.'],
            ['Rodízio pesado (PS / Cirurgia / Plantão)', '45 min a 1h15', '1 a 2 revisões/dia', 'Proteger a sequência de revisões curtas e concentrar teoria nova no fim de semana.'],
          ],
        },
        callout: {
          title: 'Sincronize sua agenda médica com o Google ou Apple Calendar',
          body: 'No Diário do AdaptiveMed você pode exportar as próximas revisões em 1 clique no formato .ics. Ver suas revisões ao lado da escala de plantões evita prometer 4 blocos em um dia de plantão de 12h ou 24h.',
          tone: 'tip',
        },
      },
      {
        id: 'interleaving-e-microblocos',
        heading: 'Interleaving e microblocos no Modo Foco entre enfermarias',
        paragraphs: [
          'Estudar apenas Pediatria durante cinco dias seguidos porque você está no rodízio de Pediatria dá uma sensação confortável de fluidez, mas piora a retenção de longo prazo para provas que misturam as 5 Grandes Áreas. Pesquisas de Rohrer & Taylor (2007) e Kornell & Bjork (2008) demonstram que a prática intercalada (Interleaving) fortalece a capacidade de discriminar diagnósticos diferenciais.',
          'A fila priorizada do AdaptiveMed aplica interleaving automático entre Grandes Áreas sempre que há matérias diferentes disponíveis no dia. Você pode aproveitar o contexto do internato para ver um tema novo do rodízio atual, enquanto as revisões FSRS-6 mantêm Clínica, Cirurgia, GO, Pediatria e Preventiva aquecidas em blocos de 25 a 45 minutos no Modo Foco (Floresta 3D).',
        ],
        bullets: [
          'Regra dos 25 minutos: mesmo cansado após o ambulatório, 1 ciclo no Modo Foco basta para matar 15 questões de revisão e registrar o percentual.',
          'Use o deslocamento ou intervalos curtos para o Modo Flashcards do Caderno de Erros em vez de iniciar uma aula longa que vai ficar pela metade.',
          'Nunca sacrifique todas as revisões para "colocar aulas em dia": aula vista sem revisão vira esquecimento em 14 dias.',
        ],
      },
      {
        id: 'protocolo-semana-caotica',
        heading: 'Protocolo de 3 passos para sobreviver a uma semana caótica',
        paragraphs: [
          'Ninguém atravessa 10 meses de internato sem pelo menos três ou quatro semanas fora de controle. A diferença entre quem mantém a curva ascendente e quem trava em agosto está no protocolo de retorno na segunda-feira seguinte.',
        ],
        bullets: [
          'Passo 1 — Zere a culpa e clique em Rebalancear Atrasados: dilua o passivo nos próximos 5 a 7 dias respeitando sua cota diária real.',
          'Passo 2 — Pause aulas novas por 72 horas se o atraso passar de 10 revisões: estabilizar memória consolidada vale mais pontos do que abrir 4 temas inéditos.',
          'Passo 3 — Retome com vitórias rápidas: comece o dia por uma revisão de 10 a 15 questões de um tema familiar para recuperar o embalo antes de encarar os temas com <60%.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Quantas revisões por dia são ideais durante o internato?',
        answer:
          'Para a maioria dos internos, entre 2 e 3 revisões por dia (30 a 60 questões no total, graças ao volume dinâmico de 10 a 30 questões por revisão) é o ponto ideal entre retenção alta e sustentabilidade ao lado dos plantões.',
      },
      {
        question: 'Se eu usar "Rebalancear Atrasados", o FSRS-6 perde precisão?',
        answer:
          'Não. O FSRS-6 calcula a próxima estabilidade usando o número real de dias decorridos entre a revisão anterior e a data em que você efetivamente concluiu a revisão atual. Rebalancear apenas torna sua fila executável novamente.',
      },
      {
        question: 'Devo estudar no mesmo rodízio que estou passando no hospital?',
        answer:
          'Aproveitar os casos reais do rodízio para aprender temas novos é ótimo, mas as suas revisões espaçadas devem continuar intercalando as 5 Grandes Áreas. Assim você não chega em outubro tendo esquecido Ginecologia ou Preventiva porque passou dois meses em Cirurgia.',
      },
      {
        question: 'Vale a pena estudar no dia pós-plantão noturno?',
        answer:
          'Evite aulas teóricas densas em privação de sono severa. Depois de dormir, faça apenas 1 revisão curta de manutenção ou 15 minutos de Flashcards do Caderno de Erros para manter o ritmo sem forçar aprendizagem nova com baixa consolidação.',
      },
    ],
    relatedBancas: ['enare', 'sus-sp', 'ses-pe', 'psu-ba', 'amrigs'],
    relatedGuias: [
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
      'combinar-cursinho-com-repeticao-espacada',
      'simulados-provas-na-integra-nota-de-corte',
    ],
  },
  {
    slug: 'combinar-cursinho-com-repeticao-espacada',
    title: 'Como Combinar Cursinho (Medcurso, Estratégia Med, Sanar) com Repetição Espaçada',
    shortTitle: 'Combinar Cursinho com Repetição Espaçada',
    description:
      'Veja o fluxo exato para usar seu cursinho (Medcurso, Estratégia Med, Sanar, Medcel) como fonte de teoria e questões enquanto o AdaptiveMed governa revisões FSRS-6 e métricas.',
    category: 'Integração de Estudo',
    readingTimeMinutes: 8,
    lastModified: LAST_CONTENT_UPDATE,
    keywords: [
      'combinar medcurso com repetição espaçada',
      'estratégia med cronograma revisões',
      'sanar residência repetição espaçada',
      'organizar estudos cursinho residência médica',
      'FSRS-6 com cursinho medicina',
    ],
    keyTakeaways: [
      'Cursinhos excelentes entregam aula, apostila e banco de questões; o que geralmente falta é um motor científico individual que decida quando revisar cada tema com base na sua memória real.',
      'O fluxo vencedor separa papéis: assista/resolva no seu cursinho e registre o bloco em 10 segundos no AdaptiveMed para acionar o FSRS-6.',
      'Priorize revisões por prevalência da sua banca-alvo para evitar gastar a mesma energia em temas raros e temas que caem todo ano.',
    ],
    sections: [
      {
        id: 'por-que-so-seguir-cursinho-nao-basta',
        heading: 'Por que apenas acompanhar o calendário do cursinho deixa lacunas até a prova',
        paragraphs: [
          'Os principais preparatórios do Brasil — como Medcurso, Estratégia Med, Sanar e Medcel — oferecem aulas didáticas, apostilas atualizadas e bancos com dezenas de milhares de questões comentadas. Ainda assim, milhares de alunos assistem a 90% das aulas durante o ano e chegam em outubro com a sensação angustiante de que esqueceram o que viram em março.',
          'O motivo é simples: o calendário do cursinho é linear e coletivo (feito para entregar o edital para todos os alunos na mesma ordem), enquanto a sua memória é não-linear e individual. Um aluno já domina Pré-Natal e trava em Nefrologia; outro acerta 90% em Pediatria e derrapa em Epidemiologia. Sem uma camada individual de repetição espaçada, a revisão fica dependente de "achar tempo" no fim do semestre.',
        ],
        callout: {
          title: 'AdaptiveMed não substitui seu cursinho — ele multiplica o retorno dele',
          body: 'Você continua usando exatamente as vídeo-aulas, resumos e o banco de questões que já assina. O AdaptiveMed atua como o seu sistema operacional de revisão: recebe seus acertos em 10 segundos, calcula o próximo intervalo FSRS-6, dimensiona quantas questões fazer e cruza tudo com o Caderno de Erros e os Simulados.',
          tone: 'info',
        },
      },
      {
        id: 'fluxo-quatro-passos',
        heading: 'O fluxo prático de 4 passos para cada semana de cursinho',
        paragraphs: [
          'Para que a combinação funcione sem gerar retrabalho, o registro precisa ser quase sem atrito. Em vez de criar resumos duplicados em duas plataformas, adote este fluxo fechado para cada assunto da semana do seu cursinho:',
        ],
        bullets: [
          '1. Contato inicial (R0): assista à aula ou leia o resumo direto do cursinho e faça a primeira bateria de questões (20 a 30 questões) no banco que você já utiliza.',
          '2. Registro em 10 segundos no AdaptiveMed: lance o assunto (ou importe da trilha), informe acertos/total e pronto — o FSRS-6 agenda R1 automaticamente com data e volume calculados para o seu desempenho.',
          '3. Caderno de Erros cirúrgico: das questões erradas na bateria, cadastre no AdaptiveMed apenas o gatilho do erro e a causa (Lacuna teórica, Interpretação, Pegadinha ou Distração).',
          '4. Execução pelo Diário Semanal: nos dias seguintes, abra o Diário do AdaptiveMed, veja quais revisões (R1..R8) vencem hoje, filtre exatamente a quantidade recomendada de questões no banco do seu cursinho e registre o novo percentual.',
        ],
      },
      {
        id: 'como-evitar-atraso-de-aulas',
        heading: 'Como lidar quando o cursinho despeja mais aulas do que você consegue revisar',
        paragraphs: [
          'Entre abril e agosto, é comum o cronograma do cursinho acelerar e liberar 5 ou 6 temas extensos na mesma semana. Se você tentar assistir tudo passivamente sem filtrar por relevância e sem fazer questões, acumula "aulas vistas" que não se convertem em pontos.',
          'A solução é cruzar o calendário do cursinho com a prevalência histórica das suas bancas-alvo. Em temas de altíssima incidência (ex.: Síndromes Coronarianas, Pré-eclâmpsia, Vacinação, Trauma/ATLS, Políticas do SUS), assista com atenção e mantenha o ciclo FSRS-6 impecável. Em subtemas periféricos, faça um estudo reverso direto por questões (15 a 20 questões comentadas no cursinho) e lance o resultado em R0 no AdaptiveMed.',
        ],
        table: {
          caption: 'Como combinar o formato de estudo do cursinho com o ciclo FSRS-6',
          headers: ['Tipo de assunto', 'Como usar o cursinho', 'Como registrar no AdaptiveMed'],
          rows: [
            ['Alta prevalência + baixa base', 'Aula completa + 25 a 30 questões comentadas', 'Lançar R0 + registrar Lacunas Teóricas no Caderno de Erros'],
            ['Alta prevalência + boa base', 'Resumo enxuto + 20 a 25 questões diretas', 'Lançar R0; FSRS-6 alongará o intervalo se acerto >= 85%'],
            ['Baixa prevalência / rodapé de edital', 'Estudo reverso: 15 questões comentadas', 'Lançar R0 para manter revisão espaçada leve sem perder horas de vídeo'],
          ],
        },
      },
      {
        id: 'erro-de-medir-por-aulas-assistidas',
        heading: 'Troque a métrica de vaidade ("aulas assistidas") por retenção real por área',
        paragraphs: [
          'Ver 100% de barrinhas verdes de vídeo assistido dá conforto psicológico, mas a banca não cobra presença em vídeo — cobra acurácia sob pressão. Ao centralizar todas as baterias de questões e simulados no AdaptiveMed, você enxerga na tela de Evolução e Prevalência exatamente qual Grande Área está segurando sua nota.',
          'Se Clínica Médica está em 84% e Preventiva em 63%, você sabe na hora que assistir a mais duas aulas extras de Cardiologia terá retorno menor do que atacar suas revisões FSRS-6 de Epidemiologia e SUS — independentemente do que diz o calendário genérico da turma.',
        ],
        callout: {
          title: 'Dica para quem faz dois bancos ou muda de cursinho no meio do ano',
          body: 'Como o seu histórico de revisões FSRS-6, Caderno de Erros e Simulados fica centralizado no AdaptiveMed (e ainda pode ser exportado em CSV a qualquer momento), sua memória e suas métricas nunca ficam presas a uma única plataforma de aulas.',
          tone: 'tip',
        },
      },
    ],
    faqs: [
      {
        question: 'Funciona com qualquer cursinho (Medcurso, Estratégia Med, Sanar, Medcel, Medway)?',
        answer:
          'Sim. O AdaptiveMed é independente da plataforma de aulas ou banco de questões. Você continua estudando e resolvendo questões no seu cursinho de preferência e usa o AdaptiveMed para governar quando revisar, quantas questões fazer e quais erros priorizar.',
      },
      {
        question: 'Se o meu cursinho já tem um cronograma de revisões, por que usar o FSRS-6?',
        answer:
          'A maioria dos cronogramas de cursinho usa revisões fixas ou blocos semanais iguais para todos os alunos. O FSRS-6 do AdaptiveMed personaliza cada intervalo pela sua acurácia real, integra o peso do seu Caderno de Erros, respeita sua cota diária do internato e aplica teto pelo horizonte da sua prova.',
      },
      {
        question: 'Devo cadastrar no AdaptiveMed aulas que assisti mas ainda não fiz questões?',
        answer:
          'Você pode planejar o assunto no Diário Semanal, mas o ciclo FSRS-6 só ganha calibração real quando você registra o percentual de acerto de uma bateria de questões (R0). Sem questões, não há medição confiável de retenção.',
      },
      {
        question: 'Quantas questões devo fazer em R0 depois da aula do cursinho?',
        answer:
          'Entre 20 e 30 questões comentadas é uma amostra excelente para R0: grande o suficiente para revelar lacunas reais e curta o bastante para caber na rotina. A partir de R1, o AdaptiveMed calcula o volume ideal (entre 10 e 30 questões) pela curva dinâmica.',
      },
    ],
    relatedBancas: ['enare', 'usp-sp', 'sus-sp', 'psu-mg', 'revalida'],
    relatedGuias: [
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
      'caderno-de-erros-inteligente-residencia-medica',
      'cronograma-revisoes-internato-sem-atrasos',
    ],
  },
  {
    slug: 'simulados-provas-na-integra-nota-de-corte',
    title: 'Simulados e Provas na Íntegra: Como Subir sua Nota até a Nota de Corte',
    shortTitle: 'Simulados, Provas na Íntegra e Nota de Corte',
    description:
      'Metodologia completa para usar simulados nacionais e provas antigas na íntegra com diagnóstico por Grande Área, correção estratégica e retroalimentação no FSRS-6.',
    category: 'Performance em Prova',
    readingTimeMinutes: 9,
    lastModified: LAST_CONTENT_UPDATE,
    keywords: [
      'simulados residência médica',
      'provas na íntegra residência médica',
      'como subir nota simulado residência',
      'nota de corte residência médica',
      'estratégia prova antiga ENARE USP',
    ],
    keyTakeaways: [
      'Fazer simulado sem pós-prova estruturado apenas mede sua ansiedade; o salto de pontuação acontece na correção e na retroalimentação do cronograma.',
      'Simulados Gerais constroem resistência e visão ampla; Provas na Íntegra das bancas-alvo calibram estilo de enunciado, tempo e pegadinhas específicas.',
      'Use o Hub de Simulados & Provas do AdaptiveMed para separar a evolução em simulados gerais das provas por instituição e atacar a Grande Área com maior gap até a nota de corte.',
    ],
    sections: [
      {
        id: 'simulado-geral-vs-prova-na-integra',
        heading: 'Simulado geral vs Prova na íntegra: quando usar cada ferramenta',
        paragraphs: [
          'Muitos candidatos tratam simulados do cursinho e provas antigas na íntegra como se fossem a mesma coisa. Na prática, eles cumprem funções complementares em fases diferentes da preparação — e é exatamente por isso que o AdaptiveMed separa os dois em abas dedicadas no Hub de Simulados & Provas.',
          'No primeiro semestre, os Simulados Gerais servem para construir resistência de 4 horas, testar controle de tempo e acompanhar a evolução global nas 5 Grandes Áreas (Clínica Médica, Cirurgia Geral, Ginecologia e Obstetrícia, Pediatria e Medicina Preventiva). A partir do segundo semestre — e com intensidade máxima nos últimos 90 dias — as Provas na Íntegra dos últimos 5 anos das suas instituições prioritárias (como ENARE, USP-SP, SUS-SP, UNICAMP, UNIFESP, SES-PE, PSU-MG ou PSU-BA) passam a ser o principal termômetro da nota de corte real.',
        ],
        table: {
          caption: 'Cadência recomendada de simulados e provas na íntegra ao longo do ano',
          headers: ['Fase do ano', 'Simulados Gerais', 'Provas na Íntegra da banca', 'Objetivo principal'],
          rows: [
            ['Base (Jan–Mai)', '1 a cada 3–4 semanas', 'Opcional (1 diagnóstica)', 'Criar resistência, calibrar tempo e mapear área mais fraca.'],
            ['Consolidação (Jun–Ago)', '1 a cada 2 semanas', '1 por mês da banca-alvo', 'Fechar lacunas recorrentes e subir piso das 5 áreas acima de 70%.'],
            ['Reta Final (Set–Nov)', 'Pontuais ou substituídos', '1 a 2 por semana (últimos 5 anos)', 'Dominar estilo da banca, gestão de tempo e bater a nota de corte com margem.'],
          ],
        },
      },
      {
        id: 'como-destravar-plato-de-nota',
        heading: 'Como sair do platô dos 65%–72% e chegar à nota de corte',
        paragraphs: [
          'Quase todo candidato experimenta um platô frustrante no meio do ano: estuda 3 a 4 horas por dia, mas a nota nos simulados fica presa entre 65% e 72%. Quando isso acontece, raramente o problema é "falta de horas de vídeo" — quase sempre é desequilíbrio entre Grandes Áreas ou sangramento em erros repetidos.',
          'Analise sua nota fatiada pelas 5 Grandes Áreas. É muito mais rápido subir Medicina Preventiva de 60% para 85% (+5 questões diretas em uma prova de 100 questões) ou Cirurgia de 64% para 80% do que tentar espremer Clínica Médica de 84% para 90%. Registrar cada simulado por área no AdaptiveMed expõe imediatamente onde cada hora extra compra mais pontos.',
        ],
        bullets: [
          'Regra do piso de área: identifique a sua área com menor percentual nos últimos 3 simulados e dê prioridade absoluta às revisões FSRS-6 dela na semana seguinte.',
          'Auditoria de tempo: se você erra desproporcionalmente nas últimas 25 questões da prova, o gargalo é fadiga e gestão de tempo — não falta de teoria.',
          'Margem de segurança: mire consistentemente 4 a 6 pontos percentuais acima da nota de corte histórica da sua especialidade nas provas dos últimos 3 anos da banca.',
        ],
      },
      {
        id: 'protocolo-pos-prova-que-sobe-nota',
        heading: 'O protocolo pós-prova em 3 etapas (onde a nota realmente sobe)',
        paragraphs: [
          'Fazer 100 questões no domingo de manhã é apenas metade do trabalho. Sem um pós-prova disciplinado nas 24 a 48 horas seguintes, você tende a repetir exatamente as mesmas confusões duas semanas depois.',
        ],
        bullets: [
          'Etapa 1 — Registro estruturado (5 minutos): lance a nota geral e o desempenho por Grande Área em Simulados Gerais ou Provas por Instituição no AdaptiveMed para atualizar sua curva histórica (e poder exportar em CSV quando quiser).',
          'Etapa 2 — Triagem implacável dos erros (60 a 90 minutos): para cada questão errada ou acertada no chute, classifique no Caderno de Erros entre Lacuna teórica, Interpretação, Pegadinha da banca ou Distração.',
          'Etapa 3 — Retroalimentação no FSRS-6: os erros ativos lançados automaticamente encurtam o intervalo e adicionam questões nas próximas revisões daqueles assuntos. Se uma prova na íntegra revelou um tema crítico que ainda não estava no seu cronograma, crie o tópico em R0 imediatamente.',
        ],
        callout: {
          title: 'Atenção aos acertos "no chute"',
          body: 'Marque um sinal ao lado das questões que você acertou por eliminação incerta durante o simulado. Se acertou sem saber por quê, ela tem o mesmo risco de erro na prova oficial — vale entrar no Caderno de Erros como Lacuna teórica ou Pegadinha da banca.',
          tone: 'warning',
        },
      },
      {
        id: 'condicoes-reais-de-prova',
        heading: 'Simulando o ambiente real de prova para blindar o emocional',
        paragraphs: [
          'Fazer prova antiga deitado na cama, conferindo o gabarito a cada 5 questões e pausando para ver mensagens infla artificialmente sua nota em 6% a 10% e mascara problemas reais de resistência cognitiva.',
          'Reserve pelo menos uma manhã por quinzena (e semanalmente na reta final) para rodar a prova na íntegra em bloco fechado: cronômetro corrido, folha de respostas, água e lanche idênticos ao dia da prova, e sem consulta ao gabarito até o último minuto. Você pode cronometrar blocos longos no Modo Foco para registrar sua carga real de concentração e monitorar se sua acurácia cai na terceira e quarta hora.',
        ],
        callout: {
          title: 'Use provas antigas da banca também para calibrar a ordem de resolução',
          body: 'Teste nas provas na íntegra se você rende melhor começando pela sua área mais forte (ganhando confiança e tempo) ou seguindo a ordem linear do caderno. Nunca teste uma estratégia nova de ordem de prova apenas no dia oficial.',
          tone: 'tip',
        },
      },
    ],
    faqs: [
      {
        question: 'A partir de quando devo começar a fazer provas na íntegra da minha banca-alvo?',
        answer:
          'Uma prova diagnóstica no início do ano ajuda a conhecer o estilo da instituição. O volume principal de provas na íntegra (últimos 5 anos das 2 ou 3 bancas prioritárias) funciona melhor a partir do segundo semestre, quando você já tem base suficiente para transformar cada erro em ajuste fino.',
      },
      {
        question: 'Quantos anos de provas antigas devo resolver de cada instituição?',
        answer:
          'Os últimos 5 anos na íntegra costumam ser o padrão-ouro para captar o perfil atual da banca e as diretrizes vigentes. Provas mais antigas (6 a 10 anos atrás) continuam úteis como banco de questões filtradas, sempre verificando atualizações de conduta.',
      },
      {
        question: 'É normal minha nota cair quando passo de simulados gerais para uma prova como USP-SP ou UNICAMP?',
        answer:
          'Sim, é completamente esperado. Bancas com casos clínicos longos, imagem e foco em conduta específica têm curva de dificuldade diferente de simulados padronizados. Por isso o AdaptiveMed acompanha Simulados Gerais e Provas por Instituição em curvas separadas.',
      },
      {
        question: 'O que fazer se faltarem 60 dias para a prova e eu ainda estiver 8% abaixo da nota de corte?',
        answer:
          'Concentre 70% do seu tempo em três frentes: provas na íntegra dos últimos 5 anos da banca, revisões FSRS-6 dos temas de maior prevalência com acerto abaixo de 75% e revisão diária dos erros pendentes de Lacuna teórica no Caderno de Erros.',
      },
    ],
    relatedBancas: ['enare', 'usp-sp', 'sus-sp', 'unicamp', 'unifesp', 'ses-pe'],
    relatedGuias: [
      'caderno-de-erros-inteligente-residencia-medica',
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
      'cronograma-revisoes-internato-sem-atrasos',
    ],
  },
];

export function getGuiaBySlug(slug: string): GuiaSeoEntry | undefined {
  return GUIAS_SEO.find((guia) => guia.slug === slug);
}
