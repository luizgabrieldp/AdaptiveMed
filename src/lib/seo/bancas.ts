import { LAST_CONTENT_UPDATE } from './site';

export type BancaRegion = 'Nacional' | 'Sudeste' | 'Nordeste' | 'Sul';

export type GrandeAreaMedica =
  | 'Clínica Médica'
  | 'Cirurgia Geral'
  | 'Pediatria'
  | 'Ginecologia e Obstetrícia'
  | 'Medicina Preventiva';

export type RelatedGuiaSlug =
  | 'fsrs-6-vs-revisoes-fixas-residencia-medica'
  | 'caderno-de-erros-inteligente-residencia-medica'
  | 'cronograma-revisoes-internato-sem-atrasos'
  | 'combinar-cursinho-com-repeticao-espacada'
  | 'simulados-provas-na-integra-nota-de-corte';

export interface BancaAreaDistribution {
  area: GrandeAreaMedica;
  percentage: number;
  focusNote: string;
}

export interface BancaTopTopic {
  topic: string;
  area: GrandeAreaMedica;
  incidence: 'Muito Alta' | 'Alta';
  rationale: string;
}

export interface BancaStudyStep {
  step: number;
  title: string;
  description: string;
  fsrsAction: string;
}

export interface BancaFaq {
  question: string;
  answer: string;
}

export interface BancaSeoEntry {
  slug: string;
  name: string;
  shortName: string;
  article: 'o' | 'a';
  region: BancaRegion;
  stateOrScope: string;
  organizer: string;
  title: string;
  description: string;
  lastModified: string;
  examFormat: string;
  questionCount: string;
  cutoffRange: string;
  profileSummary: string[];
  areaDistribution: BancaAreaDistribution[];
  topTopics: BancaTopTopic[];
  studyStrategy: BancaStudyStep[];
  faqs: BancaFaq[];
  relatedBancas: string[];
  relatedGuias: RelatedGuiaSlug[];
}

export const BANCAS_REGIONS: readonly BancaRegion[] = [
  'Nacional',
  'Sudeste',
  'Nordeste',
  'Sul',
] as const;

export const AREA_VISUAL_STYLE: Record<
  GrandeAreaMedica,
  { barClass: string; badgeClass: string; dotClass: string }
> = {
  'Clínica Médica': {
    barClass: 'bg-blue-600 dark:bg-blue-500',
    badgeClass:
      'border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    dotClass: 'bg-blue-600 dark:bg-blue-400',
  },
  'Cirurgia Geral': {
    barClass: 'bg-emerald-600 dark:bg-emerald-500',
    badgeClass:
      'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    dotClass: 'bg-emerald-600 dark:bg-emerald-400',
  },
  Pediatria: {
    barClass: 'bg-amber-500 dark:bg-amber-400',
    badgeClass:
      'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300',
    dotClass: 'bg-amber-500 dark:bg-amber-400',
  },
  'Ginecologia e Obstetrícia': {
    barClass: 'bg-pink-600 dark:bg-pink-500',
    badgeClass:
      'border-pink-500/35 bg-pink-500/10 text-pink-700 dark:text-pink-300',
    dotClass: 'bg-pink-600 dark:bg-pink-400',
  },
  'Medicina Preventiva': {
    barClass: 'bg-purple-600 dark:bg-purple-500',
    badgeClass:
      'border-purple-500/35 bg-purple-500/10 text-purple-700 dark:text-purple-300',
    dotClass: 'bg-purple-600 dark:bg-purple-400',
  },
};

export const RELATED_GUIA_META: Record<
  RelatedGuiaSlug,
  { title: string; summary: string }
> = {
  'fsrs-6-vs-revisoes-fixas-residencia-medica': {
    title: 'FSRS-6 vs Revisões Fixas 1-7-15-30 na Residência Médica',
    summary:
      'Por que intervalos adaptativos baseados em estabilidade de memória superam cronogramas rígidos até o dia da prova.',
  },
  'caderno-de-erros-inteligente-residencia-medica': {
    title: 'Como Montar um Caderno de Erros Inteligente para Residência Médica',
    summary:
      'Como transformar cada erro de questão em revisão ativa direcionada sem acumular resumos passivos.',
  },
  'cronograma-revisoes-internato-sem-atrasos': {
    title: 'Cronograma de Revisões no Internato Sem Acumular Atrasos',
    summary:
      'Estratégia de cotas diárias e rebalanceamento para manter consistência entre plantões e rodízios puxados.',
  },
  'combinar-cursinho-com-repeticao-espacada': {
    title: 'Como Combinar Cursinho (Medcurso, Estratégia Med, Sanar) com Repetição Espaçada',
    summary:
      'Integre Medcurso, Estratégia, Sanar ou Medcel a um motor adaptativo de revisões por questões.',
  },
  'simulados-provas-na-integra-nota-de-corte': {
    title: 'Simulados e Provas na Íntegra: Como Subir sua Nota até a Nota de Corte',
    summary:
      'Como usar provas antigas cronometradas e análise por grande área para calibrar sua retenção antes da banca.',
  },
};

export const BANCAS_SEO: BancaSeoEntry[] = [
  {
    slug: 'enare',
    name: 'ENARE — Exame Nacional de Residência',
    shortName: 'ENARE',
    article: 'o',
    region: 'Nacional',
    stateOrScope: 'Abrangência Nacional (Rede EBSERH e instituições conveniadas)',
    organizer: 'EBSERH / FGV (banca executora recente)',
    title: 'ENARE Residência Médica: Temas que Mais Caem, Formato e Estratégia',
    description:
      'Guia completo do ENARE para Residência Médica: formato da prova FGV/EBSERH, distribuição das 5 grandes áreas, temas mais cobrados e plano de revisões FSRS-6.',
    lastModified: LAST_CONTENT_UPDATE,
    examFormat:
      'Etapa única nacional com prova objetiva de múltipla escolha (peso de 90%) somada à análise curricular padronizada (peso de 10%), seguida por sistema de escolha de instituição semelhante ao SiSU. Desde a entrada da FGV como banca executora, os enunciados ficaram mais extensos, com foco em interpretação clínica, diretrizes do Ministério da Saúde e raciocínio eliminatório.',
    questionCount: '100 questões objetivas (5 alternativas — A a E)',
    cutoffRange:
      '72% a 88%+ na prova objetiva (varia fortemente por especialidade, instituição escolhida e pontuação curricular)',
    profileSummary: [
      'O ENARE consolidou-se como o maior processo seletivo unificado de Residência Médica do país, reunindo hospitais universitários da rede EBSERH e dezenas de instituições públicas e filantrópicas em todos os estados. Como o candidato escolhe a instituição apenas após conhecer sua nota, cada acerto extra desloca dezenas de posições no ranking nacional.',
      'No perfil recente conduzido pela FGV, a prova valoriza vinhetas clínicas bem contextualizadas, protocolos oficiais do Ministério da Saúde (PCDTs, Cadernos de Atenção Básica e notas técnicas), ética médica e tomada de conduta sob incerteza. Decorar epônimos isolados rende pouco; dominar condutas atualizadas e identificar distratores sutis faz toda a diferença.',
    ],
    areaDistribution: [
      {
        area: 'Clínica Médica',
        percentage: 20,
        focusNote:
          'Ênfase em doenças crônicas prevalentes, infectologia/PCDTs do MS, urgências clínicas e manejo ambulatorial baseado em evidências.',
      },
      {
        area: 'Cirurgia Geral',
        percentage: 20,
        focusNote:
          'ATLS atualizado, abdome agudo, complicações pós-operatórias, vesícula/vias biliares e avaliação pré-operatória.',
      },
      {
        area: 'Pediatria',
        percentage: 20,
        focusNote:
          'PNI atualizado, reanimação neonatal (SBP), doenças respiratórias agudas, aleitamento materno e puericultura.',
      },
      {
        area: 'Ginecologia e Obstetrícia',
        percentage: 20,
        focusNote:
          'Pré-natal de risco habitual e alto risco, síndromes hipertensivas, hemorragia pós-parto, ISTs (PCDT) e rastreamento oncológico.',
      },
      {
        area: 'Medicina Preventiva',
        percentage: 20,
        focusNote:
          'Legislação do SUS, financiamento e redes de atenção, estudos epidemiológicos, vigilância em saúde e bioética/CFM.',
      },
    ],
    topTopics: [
      {
        topic: 'Pré-natal, Síndromes Hipertensivas e Hemorragia Pós-Parto',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Muito Alta',
        rationale:
          'Presença quase certa em toda edição do ENARE; a banca cobra critérios diagnósticos de pré-eclâmpsia com sinais de gravidade, sulfato de magnésio e manejo escalonado da HPP conforme manuais do MS e FEBRASGO.',
      },
      {
        topic: 'Calendário Vacinal (PNI) e Eventos Adversos Pós-Vacinação',
        area: 'Pediatria',
        incidence: 'Muito Alta',
        rationale:
          'Questões práticas sobre atrasos vacinais, contraindicações reais vs. falsas e atualizações recentes do Programa Nacional de Imunizações.',
      },
      {
        topic: 'Políticas Públicas do SUS, APS e Vigilância Epidemiológica',
        area: 'Medicina Preventiva',
        incidence: 'Muito Alta',
        rationale:
          'A FGV explora leis orgânicas (8.080 e 8.142), atributos da Atenção Primária, notificação compulsória e indicadores de saúde aplicados a cenários municipais.',
      },
      {
        topic: 'ATLS, Trauma Torácico e Trauma Abdominal',
        area: 'Cirurgia Geral',
        incidence: 'Muito Alta',
        rationale:
          'Foco na sequência ABCDE, indicações de laparotomia imediata vs. manejo não operatório e diagnóstico rápido de pneumotórax hipertensivo e tamponamento cardíaco.',
      },
      {
        topic: 'Tuberculose, HIV/AIDS e ISTs segundo PCDTs do Ministério da Saúde',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Esquemas terapêuticos, hepatotoxicidade, profilaxia pós-exposição (PEP/PrEP) e abordagem sindrômica de úlceras e corrimentos costumam render múltiplas questões diretas.',
      },
      {
        topic: 'Diabetes Mellitus, Hipertensão Arterial e Risco Cardiovascular',
        area: 'Clínica Médica',
        incidence: 'Alta',
        rationale:
          'Cobra metas terapêuticas, escolha da primeira e segunda linha de anti-hipertensivos/antidiabéticos e manejo de emergências hiperglicêmicas (CAD e EHH).',
      },
      {
        topic: 'Abdome Agudo Inflamatório, Obstrutivo e Perfurativo',
        area: 'Cirurgia Geral',
        incidence: 'Alta',
        rationale:
          'Apendicite, colecistite aguda (critérios de Tóquio), colangite e pancreatite aguda aparecem em vinhetas longas exigindo escolha do melhor exame inicial e momento cirúrgico.',
      },
      {
        topic: 'Reanimação Neonatal e Icterícia Neonatal',
        area: 'Pediatria',
        incidence: 'Alta',
        rationale:
          'Diretrizes da SBP para o minuto de ouro, indicação de VPP/intubação e diferenciação entre icterícia fisiológica, incompatibilidade ABO/Rh e atresia de vias biliares.',
      },
      {
        topic: 'Epidemiologia Clínica e Medicina Baseada em Evidências',
        area: 'Medicina Preventiva',
        incidence: 'Alta',
        rationale:
          'Interpretação de sensibilidade, especificidade, valor preditivo, NNT, intervalo de confiança e vieses em ensaios clínicos ou estudos de coorte.',
      },
    ],
    studyStrategy: [
      {
        step: 1,
        title: 'Mapeie o estilo FGV antes de aumentar volume bruto',
        description:
          'Resolva as provas mais recentes do ENARE e provas médicas da FGV cronometrando o tempo por bloco de 20 questões. O principal gargalo dos candidatos não é falta de teoria, mas fadiga de leitura nos enunciados extensos.',
        fsrsAction:
          'Registre no AdaptiveMed sua taxa de acerto inicial por tema logo após cada bloco para o FSRS-6 calibrar o intervalo de retorno.',
      },
      {
        step: 2,
        title: 'Trate os PCDTs e o PNI como assuntos de retenção máxima',
        description:
          'Detalhes de doses, prazos de notificação e esquemas vacinais decaem rápido na memória se revisados apenas em ciclos fixos de 30 dias.',
        fsrsAction:
          'Classifique erros de protocolos do MS no Caderno de Erros Inteligente para gerar revisões curtas e frequentes até a estabilidade subir.',
      },
      {
        step: 3,
        title: 'Blinde Medicina Preventiva e GO para alavancar a nota global',
        description:
          'Como as 5 grandes áreas têm peso igual (20 questões cada), subir de 65% para 85% em Preventiva gera exatamente os mesmos 4 pontos extras que dominar subespecialidades raras de Clínica Médica.',
        fsrsAction:
          'Defina metas de acurácia por área na Evolução e priorize a fila crítica das áreas abaixo da sua nota de corte alvo.',
      },
      {
        step: 4,
        title: 'Simule a prova na íntegra nos últimos 90 dias',
        description:
          'Faça provas completas de 100 questões sem interrupção, respeitando o tempo de gabarito, para treinar resistência cognitiva e gestão do relógio.',
        fsrsAction:
          'Lance cada simulado na aba Simulados & Bancas para acompanhar a curva de aproximação em relação à nota de corte da sua especialidade.',
      },
    ],
    faqs: [
      {
        question: 'Quantas questões tem a prova do ENARE e como funciona a nota final?',
        answer:
          'Para especialidades de acesso direto, o ENARE aplica 100 questões objetivas de múltipla escolha (20 por grande área médica), que compõem 90% da nota final. Os outros 10% vêm da análise curricular padronizada, sendo que em casos previstos em edital pode haver bonificação do PROVAB/PRMGFC.',
      },
      {
        question: 'O que mudou no ENARE com a banca FGV?',
        answer:
          'Com a execução pela FGV, as questões passaram a trazer casos clínicos mais detalhados, cobrança mais rigorosa de diretrizes oficiais brasileiras (Ministério da Saúde e sociedades médicas) e alternativas que exigem interpretação cuidadosa, reduzindo questões de memorização puramente literal.',
      },
      {
        question: 'Qual percentual de acertos é competitivo no ENARE?',
        answer:
          'Depende muito da especialidade e da instituição escolhida na janela de seleção. Especialidades de menor concorrência costumam chamar a partir da faixa de 70% a 76%, enquanto vagas muito disputadas (como Dermatologia, Oftalmologia, Otorrinolaringologia e Neurocirurgia em grandes centros) frequentemente exigem acima de 84% a 88%, somado a bom currículo.',
      },
      {
        question: 'Vale a pena estudar para o ENARE usando repetição espaçada FSRS-6?',
        answer:
          'Sim. Como o ENARE cobra grande volume de protocolos (PNI, PCDTs, pré-natal, ATLS e SUS) distribuídos igualmente entre as 5 grandes áreas, o algoritmo FSRS-6 evita que você esqueça detalhes de alta incidência enquanto avança nos rodízios do internato ou no cursinho.',
      },
    ],
    relatedBancas: ['sus-sp', 'psu-mg', 'ses-pe', 'revalida'],
    relatedGuias: [
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
      'simulados-provas-na-integra-nota-de-corte',
      'caderno-de-erros-inteligente-residencia-medica',
    ],
  },
  {
    slug: 'usp-sp',
    name: 'USP-SP — Faculdade de Medicina da USP (FMUSP)',
    shortName: 'USP-SP',
    article: 'a',
    region: 'Sudeste',
    stateOrScope: 'São Paulo (Capital — Complexo HC-FMUSP)',
    organizer: 'FUVEST / COREME HC-FMUSP',
    title: 'USP-SP Residência Médica: Perfil da Prova FMUSP, Temas e Revisão',
    description:
      'Como se preparar para a prova da USP-SP (FMUSP): 120 questões, 2ª fase prática, imagens clínicas, temas mais incidentes e estratégia adaptativa FSRS-6.',
    lastModified: LAST_CONTENT_UPDATE,
    examFormat:
      'Processo em duas fases de altíssima exigência técnica: 1ª fase objetiva com 120 questões de 4 alternativas (geralmente 24 por grande área) seguida por 2ª fase prática (estações clínicas estruturadas/OSCE ou prova multimídia conforme edital) e análise/arguição curricular. É referência nacional em cobrança de exames de imagem, raciocínio de conduta imediata e protocolos do HC-FMUSP.',
    questionCount: '120 questões objetivas (4 alternativas — A a D) + 2ª fase prática',
    cutoffRange:
      '75% a 87%+ na 1ª fase para convocação à 2ª fase (varia conforme especialidade; áreas muito concorridas frequentemente superam 83%)',
    profileSummary: [
      'A prova da USP-SP (FMUSP/FUVEST) é considerada por muitos candidatos a prova mais clínica e aplicada do país. Em vez de perguntar definições de livro-texto, a banca coloca você dentro do pronto-socorro, da enfermaria ou do ambulatório do Hospital das Clínicas e pergunta qual é o próximo passo diagnóstico ou terapêutico.',
      'Um traço inconfundível da FMUSP é o uso generoso de imagens de alta qualidade — radiografias de tórax e abdome, tomografias, eletrocardiogramas, lesões dermatológicas, lâminas, partogramas e cardiotocografias — além de casos sequenciais sobre o mesmo paciente. Quem treina leitura visual e conduta objetiva sai muito na frente.',
    ],
    areaDistribution: [
      {
        area: 'Clínica Médica',
        percentage: 20,
        focusNote:
          'Emergências cardiológicas e neurológicas, terapia intensiva, ECG, nefrologia/distúrbios hidroeletrolíticos e infectologia hospitalar.',
      },
      {
        area: 'Cirurgia Geral',
        percentage: 20,
        focusNote:
          'Trauma complexo (ATLS), cirurgia do aparelho digestivo, hérnias, oncologia cirúrgica, imagens tomográficas e conduta intra/pós-operatória.',
      },
      {
        area: 'Pediatria',
        percentage: 20,
        focusNote:
          'Emergências pediátricas (PALS), neonatologia, doenças infecciosas graves, exantemáticas, asma/bronquiolite e desenvolvimento infantil.',
      },
      {
        area: 'Ginecologia e Obstetrícia',
        percentage: 20,
        focusNote:
          'Vitalidade fetal (CTG/perfil biofísico), partograma, hemorragias da gestação, oncoginecologia, climatério e endocrinologia ginecológica.',
      },
      {
        area: 'Medicina Preventiva',
        percentage: 20,
        focusNote:
          'Epidemiologia analítica rigorosa, leitura crítica de estudos, saúde do trabalhador, vigilância, SUS e bioética clínica.',
      },
    ],
    topTopics: [
      {
        topic: 'Interpretação de ECG, Síndromes Coronarianas e Arritmias',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'A FMUSP cobra traçados reais de ECG associados à conduta imediata (trombólise, angioplastia, cardioversão sincronizada ou marca-passo), sem margem para hesitação.',
      },
      {
        topic: 'Trauma e Emergências Cirúrgicas com Imagens (TC e RX)',
        area: 'Cirurgia Geral',
        incidence: 'Muito Alta',
        rationale:
          'Casos de trauma abdominal fechado, lesões esplênicas/hepáticas e abdome agudo frequentemente trazem cortes de tomografia ou radiografia exigindo decisão entre laparotomia, embolização ou conduta conservadora.',
      },
      {
        topic: 'Assistência ao Parto, Partograma e Vitalidade Fetal (CTG)',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Muito Alta',
        rationale:
          'Identificação de distocias no partograma, categorias de cardiotocografia e escolha da via de parto imediata são marcas clássicas das provas do HC-FMUSP.',
      },
      {
        topic: 'Choque, Sepse, Ventilação Mecânica e Distúrbios Ácido-Base',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Questões de UTI e pronto-socorro envolvendo interpretação de gasometria arterial, ajuste ventilatório em SDRA/DPOC e escolha de vasopressor ou antimicrobiano empírico.',
      },
      {
        topic: 'Emergências Pediátricas, Choque Séptico e Insuficiência Respiratória',
        area: 'Pediatria',
        incidence: 'Muito Alta',
        rationale:
          'Cobra reconhecimento precoce de gravidade na criança, manejo de cetoacidose diabética pediátrica, bronquiolite, crise asmática grave e meningite.',
      },
      {
        topic: 'Bioestatística Aplicada e Desenhos de Estudos Epidemiológicos',
        area: 'Medicina Preventiva',
        incidence: 'Alta',
        rationale:
          'Exige leitura real de gráficos, curvas de Kaplan-Meier, razões de prevalência/chances/risco, confundimento e validade interna de ensaios clínicos.',
      },
      {
        topic: 'Oncologia Ginecológica e Rastreamento (Colo, Mama e Endométrio)',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Alta',
        rationale:
          'Conduta frente a BI-RADS, alterações colpocitológicas (ASC-US, HSIL), estadiamento e indicação cirúrgica/adjuvante.',
      },
      {
        topic: 'Cirurgia do Aparelho Digestivo e Complicações Pós-Operatórias',
        area: 'Cirurgia Geral',
        incidence: 'Alta',
        rationale:
          'Fístulas, deiscências, isquemia mesentérica, neoplasia colorretal e manejo de hérnias encarceradas/estranguladas.',
      },
      {
        topic: 'Neonatologia: Reanimação, Sepse e Desconforto Respiratório',
        area: 'Pediatria',
        incidence: 'Alta',
        rationale:
          'Diferenciação radiológica e clínica entre síndrome do desconforto respiratório, taquipneia transitória e síndrome de aspiração meconial.',
      },
    ],
    studyStrategy: [
      {
        step: 1,
        title: 'Crie um banco mental de imagens clínicas da FMUSP',
        description:
          'Ao resolver provas antigas da USP-SP, nunca pule a análise da imagem antes de ler as alternativas. Treine descrever o achado em 15 segundos (ECG, TC de crânio/abdome, RX de tórax, CTG).',
        fsrsAction:
          'Registre cada padrão visual errado no Caderno de Erros com a pista diagnóstica que diferenciava a conduta correta.',
      },
      {
        step: 2,
        title: 'Estude por raciocínio de "próximo passo imediato"',
        description:
          'A USP-SP costuma colocar duas condutas corretas em momentos diferentes do atendimento. O segredo está em saber o que vem primeiro diante da estabilidade hemodinâmica do paciente.',
        fsrsAction:
          'Use o algoritmo FSRS-6 para encurtar revisões em temas de emergência (ATLS, ACLS, PALS e hemorragias obstétricas) sempre que a acurácia ficar abaixo de 80%.',
      },
      {
        step: 3,
        title: 'Domine as provas dos últimos 7 anos da FMUSP na íntegra',
        description:
          'A prova tem 120 questões (20% mais longa que a média nacional). Treinar resistência e precisão em blocos longos evita queda de desempenho nas últimas 30 questões.',
        fsrsAction:
          'Cadastre as provas antigas da USP-SP em Simulados & Bancas e acompanhe a evolução por grande área até estabilizar acima da sua meta de corte.',
      },
      {
        step: 4,
        title: 'Integre preparação da 2ª fase prática ao estudo de condutas',
        description:
          'Mesmo antes do resultado da 1ª fase, verbalizar checklists de anamnese, exame físico direcionado e prescrição completa consolida o conhecimento cobrado também na prova objetiva.',
        fsrsAction:
          'Revise seus temas de maior prevalência com foco ativo (perguntas e condutas completas) nas janelas de revisão programadas pelo cronograma.',
      },
    ],
    faqs: [
      {
        question: 'Quantas questões tem a 1ª fase da USP-SP e qual o peso das etapas?',
        answer:
          'A 1ª fase da USP-SP para acesso direto tradicionalmente conta com 120 questões objetivas de 4 alternativas (24 por grande área). Os candidatos classificados avançam para a 2ª fase, composta por prova prática/multimídia (peso relevante na nota final, tradicionalmente 40% junto aos 50% da objetiva) e análise curricular (10%), sempre conforme o edital vigente.',
      },
      {
        question: 'Por que a prova da USP-SP é considerada diferente das demais bancas?',
        answer:
          'Porque combina alto volume de imagens clínicas reais, casos sequenciais ligados ao mesmo paciente e forte cobrança de condutas práticas de pronto-socorro e enfermaria. Em vez de cobrar rodapés de livro, ela testa se você toma a decisão certa diante de um paciente grave.',
      },
      {
        question: 'Quais provas antigas são mais parecidas com a USP-SP para treinar?',
        answer:
          'Além das próprias provas da FMUSP dos últimos 7 a 10 anos, provas da UNIFESP, UNICAMP, USP-RP e IAMSPE oferecem excelente treino complementar em raciocínio clínico e interpretação de exames complementares.',
      },
      {
        question: 'Com quanto tempo de antecedência devo focar na 2ª fase da USP-SP?',
        answer:
          'O ideal é priorizar a aprovação segura na 1ª fase ao longo do ano, mas já estudando condutas completas (dose, via, exame inicial e comunicação). Nos últimos 2 meses antes da objetiva e imediatamente após a prova da 1ª fase, intensifique estações práticas cronometradas.',
      },
    ],
    relatedBancas: ['unifesp', 'unicamp', 'sus-sp', 'enare'],
    relatedGuias: [
      'simulados-provas-na-integra-nota-de-corte',
      'caderno-de-erros-inteligente-residencia-medica',
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
    ],
  },
  {
    slug: 'sus-sp',
    name: 'SUS-SP — Secretaria de Estado da Saúde de São Paulo',
    shortName: 'SUS-SP',
    article: 'o',
    region: 'Sudeste',
    stateOrScope: 'Estado de São Paulo (Rede Estadual e Hospitais Parceiros)',
    organizer: 'VUNESP (banca organizadora recente)',
    title: 'SUS-SP Residência Médica: Temas Mais Cobrados, Corte e Estratégia',
    description:
      'Tudo sobre o SUS-SP na Residência Médica: prova de etapa única, perfil VUNESP, temas de maior incidência e como usar FSRS-6 para maximizar seus acertos.',
    lastModified: LAST_CONTENT_UPDATE,
    examFormat:
      'Historicamente um dos maiores processos seletivos de etapa única do país para acesso direto: 100 questões objetivas de 5 alternativas (20 por grande área), sem prova prática e sem análise curricular na maioria dos editais de acesso direto, seguida por escolha de instituição ("leilão" de vagas) conforme a classificação obtida.',
    questionCount: '100 questões objetivas (5 alternativas — A a E)',
    cutoffRange:
      '72% a 88%+ conforme a especialidade e o hospital desejado no sistema de escolha de vagas',
    profileSummary: [
      'O SUS-SP atrai milhares de candidatos de todo o Brasil por reunir centenas de vagas em hospitais tradicionais da capital, região metropolitana e interior paulista, com a grande vantagem de decidir a aprovação na prova objetiva — sem o peso do currículo ou os custos logísticos de uma segunda fase prática.',
      'Essa característica torna o SUS-SP uma prova extremamente sensível à consistência de base e à retenção de detalhes objetivos. Com enunciados geralmente mais curtos e diretos sob a organização da VUNESP, o candidato precisa ter resposta rápida em dezenas de temas clássicos de Clínica, Cirurgia, Pediatria, GO e Preventiva sem desperdiçar pontos em pegadinhas de definição.',
    ],
    areaDistribution: [
      {
        area: 'Clínica Médica',
        percentage: 20,
        focusNote:
          'Clássicos de cardiologia, pneumologia, endocrinologia, infectologia, hematologia e emergências com foco em diagnóstico e tratamento de 1ª linha.',
      },
      {
        area: 'Cirurgia Geral',
        percentage: 20,
        focusNote:
          'Trauma, hérnias da parede abdominal, vias biliares, pancreatite, hemorragia digestiva e cicatrização/pré-operatório.',
      },
      {
        area: 'Pediatria',
        percentage: 20,
        focusNote:
          'Imunizações, doenças exantemáticas, diarreia aguda/desidratação, pneumonias na infância, aleitamento e neonatologia básica.',
      },
      {
        area: 'Ginecologia e Obstetrícia',
        percentage: 20,
        focusNote:
          'Sangramento uterino anormal, anticoncepção (critérios da OMS), vulvovaginites, pré-natal, diabetes gestacional e distúrbios hipertensivos.',
      },
      {
        area: 'Medicina Preventiva',
        percentage: 20,
        focusNote:
          'Conceitos clássicos de epidemiologia, níveis de prevenção, SUS, saúde ocupacional e ética médica com cobrança objetiva.',
      },
    ],
    topTopics: [
      {
        topic: 'Doenças Exantemáticas, Pneumonias e Diarreia Aguda na Infância',
        area: 'Pediatria',
        incidence: 'Muito Alta',
        rationale:
          'O SUS-SP cobra sistematicamente diferenciação clínica de sarampo, rubéola, escarlatina, eritema infeccioso e planos A/B/C de hidratação.',
      },
      {
        topic: 'Anticoncepção (Critérios de Elegibilidade da OMS) e SUA',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Muito Alta',
        rationale:
          'Contraindicações categoria 4 aos métodos hormonais combinados e investigação estrutural/não estrutural (PALM-COEIN) são questões recorrentes.',
      },
      {
        topic: 'Trauma (ATLS) e Queimaduras',
        area: 'Cirurgia Geral',
        incidence: 'Muito Alta',
        rationale:
          'Reposição volêmica em grandes queimados (fórmula de Parkland/ATLS), manejo de vias aéreas e choque hemorrágico aparecem com alta frequência.',
      },
      {
        topic: 'Diabetes Gestacional e Síndromes Hipertensivas na Gestação',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Muito Alta',
        rationale:
          'Valores de corte de glicemia de jejum e TOTG, diferenciação entre hipertensão gestacional e pré-eclâmpsia e indicações de resolução da gestação.',
      },
      {
        topic: 'Infectologia Geral: Dengue, Meningites, HIV e Hepatites Virais',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Classificação de risco da dengue (grupos A, B, C e D), interpretação sorológica da hepatite B e antibioticoterapia empírica em meningite.',
      },
      {
        topic: 'Hérnias Abdominais e Litíase Biliar / Pancreatite Aguda',
        area: 'Cirurgia Geral',
        incidence: 'Alta',
        rationale:
          'Classificação de Nyhus, anatomia do canal inguinal, critérios de gravidade da pancreatite e conduta em coledocolitíase.',
      },
      {
        topic: 'Insuficiência Cardíaca, FA e Emergências Hipertensivas',
        area: 'Clínica Médica',
        incidence: 'Alta',
        rationale:
          'Drogas que reduzem mortalidade na ICFEr, escores CHA2DS2-VASc/HAS-BLED e diferenciação entre urgência e emergência hipertensiva.',
      },
      {
        topic: 'Indicadores de Saúde, Vigilância e História Natural da Doença',
        area: 'Medicina Preventiva',
        incidence: 'Alta',
        rationale:
          'Cálculo e interpretação de coeficientes de mortalidade infantil/materna, prevenção quaternária e princípios doutrinários e organizativos do SUS.',
      },
    ],
    studyStrategy: [
      {
        step: 1,
        title: 'Aposte em amplitude de edital + retenção de longo prazo',
        description:
          'Como o SUS-SP não tem 2ª fase nem currículo para compensar um dia ruim, seu objetivo é maximizar o número de acertos seguros nos 70% de temas clássicos que se repetem todo ano.',
        fsrsAction:
          'Use o cronograma FSRS-6 para manter os temas de alta prevalência sempre acima de 85% de retentividade até a véspera da prova.',
      },
      {
        step: 2,
        title: 'Elimine erros por decoreba esquecida (critérios, tabelas e escores)',
        description:
          'Tabelas de vacinação, sorologia da hepatite B, critérios de elegibilidade da OMS e grupos da dengue derrubam candidatos preparados quando não são revisados no intervalo certo.',
        fsrsAction:
          'Transforme cada tabela crítica errada em um card objetivo no Caderno de Erros e revise em sessões curtas de 15 minutos.',
      },
      {
        step: 3,
        title: 'Treine ritmo acelerado em provas da VUNESP e SUS-SP antigas',
        description:
          'Enunciados curtos podem gerar excesso de confiança e leitura precipitada de palavras como "exceto" ou "incorreta". Treine leitura ativa marcando restrições.',
        fsrsAction:
          'Registre os motivos dos erros (falta de base vs. leitura apressada) após cada simulado na aba Simulados & Bancas.',
      },
      {
        step: 4,
        title: 'Equilibre as 5 grandes áreas sem deixar nenhuma abaixo de 75%',
        description:
          'No sistema de escolha de vagas do SUS-SP, cada ponto perdido em Pediatria ou Preventiva custa dezenas de posições na lista de instituições.',
        fsrsAction:
          'Acompanhe o gráfico de desempenho por área na Evolução e redirecione seu auto-estudo semanal para a área com menor média móvel.',
      },
    ],
    faqs: [
      {
        question: 'O SUS-SP tem prova prática ou análise curricular para acesso direto?',
        answer:
          'Tradicionalmente, o SUS-SP para especialidades de acesso direto é composto por etapa única de prova objetiva com 100 questões, sem 2ª fase prática e sem análise curricular, embora o candidato deva sempre conferir o edital oficial do ano vigente para eventuais atualizações.',
      },
      {
        question: 'Como funciona a escolha do hospital no SUS-SP?',
        answer:
          'Após a publicação da classificação final por especialidade, os candidatos aprovados participam das rodadas de escolha de instituição conforme a ordem de nota. Quanto maior sua pontuação na objetiva, maior a liberdade de escolher hospitais mais disputados da capital ou do interior.',
      },
      {
        question: 'Qual é o estilo das questões do SUS-SP organizado pela VUNESP?',
        answer:
          'A VUNESP costuma apresentar enunciados mais objetivos e concisos do que bancas como FGV ou UNICAMP, cobrando ampla cobertura do programa médico, critérios diagnósticos clássicos, tabelas do Ministério da Saúde e condutas bem estabelecidas.',
      },
      {
        question: 'Quem estuda para USP-SP e ENARE consegue aproveitar a base para o SUS-SP?',
        answer:
          'Sim, a sobreposição de conteúdo é muito grande. O ajuste principal para o SUS-SP consiste em resolver provas antigas da própria banca nos últimos 3 meses para calibrar a velocidade de leitura e reforçar detalhes objetivos de alta recorrência.',
      },
    ],
    relatedBancas: ['enare', 'usp-sp', 'unifesp', 'unicamp'],
    relatedGuias: [
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
      'combinar-cursinho-com-repeticao-espacada',
      'simulados-provas-na-integra-nota-de-corte',
    ],
  },
  {
    slug: 'unicamp',
    name: 'UNICAMP — Faculdade de Ciências Médicas (FCM-UNICAMP)',
    shortName: 'UNICAMP',
    article: 'a',
    region: 'Sudeste',
    stateOrScope: 'Campinas — São Paulo (HC-UNICAMP)',
    organizer: 'COMVEST / COREME FCM-UNICAMP',
    title: 'UNICAMP Residência Médica: Estilo da Prova, Temas e Como Estudar',
    description:
      'Análise profunda da prova de Residência Médica da UNICAMP (FCM/COMVEST): raciocínio clínico integrado, fases, temas mais cobrados e plano FSRS-6.',
    lastModified: LAST_CONTENT_UPDATE,
    examFormat:
      'Tradicionalmente dividida em 1ª fase objetiva (80 questões de 4 alternativas — 16 por grande área — nos editais recentes de acesso direto) e 2ª fase teórico-prática / avaliação prática estruturada, além da análise curricular. É uma banca autoral da FCM-UNICAMP famosa por cobrar fisiopatologia aplicada, raciocínio diagnóstico profundo e manejo ambulatorial e hospitalar detalhado.',
    questionCount: '80 questões objetivas (4 alternativas — A a D) + 2ª fase prática',
    cutoffRange:
      '70% a 84%+ na 1ª fase (tende a notas percentuais ligeiramente menores que provas mais literais devido à densidade técnica dos casos)',
    profileSummary: [
      'A prova da UNICAMP possui identidade acadêmica muito forte: as questões são elaboradas pelos docentes da FCM-UNICAMP e refletem a prática real do Hospital de Clínicas de Campinas e da rede pública do município. Raramente há "pegadinhas vazias"; em contrapartida, a banca testa se você realmente compreende o mecanismo da doença e o porquê de cada conduta.',
      'Outro ponto crítico na UNICAMP é a 1ª fase enxuta (80 questões), na qual cada acerto equivale a 1,25% da nota objetiva. Em paralelo, a 2ª fase tem histórico de exigir excelente desenvoltura prática, escrita objetiva e justificativa clínica consistente.',
    ],
    areaDistribution: [
      {
        area: 'Clínica Médica',
        percentage: 20,
        focusNote:
          'Raciocínio sindrômico em medicina interna, reumatologia, hematologia, nefrologia, infectologia e emergências clínicas.',
      },
      {
        area: 'Cirurgia Geral',
        percentage: 20,
        focusNote:
          'Fisiopatologia cirúrgica, trauma, aparelho digestivo, cirurgia vascular/torácica básica e complicações pós-operatórias.',
      },
      {
        area: 'Pediatria',
        percentage: 20,
        focusNote:
          'Puericultura detalhada, pneumopediatria, neonatologia, imunizações, genética/erros inatos básicos e urgências pediátricas.',
      },
      {
        area: 'Ginecologia e Obstetrícia',
        percentage: 20,
        focusNote:
          'Forte tradição do CAISM/UNICAMP em mastologia, oncoginecologia, obstetrícia de alto risco, pré-natal e climatério.',
      },
      {
        area: 'Medicina Preventiva',
        percentage: 20,
        focusNote:
          'Atenção Primária, saúde coletiva, método clínico centrado na pessoa, epidemiologia crítica e redes de atenção do SUS.',
      },
    ],
    topTopics: [
      {
        topic: 'Mastologia, Oncoginecologia e Obstetrícia de Alto Risco (Perfil CAISM)',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Muito Alta',
        rationale:
          'O CAISM é referência nacional em saúde da mulher; por isso, rastreamento de câncer de mama/colo, diabetes gestacional, restrição de crescimento fetal e pré-eclâmpsia têm peso diferenciado na UNICAMP.',
      },
      {
        topic: 'Atenção Primária à Saúde, Método Clínico e Epidemiologia Crítica',
        area: 'Medicina Preventiva',
        incidence: 'Muito Alta',
        rationale:
          'A FCM-UNICAMP tem departamento de Saúde Coletiva muito atuante: cobra prevenção quaternária, territorialização, matriciamento, vigilância e análise crítica de indicadores.',
      },
      {
        topic: 'Anemias, Coagulopatias e Síndromes Hematológicas',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Interpretação integrada de hemograma, reticulócitos, cinética do ferro, esfregaço periférico e indicação racional de hemocomponentes.',
      },
      {
        topic: 'Abdome Agudo, Neoplasias Digestivas e Trauma',
        area: 'Cirurgia Geral',
        incidence: 'Muito Alta',
        rationale:
          'Casos completos com evolução temporal, exames laboratoriais e de imagem exigindo diagnóstico diferencial preciso antes da conduta cirúrgica.',
      },
      {
        topic: 'Distúrbios Hidroeletrolíticos, Injúria Renal Aguda e DRC',
        area: 'Clínica Médica',
        incidence: 'Alta',
        rationale:
          'Fisiopatologia renal aplicada: manejo seguro de hiponatremia/hipercalemia, diferenciação pré-renal vs. NTA e indicações de diálise de urgência.',
      },
      {
        topic: 'Crescimento, Desenvolvimento, Aleitamento e Doenças Respiratórias',
        area: 'Pediatria',
        incidence: 'Alta',
        rationale:
          'Análise de curvas da OMS, marcos do neurodesenvolvimento, diagnóstico diferencial de sibilância recorrente e pneumonias complicadas.',
      },
      {
        topic: 'Doenças Autoimunes e Vasculites Sistêmicas',
        area: 'Clínica Médica',
        incidence: 'Alta',
        rationale:
          'Casos clínicos ricos em semiologia envolvendo LES, artrite reumatoide, espondiloartrites e vasculites ANCA-associadas.',
      },
      {
        topic: 'Pré-operatório, Resposta Endócrino-Metabólica ao Trauma e Infecção Cirúrgica',
        area: 'Cirurgia Geral',
        incidence: 'Alta',
        rationale:
          'Avaliação de risco cirúrgico, profilaxia antibiótica/tromboembólica, manejo de feridas e febre no pós-operatório.',
      },
    ],
    studyStrategy: [
      {
        step: 1,
        title: 'Troque memorização superficial por compreensão de mecanismo',
        description:
          'Na UNICAMP, decorar apenas o nome da droga sem entender por que ela age no caso clínico leva ao erro quando a banca altera uma comorbidade no enunciado.',
        fsrsAction:
          'Ao registrar um erro no Caderno de Erros, anote em 1 linha o mecanismo clínico que justificava a alternativa correta.',
      },
      {
        step: 2,
        title: 'Estude Saúde Coletiva e GO com profundidade institucional',
        description:
          'Preventiva e GO costumam ser grandes diferenciais de classificação na UNICAMP por refletirem a força acadêmica da Saúde Coletiva e do CAISM.',
        fsrsAction:
          'Mantenha esses dois pilares com alta estabilidade no FSRS-6 e revise temas de rastreamento, APS e mastologia antes de cada simulado.',
      },
      {
        step: 3,
        title: 'Resolva as provas discursivas/práticas antigas junto com as objetivas',
        description:
          'Mesmo na preparação para a 1ª fase, consultar os padrões de resposta da 2ª fase da UNICAMP revela exatamente como os professores raciocinam e o que consideram essencial.',
        fsrsAction:
          'Use o modo de estudo focado para revisar os temas recorrentes da 2ª fase em blocos de 25 a 50 minutos sem distrações.',
      },
      {
        step: 4,
        title: 'Proteja cada questão na prova de 80 itens',
        description:
          'Com 80 questões, errar 4 itens por desatenção derruba 5 pontos percentuais inteiros na nota objetiva.',
        fsrsAction:
          'Acompanhe a evolução de acurácia por simulado da UNICAMP para identificar padrões de erro evitável antes do dia da prova.',
      },
    ],
    faqs: [
      {
        question: 'Quantas questões tem a prova objetiva da UNICAMP para Residência Médica?',
        answer:
          'Nos editais recentes de acesso direto, a 1ª fase da UNICAMP conta com 80 questões objetivas de múltipla escolha (4 alternativas), distribuídas de forma equilibrada entre as 5 grandes áreas (16 questões cada), seguida por 2ª fase prática e análise curricular.',
      },
      {
        question: 'A nota de corte da UNICAMP costuma ser menor que a do SUS-SP ou ENARE?',
        answer:
          'Em termos percentuais brutos, frequentemente sim — não por ser menos concorrida, mas porque os casos clínicos autorais da FCM-UNICAMP exigem raciocínio mais profundo e apresentam menos questões triviais. Ainda assim, especialidades de alta procura exigem desempenho muito elevado.',
      },
      {
        question: 'Quais áreas mais diferenciam os aprovados na UNICAMP?',
        answer:
          'Embora todas as 5 áreas tenham o mesmo número de questões, Ginecologia e Obstetrícia (com forte influência do CAISM) e Medicina Preventiva/Saúde Coletiva costumam separar quem apenas passa próximo do corte de quem entra com folga para a 2ª fase.',
      },
      {
        question: 'Como conciliar o internato com a preparação para a UNICAMP?',
        answer:
          'Use os próprios casos vistos no ambulatório e pronto-socorro como gatilho de estudo ativo e delegue o agendamento das revisões ao FSRS-6 com cotas diárias realistas, evitando o acúmulo de atrasos nas semanas de plantão.',
      },
    ],
    relatedBancas: ['usp-sp', 'unifesp', 'sus-sp', 'enare'],
    relatedGuias: [
      'cronograma-revisoes-internato-sem-atrasos',
      'caderno-de-erros-inteligente-residencia-medica',
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
    ],
  },
  {
    slug: 'unifesp',
    name: 'UNIFESP — Escola Paulista de Medicina (EPM-UNIFESP)',
    shortName: 'UNIFESP',
    article: 'a',
    region: 'Sudeste',
    stateOrScope: 'São Paulo (Capital — Hospital São Paulo / EPM)',
    organizer: 'COREME EPM-UNIFESP / Banca Institucional',
    title: 'UNIFESP Residência Médica: Formato da Prova EPM, Temas e Plano',
    description:
      'Guia de preparação para a Residência Médica da UNIFESP (EPM): 100 questões, 2ª fase prática, temas de alta incidência e estratégia de revisão FSRS-6.',
    lastModified: LAST_CONTENT_UPDATE,
    examFormat:
      'Processo seletivo tradicionalmente em 2 fases para acesso direto: 1ª fase objetiva com 100 questões (20 por grande área), seguida por 2ª fase prática (estações clínicas / OSCE no padrão EPM) e avaliação curricular. Reconhecida pelo rigor técnico, cobrança atualizada de diretrizes brasileiras e internacionais, além de forte foco em medicina hospitalar e exames complementares.',
    questionCount: '100 questões objetivas + 2ª fase prática (OSCE)',
    cutoffRange:
      '74% a 86%+ na 1ª fase para classificação à etapa prática (varia significativamente entre acesso direto clínico, cirúrgico e especialidades concorridas)',
    profileSummary: [
      'A prova da Escola Paulista de Medicina (UNIFESP) figura entre as mais respeitadas e disputadas do país. Com 100 questões objetivas equilibradas entre as cinco grandes áreas, a banca combina enunciados claros com alto nível de especificidade técnica — cobrando critérios diagnósticos atualizados, estadiamento, interpretação de exames e conduta baseada em evidências.',
      'Diferentemente de bancas puramente voltadas a protocolos ministeriais básicos, a UNIFESP frequentemente explora cenários de hospital terciário (Hospital São Paulo), exigindo domínio sólido de Clínica Médica, Cirurgia e especialidades clínicas dentro das grandes áreas, além de preparação consistente para a etapa prática.',
    ],
    areaDistribution: [
      {
        area: 'Clínica Médica',
        percentage: 20,
        focusNote:
          'Cardiologia, neurologia (AVC/epilepsia), endocrinologia, infectologia hospitalar, hepatologia e doenças autoimunes.',
      },
      {
        area: 'Cirurgia Geral',
        percentage: 20,
        focusNote:
          'Trauma, cirurgia gastrointestinal, vias biliares, urologia/vascular básicas no PS, cicatrização e nutrição em cirurgia.',
      },
      {
        area: 'Pediatria',
        percentage: 20,
        focusNote:
          'Neonatologia rigorosa (forte tradição da EPM), alergia/imunologia pediátrica, infectopediatria, PNI e emergências.',
      },
      {
        area: 'Ginecologia e Obstetrícia',
        percentage: 20,
        focusNote:
          'Ginecologia endócrina, endometriose, uroginecologia, obstetrícia de alto risco, infecções na gestação e parto.',
      },
      {
        area: 'Medicina Preventiva',
        percentage: 20,
        focusNote:
          'Epidemiologia analítica, testes diagnósticos, SUS, ética médica, declaração de óbito e medicina baseada em evidências.',
      },
    ],
    topTopics: [
      {
        topic: 'Neonatologia: Reanimação, Infecções Congênitas e Icterícia',
        area: 'Pediatria',
        incidence: 'Muito Alta',
        rationale:
          'A disciplina de Pediatria Neonatal da EPM-UNIFESP é referência histórica no Brasil (inclusive na elaboração de diretrizes da SBP), refletindo-se em cobrança recorrente e precisa de neonatologia.',
      },
      {
        topic: 'Cardiologia Clínica e Emergências Cardiovasculares',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Síndromes coronarianas agudas, valvopatias, insuficiência cardíaca, endocardite infecciosa e arritmias com foco em diretrizes atuais.',
      },
      {
        topic: 'Endocrinologia Ginecológica, Amenorreias e Endometriose',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Muito Alta',
        rationale:
          'A EPM costuma cobrar investigação passo a passo de amenorreia primária/secundária, SOP, climatério e tratamento clínico/cirúrgico da endometriose.',
      },
      {
        topic: 'AVC Isquêmico/Hemorrágico e Emergências Neurológicas',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Janelas de trombólise e trombectomia mecânica, metas pressóricas no AVC, manejo do estado de mal epiléptico e cefaleias secundárias.',
      },
      {
        topic: 'Trauma (ATLS) e Cirurgia Hepatobiliopancreática',
        area: 'Cirurgia Geral',
        incidence: 'Muito Alta',
        rationale:
          'Conduta em trauma toracoabdominal, complicações de colelitíase, colangite aguda e tumores periampulares/pancreatite.',
      },
      {
        topic: 'Infecções na Gestação (TORCH, Sífilis, HIV) e Hemorragias Obstétricas',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Alta',
        rationale:
          'Rastreamento, interpretação sorológica (avidez de IgG para toxoplasmose, VDRL) e profilaxia da transmissão vertical.',
      },
      {
        topic: 'Testes Diagnósticos, Estudos Clínicos e Declaração de Óbito',
        area: 'Medicina Preventiva',
        incidence: 'Alta',
        rationale:
          'Questões técnicas sobre razão de verossimilhança, curva ROC, preenchimento correto da cadeia causal da DO e políticas de saúde.',
      },
      {
        topic: 'Cirrose Hepática, Hipertensão Portal e Hemorragia Digestiva',
        area: 'Clínica Médica',
        incidence: 'Alta',
        rationale:
          'Manejo da hemorragia varicosa aguda, profilaxia primária/secundária, PBE, síndrome hepatorrenal e encefalopatia hepática.',
      },
      {
        topic: 'Pneumonia, Asma e Bronquiolite na Infância',
        area: 'Pediatria',
        incidence: 'Alta',
        rationale:
          'Critérios de internação, escolha antibiótica por faixa etária, manejo de derrame pleural parapneumônico e classificação da asma.',
      },
    ],
    studyStrategy: [
      {
        step: 1,
        title: 'Use diretrizes atualizadas da SBP, SBC e FEBRASGO como norte',
        description:
          'A UNIFESP tem baixo apego a condutas obsoletas. Atualizações recentes em reanimação neonatal, diabetes, insuficiência cardíaca e rastreamento oncológico costumam aparecer rapidamente na prova.',
        fsrsAction:
          'Marque tópicos que sofreram mudança recente de diretriz para revisão prioritária e registre cada nuance no Caderno de Erros.',
      },
      {
        step: 2,
        title: 'Combine provas antigas da UNIFESP com USP-SP e UNICAMP',
        description:
          'O trio paulista compartilha alto rigor técnico. Resolver os últimos 6 anos da UNIFESP revela temas favoritos da escola (como neonatologia e ginecologia endócrina).',
        fsrsAction:
          'Cadastre as provas da UNIFESP em Simulados & Bancas para comparar sua evolução frente à meta de corte da 1ª fase.',
      },
      {
        step: 3,
        title: 'Evite lacunas em subtemas de alto detalhe técnico',
        description:
          'Amenorreias, toxoplasmose na gestação, PBE/cirrose e janela de AVC exigem algoritmos mentais bem consolidados — uma etapa trocada custa a questão.',
        fsrsAction:
          'Deixe o algoritmo FSRS-6 encurtar automaticamente os intervalos de temas em que sua taxa de acerto oscila abaixo de 75%.',
      },
      {
        step: 4,
        title: 'Prepare a 2ª fase com checklists clínicos estruturados',
        description:
          'As estações práticas da UNIFESP avaliam comunicação médica, solicitação racional de exames e conduta objetiva em tempo cronometrado.',
        fsrsAction:
          'Na reta final, intercale blocos de revisão espaçada com simulações curtas de conduta em voz alta para fixar sequências críticas.',
      },
    ],
    faqs: [
      {
        question: 'Como é dividida a seleção de Residência Médica da UNIFESP?',
        answer:
          'Para especialidades de acesso direto, o processo seletivo da UNIFESP tradicionalmente reúne 1ª fase objetiva com 100 questões (peso principal), 2ª fase prática (estações clínicas) para os candidatos habilitados e análise curricular, sempre respeitando as regras do edital anual.',
      },
      {
        question: 'Neonatologia realmente tem peso maior na Pediatria da UNIFESP?',
        answer:
          'Sim. Por ser um dos principais centros formadores de diretrizes neonatais no Brasil (EPM/SBP), temas como reanimação neonatal, icterícia, sepse precoce/tardia e infecções congênitas apresentam incidência consistentemente elevada na prova.',
      },
      {
        question: 'A UNIFESP cobra mais medicina hospitalar ou Atenção Primária?',
        answer:
          'A prova tem equilíbrio entre as 5 grandes áreas, mas dentro de Clínica, Cirurgia, Pediatria e GO há forte presença de cenários hospitalares de média e alta complexidade, complementados por Preventiva e APS bem estruturadas.',
      },
      {
        question: 'Quantas questões devo fazer por semana mirando a UNIFESP?',
        answer:
          'Mais importante do que um número fixo alto é manter qualidade de revisão: entre 150 e 300 questões semanais bem corrigidas, com registro sistemático de erros e revisões agendadas pelo FSRS-6, geram retenção muito superior a responder milhares de questões sem revisar o que errou.',
      },
    ],
    relatedBancas: ['usp-sp', 'unicamp', 'sus-sp', 'enare'],
    relatedGuias: [
      'combinar-cursinho-com-repeticao-espacada',
      'simulados-provas-na-integra-nota-de-corte',
      'caderno-de-erros-inteligente-residencia-medica',
    ],
  },
  {
    slug: 'ses-pe',
    name: 'SES-PE — Secretaria Estadual de Saúde de Pernambuco',
    shortName: 'SES-PE',
    article: 'a',
    region: 'Nordeste',
    stateOrScope: 'Pernambuco (Recife e Rede Estadual SUS-PE)',
    organizer: 'IAUPE / UPENET',
    title: 'SES-PE Residência Médica: Temas Mais Cobrados e Guia de Estudos',
    description:
      'Guia completo da SES-PE (IAUPE) para Residência Médica: formato da prova, doenças endêmicas do Nordeste, temas de alta incidência e cronograma FSRS-6.',
    lastModified: LAST_CONTENT_UPDATE,
    examFormat:
      'Tradicionalmente composta por prova objetiva de 100 questões de múltipla escolha (5 alternativas, 20 questões por grande área) organizada pelo IAUPE/UPENET, compondo 90% da nota (com 10% de análise curricular na maioria dos editais estaduais de acesso direto). Destaca-se por casos clínicos diretos com forte aderência à realidade epidemiológica de Pernambuco e do Nordeste.',
    questionCount: '100 questões objetivas (5 alternativas — A a E)',
    cutoffRange:
      '70% a 85%+ na prova objetiva (varia conforme especialidade, hospital de preferência em Recife/interior e pontuação curricular)',
    profileSummary: [
      'A SES-PE é uma das maiores e mais tradicionais seleções de Residência Médica do Nordeste, concentrando vagas de referência em Recife (como Hospital da Restauração, Hospital Getúlio Vargas, Hospital Barão de Lucena, IMIP/hospitais conveniados conforme edital) e no interior pernambucano.',
      'A banca IAUPE tem uma assinatura clara: valoriza enormemente o clínico resolutivo de pronto-socorro e enfermaria, com presença marcante de infectologia tropical/endêmica (arboviroses, esquistossomose, leishmaniose, tuberculose, hanseníase), obstetrícia de alto risco e trauma. Estudar apenas por provas do Sudeste sem adaptar a epidemiologia deixa pontos valiosos na mesa.',
    ],
    areaDistribution: [
      {
        area: 'Clínica Médica',
        percentage: 20,
        focusNote:
          'Infectologia tropical e doenças endêmicas (dengue, chikungunya, leishmaniose, esquistossomose, hanseníase), cardiologia e urgências clínicas.',
      },
      {
        area: 'Cirurgia Geral',
        percentage: 20,
        focusNote:
          'Trauma (forte referência do Hospital da Restauração), abdome agudo, hérnias, hemorragia digestiva e complicações cirúrgicas.',
      },
      {
        area: 'Pediatria',
        percentage: 20,
        focusNote:
          'Doenças infecciosas e parasitárias na infância, desidratação/diarreia, PNI, neonatologia, arboviroses pediátricas e infecções respiratórias.',
      },
      {
        area: 'Ginecologia e Obstetrícia',
        percentage: 20,
        focusNote:
          'Pré-natal, síndromes hipertensivas, hemorragias da 1ª e 2ª metade, infecções congênitas (sífilis, Zika/TORCH), ISTs e câncer de colo uterino.',
      },
      {
        area: 'Medicina Preventiva',
        percentage: 20,
        focusNote:
          'Vigilância epidemiológica de agravos notificáveis, legislação do SUS, indicadores de saúde, imunizações e ética médica.',
      },
    ],
    topTopics: [
      {
        topic: 'Arboviroses (Dengue, Chikungunya e Zika) e Febres Hemorrágicas',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Tema clássico e recorrente na SES-PE: estadiamento clínico da dengue, hidratação venosa/oral por grupo, sinais de alarme e fases da chikungunya.',
      },
      {
        topic: 'Trauma e Emergências Cirúrgicas (ATLS e Abdome Agudo)',
        area: 'Cirurgia Geral',
        incidence: 'Muito Alta',
        rationale:
          'Refletindo o perfil dos grandes serviços de emergência de Recife, a banca cobra manejo inicial do politraumatizado, TCE, trauma penetrante e abdome agudo cirúrgico.',
      },
      {
        topic: 'Doenças Endêmicas e Negligenciadas (Esquistossomose, Leishmaniose e Hanseníase)',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Enquanto outras bancas cobram esses temas esporadicamente, na SES-PE eles aparecem com frequência — incluindo classificação operacional e esquemas PQT da hanseníase e diagnóstico/tratamento do calazar.',
      },
      {
        topic: 'Síndromes Hipertensivas e Hemorragias na Gestação',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Muito Alta',
        rationale:
          'Descolamento prematuro de placenta, placenta prévia, pré-eclâmpsia/eclâmpsia e hemorragia pós-parto lideram a obstetrícia da banca.',
      },
      {
        topic: 'Tuberculose, HIV e Sífilis (Adulto, Gestante e Congênita)',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Condutas do Ministério da Saúde para manejo da coinfecção TB-HIV, tratamento adequado da gestante com sífilis e investigação do recém-nascido exposto.',
      },
      {
        topic: 'Vigilância Epidemiológica, Notificação Compulsória e SUS',
        area: 'Medicina Preventiva',
        incidence: 'Alta',
        rationale:
          'Prazos de notificação (imediata vs. semanal), surtos, epidemias, indicadores de mortalidade e organização da rede de atenção à saúde.',
      },
      {
        topic: 'Diarreia Aguda, Desidratação, Pneumonias e PNI na Infância',
        area: 'Pediatria',
        incidence: 'Alta',
        rationale:
          'Avaliação do estado de hidratação, terapia de reidratação oral/venosa, antibioticoterapia em disenteria/pneumonia e esquema vacinal completo.',
      },
      {
        topic: 'Rastreamento de Câncer de Colo Uterino, Mama e ISTs',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Alta',
        rationale:
          'Diretrizes brasileiras de rastreamento citopatológico, manejo de lesões precursoras e tratamento sindrômico/etiológico das ISTs.',
      },
    ],
    studyStrategy: [
      {
        step: 1,
        title: 'Crie um bloco dedicado à Infectologia Tropical e Endemias do Nordeste',
        description:
          'Candidatos que usam apenas o ranking de prevalência do Sudeste subestimam esquistossomose, leishmaniose visceral/tegumentar, hanseníase e arboviroses — que garantem pontos diretos na SES-PE.',
        fsrsAction:
          'Cadastre esses temas como prioridade máxima na aba Prevalência para o cronograma FSRS-6 mantê-los frescos até novembro/dezembro.',
      },
      {
        step: 2,
        title: 'Resolva as últimas 6 a 8 provas da SES-PE (IAUPE)',
        description:
          'O IAUPE tem estilo próprio de redação e costuma revisitar temas-chave com novas roupagens clínicas ao longo dos anos.',
        fsrsAction:
          'Registre cada prova antiga como simulado da banca SES-PE e mapeie quais subtemas ainda ficam abaixo de 75% de acerto.',
      },
      {
        step: 3,
        title: 'Domine os manuais oficiais do Ministério da Saúde',
        description:
          'Para sífilis, dengue, tuberculose, hanseníase, HIV e vacinação, a referência soberana da banca são os guias e manuais oficiais do MS.',
        fsrsAction:
          'Anote divergências ou pegadinhas de protocolos no Caderno de Erros para revisões espaçadas curtas antes da prova.',
      },
      {
        step: 4,
        title: 'Mantenha ritmo constante durante o internato',
        description:
          'Como a prova objetiva responde por 90% da nota final, consistência semanal de revisões conta muito mais do que maratonas nas últimas 3 semanas.',
        fsrsAction:
          'Configure cotas diárias realistas no AdaptiveMed e use o rebalanceamento automático sempre que um plantão acumular revisões.',
      },
    ],
    faqs: [
      {
        question: 'A SES-PE possui 2ª fase prática para especialidades de acesso direto?',
        answer:
          'Tradicionalmente, o processo seletivo unificado da SES-PE para acesso direto é composto por prova objetiva (90% da nota) e análise curricular (10%), sem 2ª fase prática, devendo o candidato confirmar sempre as disposições do edital do ano vigente.',
      },
      {
        question: 'Quais temas mais diferenciam a SES-PE de outras bancas nacionais?',
        answer:
          'A alta incidência de doenças infecciosas e tropicais endêmicas no Nordeste (dengue, chikungunya, leishmaniose, esquistossomose, hanseníase, leptospirose), somada a urgências traumáticas e obstetrícia de alto risco.',
      },
      {
        question: 'Quem estuda para o ENARE consegue prestar a SES-PE com a mesma base?',
        answer:
          'Sim, há grande sinergia porque ambas valorizam protocolos do Ministério da Saúde e as 5 grandes áreas em peso igual (20% cada). Para a SES-PE, basta complementar com resolução das provas anteriores do IAUPE e reforço em infectologia tropical.',
      },
      {
        question: 'Qual a banca organizadora da SES-PE e como são os enunciados?',
        answer:
          'A organização histórica é do IAUPE/UPENET. Os enunciados tendem a ser claros e focados em casos clínicos práticos ou conceitos diretos de conduta, exigindo boa memória de critérios diagnósticos, classificações e esquemas terapêuticos oficiais.',
      },
    ],
    relatedBancas: ['psu-ba', 'enare', 'psu-mg', 'revalida'],
    relatedGuias: [
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
      'cronograma-revisoes-internato-sem-atrasos',
      'caderno-de-erros-inteligente-residencia-medica',
    ],
  },
  {
    slug: 'psu-ba',
    name: 'PSU-BA / CEREM-BA — Processo Seletivo Unificado da Bahia',
    shortName: 'PSU-BA',
    article: 'o',
    region: 'Nordeste',
    stateOrScope: 'Bahia (Salvador e Interior — CEREM-BA / SUS-BA)',
    organizer: 'Strix Educação / CEREM-BA',
    title: 'PSU-BA (CEREM-BA) Residência Médica: Casos Clínicos e Estratégia',
    description:
      'Como dominar a prova do PSU-BA (CEREM-BA / Strix): formato de situações-problema com múltiplas questões por caso, temas mais cobrados e plano FSRS-6.',
    lastModified: LAST_CONTENT_UPDATE,
    examFormat:
      'Um dos formatos mais icônicos e diferenciados do Brasil: organizada historicamente pela Strix Educação/CEREM-BA, a prova objetiva (peso 90%, somada a 10% de currículo na estrutura tradicional) é estruturada em situações-problema — casos clínicos extensos dos quais derivam blocos de 3 a 5 questões sequenciais (totalizando geralmente 75 questões objetivas para acesso direto).',
    questionCount: '75 questões objetivas organizadas em situações-problema (blocos de casos clínicos)',
    cutoffRange:
      '68% a 84%+ na prova objetiva (varia conforme especialidade, instituição na Bahia e desempenho nos blocos de casos clínicos)',
    profileSummary: [
      'A prova do PSU-BA (SUS-BA / CEREM-BA) exige uma mudança real de mentalidade em relação às provas tradicionais de questões isoladas. Em vez de 100 perguntas desconectadas, você recebe um conjunto de casos clínicos detalhados e responde a múltiplas questões sobre o mesmo paciente — da hipótese diagnóstica inicial ao exame complementar, conduta de emergência, complicação evolutiva e prevenção.',
      'Essa estrutura cria um risco específico: errar a premissa diagnóstica da situação-problema pode contaminar duas ou três questões em sequência. Por outro lado, quem domina raciocínio longitudinal do paciente e treina provas antigas da Strix ganha uma vantagem competitiva gigantesca.',
    ],
    areaDistribution: [
      {
        area: 'Clínica Médica',
        percentage: 20,
        focusNote:
          'Casos longitudinais de cardiologia, infectologia, doenças crônicas descompensadas, nefrologia e emergências clínicas.',
      },
      {
        area: 'Cirurgia Geral',
        percentage: 20,
        focusNote:
          'Trauma, abdome agudo completo (diagnóstico → preparo → cirurgia → complicação), vias biliares e hemorragia digestiva.',
      },
      {
        area: 'Pediatria',
        percentage: 20,
        focusNote:
          'Evolução clínica completa em pediatria: neonatologia, urgências respiratórias, diarreia/desidratação, infectopediatria e puericultura.',
      },
      {
        area: 'Ginecologia e Obstetrícia',
        percentage: 20,
        focusNote:
          'Pré-natal completo com intercorrências, síndromes hipertensivas, hemorragias obstétricas, oncoginecologia e urgências ginecológicas.',
      },
      {
        area: 'Medicina Preventiva',
        percentage: 20,
        focusNote:
          'Casos de APS, saúde da família, vigilância epidemiológica, indicadores municipais e tomada de decisão em gestão do SUS.',
      },
    ],
    topTopics: [
      {
        topic: 'Manejo Longitudinal do Trauma e Complicações Cirúrgicas',
        area: 'Cirurgia Geral',
        incidence: 'Muito Alta',
        rationale:
          'Um mesmo caso de trauma permite à Strix cobrar ABCDE na questão 1, conduta no choque na questão 2 e complicação pós-operatória na questão 3.',
      },
      {
        topic: 'Pré-Natal de Alto Risco, Pré-Eclâmpsia e Assistência ao Parto',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Muito Alta',
        rationale:
          'A progressão da gestante do ambulatório à maternidade encaixa-se perfeitamente no modelo de situações-problema do PSU-BA.',
      },
      {
        topic: 'Síndromes Coronarianas, Insuficiência Cardíaca e Emergências Clínicas',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Casos sequenciais testam diagnóstico sindrômico, interpretação de ECG/laboratório, tratamento agudo e prevenção secundária na alta.',
      },
      {
        topic: 'Infectologia e Doenças Endêmicas (Dengue, Tuberculose, HIV e Sífilis)',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Forte presença de protocolos do Ministério da Saúde aplicados ao acompanhamento do paciente no SUS baiano.',
      },
      {
        topic: 'Emergências Pediátricas, Neonatologia e Doenças Respiratórias',
        area: 'Pediatria',
        incidence: 'Muito Alta',
        rationale:
          'A banca explora desde o atendimento em sala de parto até a evolução de lactentes com bronquiolite, pneumonia ou desidratação grave.',
      },
      {
        topic: 'Abdome Agudo (Apendicite, Colecistite, Obstrução e Pancreatite)',
        area: 'Cirurgia Geral',
        incidence: 'Alta',
        rationale:
          'Exige conectar semiologia abdominal, escolha do exame de imagem ideal e conduta cirúrgica/conservadora sem confundir etapas.',
      },
      {
        topic: 'Atenção Primária à Saúde, Vigilância e Investigação de Surtos',
        area: 'Medicina Preventiva',
        incidence: 'Alta',
        rationale:
          'Situações-problema municipais cobram medidas de controle de surtos, cálculo de indicadores e organização da Estratégia Saúde da Família.',
      },
      {
        topic: 'Rastreamento de Câncer de Colo e Mama e Sangramento Uterino Anormal',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Alta',
        rationale:
          'Casos ambulatoriais que evoluem da queixa inicial ao resultado de exame preventivo/mamografia e conduta definitiva.',
      },
    ],
    studyStrategy: [
      {
        step: 1,
        title: 'Treine leitura estratégica de situações-problema da Strix',
        description:
          'Leia o caso clínico sublinhando idade, sinais vitais, tempo de evolução e exames alterados antes de responder ao bloco inteiro. Observe como a questão seguinte muitas vezes confirma ou delimita o diagnóstico da anterior.',
        fsrsAction:
          'Ao corrigir um bloco inteiro no AdaptiveMed, registre separadamente se o erro foi de diagnóstico inicial ou de conduta sequencial.',
      },
      {
        step: 2,
        title: 'Estude cada doença como linha do tempo completa',
        description:
          'Não basta saber o diagnóstico: para o PSU-BA você precisa dominar o fluxo completo (quadro clínico → exame confirmatório → tratamento inicial → manejo de complicação → profilaxia).',
        fsrsAction:
          'Estruture revisões ativas no FSRS-6 cobrando conduta e complicações dos temas de maior incidência, não apenas definições.',
      },
      {
        step: 3,
        title: 'Proteja-se do "efeito cascata" em uma prova de 75 questões',
        description:
          'Com 75 questões totais, cada item pesa 1,33% da nota objetiva. Perder um bloco inteiro de 3 questões por leitura apressada custa 4 pontos percentuais de uma só vez.',
        fsrsAction:
          'Use simulados cronometrados com provas anteriores do PSU-BA para treinar checagem de premissas antes de marcar o gabarito.',
      },
      {
        step: 4,
        title: 'Mantenha revisões constantes sem atrasos durante o ano',
        description:
          'A memória para fluxogramas completos de conduta só se consolida com revisões espaçadas recorrentes ao longo de meses.',
        fsrsAction:
          'Deixe o motor FSRS-6 ajustar automaticamente a cadência de cada tema conforme sua taxa real de acertos nos blocos.',
      },
    ],
    faqs: [
      {
        question: 'Como funciona o formato de situações-problema do PSU-BA?',
        answer:
          'No modelo clássico do PSU-BA (CEREM-BA / Strix), a prova apresenta casos clínicos detalhados seguidos por um grupo de questões relacionadas ao mesmo paciente, avaliando raciocínio diagnóstico, exames complementares, tratamento e seguimento de forma integrada.',
      },
      {
        question: 'Quantas questões tem o PSU-BA para acesso direto?',
        answer:
          'Tradicionalmente a prova objetiva de acesso direto conta com 75 questões (distribuídas de forma equilibrada entre as 5 grandes áreas em blocos de situações-problema), compondo 90% da pontuação junto a 10% da análise curricular — sempre sujeito às regras do edital anual.',
      },
      {
        question: 'Por que errar a primeira questão de um caso clínico no PSU-BA é tão perigoso?',
        answer:
          'Porque, se você partir de uma hipótese diagnóstica equivocada, pode errar também a escolha do exame e a conduta nas questões seguintes do mesmo bloco. Uma dica prática é ler todas as perguntas do bloco antes de fechar a primeira resposta, buscando pistas de coerência clínica.',
      },
      {
        question: 'Quais provas complementares ajudam na preparação para o PSU-BA?',
        answer:
          'Além de resolver todas as provas antigas do próprio PSU-BA/SUS-BA (prioridade absoluta pelo formato único), provas do PSU-MG, SES-PE e ENARE complementam muito bem o domínio das diretrizes nacionais e das 5 grandes áreas.',
      },
    ],
    relatedBancas: ['ses-pe', 'psu-mg', 'enare', 'revalida'],
    relatedGuias: [
      'caderno-de-erros-inteligente-residencia-medica',
      'simulados-provas-na-integra-nota-de-corte',
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
    ],
  },
  {
    slug: 'psu-mg',
    name: 'PSU-MG — Processo Seletivo Unificado de Minas Gerais (AREMG)',
    shortName: 'PSU-MG',
    article: 'o',
    region: 'Sudeste',
    stateOrScope: 'Minas Gerais (Belo Horizonte e Interior — Rede AREMG)',
    organizer: 'AREMG (Associação de Apoio à Residência Médica de MG)',
    title: 'PSU-MG (AREMG) Residência Médica: Temas, Corte e Como Passar',
    description:
      'Guia estratégico do PSU-MG (AREMG): prova de 75 questões, alto peso por acerto, temas mais incidentes nas 5 grandes áreas e revisões FSRS-6.',
    lastModified: LAST_CONTENT_UPDATE,
    examFormat:
      'Processo seletivo unificado coordenado pela AREMG para dezenas de instituições mineiras (incluindo UFMG/HC-UFMG, FHEMIG, Santa Casa BH, Hospital Felício Rocho, Mater Dei e serviços do interior). Tradicionalmente composto por prova objetiva de 75 questões de 4 alternativas (15 por grande área, peso de 90%) + avaliação curricular padronizada (peso de 10%).',
    questionCount: '75 questões objetivas (4 alternativas — A a D)',
    cutoffRange:
      '76% a 90%+ na prova objetiva dependendo da instituição e da especialidade (a prova mais enxuta eleva a sensibilidade a cada erro)',
    profileSummary: [
      'O PSU-MG é a principal porta de entrada para a Residência Médica em Minas Gerais, unificando quase todos os grandes hospitais universitários, públicos e filantrópicos do estado em uma única prova objetiva de 75 questões. Por ter menos questões que provas de 100 ou 120 itens, cada questão errada custa 1,33% da nota objetiva — margem mínima para deslizes.',
      'As questões da AREMG costumam ser bem construídas, clinicamente coerentes e muito fiéis a livros-texto clássicos (como Sabiston, Nelson, Rezende/Williams, Tratado de Clínica Médica) e protocolos brasileiros. Não é uma prova de pegadinhas absurdas, mas cobra precisão absoluta nos conceitos fundamentais.',
    ],
    areaDistribution: [
      {
        area: 'Clínica Médica',
        percentage: 20,
        focusNote:
          'Clínica interna clássica: cardiologia, pneumologia, infectologia, endocrinologia, nefrologia e raciocínio semiológico bem estruturado.',
      },
      {
        area: 'Cirurgia Geral',
        percentage: 20,
        focusNote:
          'Trauma (ATLS), abdome agudo, hérnias, vias biliares, oncologia cirúrgica básica e cuidados perioperatórios.',
      },
      {
        area: 'Pediatria',
        percentage: 20,
        focusNote:
          'Puericultura, aleitamento materno, imunizações, neonatologia, doenças respiratórias e infecciosas pediátricas.',
      },
      {
        area: 'Ginecologia e Obstetrícia',
        percentage: 20,
        focusNote:
          'Pré-natal, síndromes hipertensivas, hemorragias da gestação, sangramento uterino anormal, oncoginecologia e planejamento familiar.',
      },
      {
        area: 'Medicina Preventiva',
        percentage: 20,
        focusNote:
          'Epidemiologia básica e analítica, políticas do SUS, atenção primária, vigilância em saúde e ética médica.',
      },
    ],
    topTopics: [
      {
        topic: 'Pré-Natal, Distúrbios Hipertensivos e Diabetes Gestacional',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Muito Alta',
        rationale:
          'A obstetrícia do PSU-MG cobra com regularidade critérios diagnósticos, conduta expectante vs. resolução da gestação e profilaxia de eclâmpsia.',
      },
      {
        topic: 'Puericultura, Aleitamento Materno e Calendário Vacinal (PNI)',
        area: 'Pediatria',
        incidence: 'Muito Alta',
        rationale:
          'Questões clássicas de consultório pediátrico sobre técnica de amamentação, contraindicações verdadeiras, introdução alimentar e vacinas atrasadas.',
      },
      {
        topic: 'ATLS, Trauma Toracoabdominal e Abdome Agudo Cirúrgico',
        area: 'Cirurgia Geral',
        incidence: 'Muito Alta',
        rationale:
          'Foco em conduta sistematizada no trauma, diagnóstico clínico-radiológico de apendicite/colecistite/obstrução intestinal e indicação cirúrgica.',
      },
      {
        topic: 'Hipertensão, Insuficiência Cardíaca e Doença Arterial Coronariana',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Base central da Clínica Médica na AREMG, exigindo segurança em escolha farmacológica por comorbidade e manejo agudo da SCA.',
      },
      {
        topic: 'Epidemiologia, Indicadores de Saúde e Legislação do SUS',
        area: 'Medicina Preventiva',
        incidence: 'Muito Alta',
        rationale:
          'Como são apenas 15 questões de Preventiva, gabaritar ou quase gabaritar epidemiologia, sensibilidade/especificidade e SUS garante folga valiosa no corte.',
      },
      {
        topic: 'Rastreamento Oncológico e Patologia Cervical/Mamária',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Alta',
        rationale:
          'Conduta frente a alterações do exame preventivo, colposcopia, categorias BI-RADS e investigação de massa anexial.',
      },
      {
        topic: 'Doenças Respiratórias Agudas e Crônicas (DPOC, Asma e Pneumonias)',
        area: 'Clínica Médica',
        incidence: 'Alta',
        rationale:
          'Classificação GOLD/GINA, escolha antibiótica na PAC ambulatorial vs. internada e manejo da exacerbação aguda.',
      },
      {
        topic: 'Neonatologia: Icterícia, Reanimação e Infecções Congênitas',
        area: 'Pediatria',
        incidence: 'Alta',
        rationale:
          'Condutas padronizadas da SBP e do Ministério da Saúde na assistência ao recém-nascido nas primeiras horas e semanas de vida.',
      },
    ],
    studyStrategy: [
      {
        step: 1,
        title: 'Busque precisão cirúrgica: cada erro pesa 1,33% na nota',
        description:
          'Na prova de 75 questões da AREMG, eliminar 3 erros evitáveis significa ganhar 4 pontos percentuais — muitas vezes a diferença entre ficar na lista de espera e ser convocado na 1ª chamada.',
        fsrsAction:
          'Use o Caderno de Erros para auditar rigorosamente todo erro por confusão de conceito ou distrator clássico.',
      },
      {
        step: 2,
        title: 'Resolva os últimos 8 anos do PSU-MG analisando o padrão da AREMG',
        description:
          'A banca mantém coerência editorial notável ao longo dos anos. Conhecer o estilo direto de 4 alternativas acelera o raciocínio e reduz dúvidas entre duas opções.',
        fsrsAction:
          'Lance todas as provas antigas do PSU-MG em Simulados & Bancas e compare sua acurácia em cada bloco de 15 questões.',
      },
      {
        step: 3,
        title: 'Mantenha o currículo organizado sem sacrificar a prova objetiva',
        description:
          'Os 10% do currículo padronizado da AREMG fazem diferença em especialidades muito disputadas em BH, mas os 90% da prova objetiva continuam sendo o motor da aprovação.',
        fsrsAction:
          'Garanta constância diária com revisões FSRS-6 curtas para manter alta retenção nas 5 grandes áreas mesmo enquanto finaliza documentos do currículo.',
      },
      {
        step: 4,
        title: 'Trave retenção acima de 85% nos 30 temas mais clássicos',
        description:
          'A AREMG recompensa muito quem domina os temas pilares sem lacunas, em vez de gastar meses em doenças ultrarraras.',
        fsrsAction:
          'Priorize os temas de alta prevalência no cronograma adaptativo e acompanhe a estabilidade da sua memória semana a semana.',
      },
    ],
    faqs: [
      {
        question: 'Quantas questões tem a prova do PSU-MG e qual o peso do currículo?',
        answer:
          'Para especialidades de acesso direto, o PSU-MG (AREMG) aplica tradicionalmente 75 questões objetivas de 4 alternativas (15 por grande área), correspondentes a 90% da nota final, mais 10% provenientes da avaliação curricular padronizada.',
      },
      {
        question: 'A nota de corte do PSU-MG costuma ser alta?',
        answer:
          'Sim, especialmente para instituições muito disputadas em Belo Horizonte (como HC-UFMG, Santa Casa BH e grandes hospitais privados/filantrópicos) e especialidades de alta concorrência. Como a prova é limpa e tem 75 questões, a densidade de candidatos acima de 80% é elevada.',
      },
      {
        question: 'O PSU-MG tem 2ª fase prática?',
        answer:
          'Na estrutura tradicional do PSU-MG para acesso direto, a seleção ocorre por prova objetiva + currículo padronizado, sem 2ª fase prática — mas é indispensável validar sempre o edital específico da edição e da instituição escolhida.',
      },
      {
        question: 'Por que a repetição espaçada é tão estratégica para uma prova de 75 questões?',
        answer:
          'Porque com poucas questões por área (15 cada), esquecer um critério clássico de pré-eclâmpsia, vacinação ou ATLS tem impacto proporcional muito maior na nota final. O FSRS-6 mantém esses pilares ativos na memória até o dia da prova com o menor volume de revisões necessário.',
      },
    ],
    relatedBancas: ['enare', 'sus-sp', 'usp-sp', 'psu-ba'],
    relatedGuias: [
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
      'simulados-provas-na-integra-nota-de-corte',
      'combinar-cursinho-com-repeticao-espacada',
    ],
  },
  {
    slug: 'amrigs',
    name: 'AMRIGS — Associação Médica do Rio Grande do Sul',
    shortName: 'AMRIGS',
    article: 'a',
    region: 'Sul',
    stateOrScope: 'Rio Grande do Sul e Exame Unificado (AMRIGS / ACM / AMMS)',
    organizer: 'Fundatec / AMRIGS',
    title: 'AMRIGS Residência Médica: Perfil Fundatec, Temas e Estratégia',
    description:
      'Prepare-se para a prova da AMRIGS (Fundatec) na Residência Médica: 100 questões de 4 alternativas, temas mais incidentes no Sul e revisão FSRS-6.',
    lastModified: LAST_CONTENT_UPDATE,
    examFormat:
      'Prova objetiva unificada (aplicada em parceria com ACM/SC e AMMS/MS) composta por 100 questões de 4 alternativas (20 por grande área), executada pela Fundatec. Funciona como 1ª etapa ou critério objetivo principal para dezenas de programas de residência no Rio Grande do Sul e Santa Catarina, sendo complementada por currículo e/ou etapas próprias conforme a instituição escolhida.',
    questionCount: '100 questões objetivas (4 alternativas — A a D)',
    cutoffRange:
      '72% a 87%+ na prova objetiva (varia conforme hospital gaúcho/catarinense e especialidade escolhida)',
    profileSummary: [
      'O Exame AMRIGS é a principal referência unificada para quem deseja fazer Residência Médica no Sul do Brasil, abrindo portas para dezenas de hospitais renomados no Rio Grande do Sul (como Santa Casa de Porto Alegre, Hospital São Lucas da PUCRS, Grupo Hospitalar Conceição e instituições do interior, conforme adesão anual) além de instituições de Santa Catarina (ACM) e Mato Grosso do Sul (AMMS).',
      'As questões da AMRIGS/Fundatec costumam ser diretas, objetivas e com forte cobrança de condutas clássicas, semiologia, diagnósticos diferenciais limpos e referências médicas tradicionais do Sul (como Duncan/Medicina Ambulatorial em Preventiva e APS). Quem domina conceitos precisos sem cair em alternativas parcialmente corretas pontua muito alto.',
    ],
    areaDistribution: [
      {
        area: 'Clínica Médica',
        percentage: 20,
        focusNote:
          'Medicina interna clássica, cardiologia, pneumologia, gastroenterologia, endocrinologia e manejo ambulatorial/hospitalar direto.',
      },
      {
        area: 'Cirurgia Geral',
        percentage: 20,
        focusNote:
          'Abdome agudo, trauma, vias biliares, hérnias, oncologia digestiva básica e condutas perioperatórias padronizadas.',
      },
      {
        area: 'Pediatria',
        percentage: 20,
        focusNote:
          'Puericultura, doenças respiratórias na infância (alta sazonalidade no Sul), imunizações, neonatologia e urgências pediátricas.',
      },
      {
        area: 'Ginecologia e Obstetrícia',
        percentage: 20,
        focusNote:
          'Obstetrícia clássica (pré-natal, hipertensão, hemorragias, trabalho de parto), ginecologia ambulatorial, climatério e oncoginecologia.',
      },
      {
        area: 'Medicina Preventiva',
        percentage: 20,
        focusNote:
          'Medicina de Família e Comunidade (referência Duncan), epidemiologia clínica, rastreamentos, SUS e ética médica.',
      },
    ],
    topTopics: [
      {
        topic: 'Medicina Ambulatorial, Rastreamentos e Atenção Primária (Base Duncan)',
        area: 'Medicina Preventiva',
        incidence: 'Muito Alta',
        rationale:
          'A tradição acadêmica gaúcha em Medicina de Família e Comunidade reflete-se fortemente na AMRIGS, cobrando indicações e periodicidade de rastreamentos, prevenção quaternária e abordagem ambulatorial.',
      },
      {
        topic: 'Doenças Respiratórias Pediátricas, Asma e Bronquiolite',
        area: 'Pediatria',
        incidence: 'Muito Alta',
        rationale:
          'Condutas diagnósticas e terapêuticas em IVAS, otite média aguda, bronquiolite viral aguda, pneumonias e crise asmática na infância.',
      },
      {
        topic: 'Cardiologia Ambulatorial e Urgências Cardiovasculares',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'HAS, dislipidemia, fibrilação atrial, insuficiência cardíaca e síndromes coronarianas com enunciados claros exigindo conduta de 1ª escolha.',
      },
      {
        topic: 'Abdome Agudo e Doenças das Vias Biliares / Pâncreas',
        area: 'Cirurgia Geral',
        incidence: 'Muito Alta',
        rationale:
          'Colelitíase, colecistite, colangite, apendicite e pancreatite aguda aparecem repetidamente em questões diretas de diagnóstico e tratamento.',
      },
      {
        topic: 'Pré-Natal, Síndromes Hipertensivas e Trabalho de Parto',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Muito Alta',
        rationale:
          'Rotina de exames pré-natais, interpretação de sorologias, manejo da pré-eclâmpsia e fases clínicas/mecanismo de parto.',
      },
      {
        topic: 'Epidemiologia Clínica e Interpretação de Testes Diagnósticos',
        area: 'Medicina Preventiva',
        incidence: 'Alta',
        rationale:
          'Cálculos diretos de sensibilidade, especificidade, VPP/VPN, risco relativo, odds ratio e tipos de vieses epidemiológicos.',
      },
      {
        topic: 'Trauma (ATLS) e Hérnias da Parede Abdominal',
        area: 'Cirurgia Geral',
        incidence: 'Alta',
        rationale:
          'Avaliação primária no trauma, reposição volêmica, pneumotórax e diferenciação anatômica/terapêutica das hérnias inguinais e femorais.',
      },
      {
        topic: 'Climatério, Anticoncepção e Vulvovaginites / DIP',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Alta',
        rationale:
          'Questões ambulatoriais clássicas sobre terapia hormonal, critérios de elegibilidade contraceptiva e critérios diagnósticos/tratamento da DIP.',
      },
    ],
    studyStrategy: [
      {
        step: 1,
        title: 'Treine a objetividade das provas da AMRIGS dos últimos 7 anos',
        description:
          'A AMRIGS tem um banco histórico muito consistente: resolver provas antigas da própria Fundatec/AMRIGS mostra rapidamente o vocabulário e o grau de detalhe cobrado em cada grande área.',
        fsrsAction:
          'Registre cada prova antiga como simulado da banca AMRIGS para medir sua evolução por área em relação ao corte dos hospitais do Sul.',
      },
      {
        step: 2,
        title: 'Reforce Medicina de Família, Rastreamentos e Conceitos Ambulatoriais',
        description:
          'Questões de Medicina Preventiva e Clínica Ambulatorial na AMRIGS frequentemente cobram recomendações objetivas de rastreamento (quem rastrear, quando começar e quando parar).',
        fsrsAction:
          'Inclua faixas etárias e critérios de rastreamento no Caderno de Erros para revisões espaçadas de alta precisão.',
      },
      {
        step: 3,
        title: 'Atenção redobrada às questões de "assinale a correta/incorreta"',
        description:
          'Enunciados curtos com 4 alternativas costumam esconder a diferença em uma palavra (como "sempre", "exceto" ou uma dose/conduta trocada).',
        fsrsAction:
          'Revise seus erros distinguindo lacuna teórica de erro de leitura, ajustando sua estratégia de prova nos simulados semanais.',
      },
      {
        step: 4,
        title: 'Equilibre a preparação se também for prestar HCPA ou UFCSPA',
        description:
          'Muitos candidatos do RS prestam AMRIGS junto com HCPA (que possui prova própria). O núcleo de conteúdo é altamente compatível quando organizado por revisões adaptativas.',
        fsrsAction:
          'Centralize o histórico de acertos por assunto no FSRS-6 para manter a base comum blindada e direcionar apenas o ajuste fino para cada edital.',
      },
    ],
    faqs: [
      {
        question: 'Quais estados e instituições aceitam a nota do Exame AMRIGS?',
        answer:
          'O Exame AMRIGS é aplicado de forma unificada em parceria com a ACM (Santa Catarina) e a AMMS (Mato Grosso do Sul), sendo aceito como etapa objetiva por dezenas de hospitais no Rio Grande do Sul e nos estados parceiros, conforme a lista de instituições conveniadas publicada no edital de cada ano.',
      },
      {
        question: 'Quantas questões tem a prova da AMRIGS e qual o estilo da Fundatec?',
        answer:
          'Para acesso direto, a prova objetiva conta tradicionalmente com 100 questões de 4 alternativas (20 por grande área). Os enunciados tendem a ser objetivos e diretos, cobrando sólida base clínica, protocolos atualizados e atenção aos detalhes das alternativas.',
      },
      {
        question: 'A AMRIGS tem segunda fase?',
        answer:
          'O Exame AMRIGS em si corresponde à prova objetiva unificada. A existência de análise curricular, entrevista ou etapa complementar depende das regras de cada instituição escolhida pelo candidato na inscrição.',
      },
      {
        question: 'Qual a principal diferença de Preventiva na AMRIGS?',
        answer:
          'Além de epidemiologia e SUS, a AMRIGS valoriza muito Medicina de Família e Comunidade, rastreamentos populacionais, abordagem ambulatorial e conceitos alinhados à literatura médica de referência do Rio Grande do Sul (como o tratado Medicina Ambulatorial).',
      },
    ],
    relatedBancas: ['enare', 'sus-sp', 'psu-mg', 'usp-sp'],
    relatedGuias: [
      'combinar-cursinho-com-repeticao-espacada',
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
      'simulados-provas-na-integra-nota-de-corte',
    ],
  },
  {
    slug: 'revalida',
    name: 'Revalida INEP — Exame Nacional de Revalidação de Diplomas Médicos',
    shortName: 'Revalida INEP',
    article: 'o',
    region: 'Nacional',
    stateOrScope: 'Abrangência Nacional (Aplicação INEP / MEC em todo o Brasil)',
    organizer: 'INEP / Ministério da Educação (MEC)',
    title: 'Revalida INEP: Temas que Mais Caem, 1ª e 2ª Etapa e Cronograma',
    description:
      'Guia completo do Revalida INEP: prova objetiva + discursiva, 2ª etapa prática (10 estações OSCE), foco em APS/SUS, temas mais cobrados e método FSRS-6.',
    lastModified: LAST_CONTENT_UPDATE,
    examFormat:
      'Exame nacional em duas etapas eliminatórias (não concorrencial — você compete contra a nota de corte definida pelo edital/INEP): 1ª etapa composta por 100 questões objetivas de 4 alternativas + 5 questões discursivas (1 por grande área); 2ª etapa prática com 10 estações clínicas estruturadas (OSCE — 2 estações por grande área) com atores padronizados e checklist rigoroso.',
    questionCount:
      '100 questões objetivas + 5 questões discursivas (1ª etapa) e 10 estações práticas OSCE (2ª etapa)',
    cutoffRange:
      'Ponto de corte fixado por edital/equivalência psicométrica (historicamente na faixa de ~60% a ~67% na 1ª etapa somando objetiva + discursiva)',
    profileSummary: [
      'Diferentemente das provas de Residência Médica, o Revalida INEP não é uma disputa por vagas contra outros candidatos: todos que atingem a nota de corte estabelecida pelo INEP avançam de etapa e conquistam a revalidação do diploma. Isso torna a preparação altamente previsível quando focada na Matriz de Referência oficial do exame.',
      'A espinha dorsal do Revalida é a medicina praticada na rede pública brasileira — Atenção Primária à Saúde (UBS/ESF), Pronto Atendimento (UPA), maternidade de risco habitual/alto risco e protocolos oficiais do Ministério da Saúde (PCDTs, Cadernos de Atenção Básica, PNI e SUS). Dominar comunicação centrada na pessoa, condutas padronizadas do MS e escrita objetiva para a prova discursiva é o caminho mais seguro para a aprovação.',
    ],
    areaDistribution: [
      {
        area: 'Clínica Médica',
        percentage: 20,
        focusNote:
          'Manejo de HAS, DM2, tuberculose, hanseníase, dengue, HIV/ISTs, urgências em UPA e doenças prevalentes na rede SUS.',
      },
      {
        area: 'Cirurgia Geral',
        percentage: 20,
        focusNote:
          'ATLS em pronto-socorro, abdome agudo, hérnias, pequenas cirurgias/feridas, queimaduras e encaminhamento oportuno à rede hospitalar.',
      },
      {
        area: 'Pediatria',
        percentage: 20,
        focusNote:
          'Puericultura na UBS, aleitamento materno, PNI completo, diarreia/desidratação, doenças respiratórias, neonatologia e proteção infantil.',
      },
      {
        area: 'Ginecologia e Obstetrícia',
        percentage: 20,
        focusNote:
          'Pré-natal completo no SUS, sífilis na gestação, pré-eclâmpsia, HPP, rastreamento de colo/mama, planejamento reprodutivo e ISTs.',
      },
      {
        area: 'Medicina Preventiva',
        percentage: 20,
        focusNote:
          'Princípios do SUS, atributos da APS, método clínico centrado na pessoa, saúde mental na UBS, notificação compulsória e ética médica.',
      },
    ],
    topTopics: [
      {
        topic: 'Pré-Natal no SUS, Sífilis na Gestação e Urgências Obstétricas',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Muito Alta',
        rationale:
          'Rotina de exames do 1º/2º/3º trimestre, esquema de penicilina benzatina, síndromes hipertensivas e hemorragia pós-parto caem tanto na objetiva quanto na discursiva e nas estações OSCE.',
      },
      {
        topic: 'Atenção Primária à Saúde (APS), SUS e Método Clínico Centrado na Pessoa',
        area: 'Medicina Preventiva',
        incidence: 'Muito Alta',
        rationale:
          'O Revalida avalia continuamente se o médico sabe atuar na Estratégia Saúde da Família, coordenar o cuidado, aplicar acolhimento e respeitar princípios do SUS e do Código de Ética Médica.',
      },
      {
        topic: 'Tuberculose, Hanseníase, HIV/ISTs e Arboviroses (PCDTs do MS)',
        area: 'Clínica Médica',
        incidence: 'Muito Alta',
        rationale:
          'Protocolos brasileiros específicos (esquema RIPE, busca ativa de sintomáticos respiratórios, PQT única, abordagem de dengue grupos A–D e PEP/PrEP) são cobrados no detalhe.',
      },
      {
        topic: 'Puericultura, Aleitamento Materno, PNI e Diarreia/Desidratação',
        area: 'Pediatria',
        incidence: 'Muito Alta',
        rationale:
          'Interpretação da Caderneta da Criança, curvas de crescimento, atualização vacinal e manejo dos planos A, B e C de hidratação.',
      },
      {
        topic: 'Trauma (ATLS), Queimaduras e Abdome Agudo no Pronto Atendimento',
        area: 'Cirurgia Geral',
        incidence: 'Muito Alta',
        rationale:
          'Estabilização inicial na UPA/PS, critérios de transferência para centro de trauma, drenagem torácica e diagnóstico oportuno de abdome agudo.',
      },
      {
        topic: 'Hipertensão Arterial, Diabetes Mellitus e Saúde Mental na APS',
        area: 'Clínica Médica',
        incidence: 'Alta',
        rationale:
          'Manejo longitudinal de crônicos na UBS, prevenção de complicações micro/macrovasculares e abordagem inicial de depressão, ansiedade e risco de suicídio.',
      },
      {
        topic: 'Rastreamento de Câncer (Colo Uterino e Mama) e Violência contra a Mulher',
        area: 'Ginecologia e Obstetrícia',
        incidence: 'Alta',
        rationale:
          'Diretrizes do INCA/MS para preventivo e mamografia, além do protocolo de atendimento humanizado, profilaxias e notificação em casos de violência sexual.',
      },
      {
        topic: 'Vigilância Epidemiológica, Notificação Compulsória e Saúde do Trabalhador',
        area: 'Medicina Preventiva',
        incidence: 'Alta',
        rationale:
          'Identificação de agravos de notificação imediata, emissão de CAT, investigação de surtos locais e preenchimento correto da Declaração de Óbito.',
      },
      {
        topic: 'Reanimação Neonatal e Doenças Respiratórias Agudas na Infância',
        area: 'Pediatria',
        incidence: 'Alta',
        rationale:
          'Protocolo atualizado da SBP na sala de parto e manejo clínico de bronquiolite, pneumonia e asma infantil.',
      },
    ],
    studyStrategy: [
      {
        step: 1,
        title: 'Alinhe 100% do seu estudo aos protocolos brasileiros do Ministério da Saúde',
        description:
          'Muitos médicos formados no exterior erram questões do Revalida não por falta de conhecimento médico, mas por usar esquemas terapêuticos ou calendários vacinais de outros países em vez dos PCDTs e do PNI brasileiros.',
        fsrsAction:
          'Crie registros no Caderno de Erros sempre que houver diferença entre sua prática prévia e a diretriz oficial do Ministério da Saúde.',
      },
      {
        step: 2,
        title: 'Treine as 5 questões discursivas desde cedo, não só na última semana',
        description:
          'A prova discursiva vale pontos decisivos para cruzar a nota de corte da 1ª etapa. Estude pelos padrões definitivos de resposta (PEP) do INEP para aprender a pontuar cada item esperado.',
        fsrsAction:
          'Reserve blocos semanais no modo foco para redigir respostas curtas e objetivas em formato de checklist para os temas mais cobrados.',
      },
      {
        step: 3,
        title: 'Priorize os temas de altíssima incidência com repetição espaçada',
        description:
          'Como o Revalida tem nota de corte fixa e matriz muito estável, consolidar com segurança os 40 a 50 temas centrais de APS, obstetrícia, pediatria, trauma e clínica garante margem confortável de aprovação.',
        fsrsAction:
          'Use o algoritmo FSRS-6 para revisar continuamente pré-natal, PNI, dengue, tuberculose, ATLS e SUS sem esquecer detalhes até o dia da prova.',
      },
      {
        step: 4,
        title: 'Conecte o estudo da 1ª etapa aos checklists da 2ª etapa (OSCE)',
        description:
          'As mesmas condutas cobradas nas questões objetivas e discursivas reaparecem nas 10 estações práticas, somadas à comunicação empática, lavagem das mãos, pedido de exames e orientação clara ao paciente.',
        fsrsAction:
          'Acompanhe sua acurácia por grande área na Evolução garantindo equilíbrio — nenhuma das 5 áreas pode virar ponto cego na etapa prática.',
      },
    ],
    faqs: [
      {
        question: 'Qual a estrutura das duas etapas do Revalida INEP?',
        answer:
          'A 1ª etapa é composta por 100 questões objetivas (4 alternativas) e 5 questões discursivas, avaliando as 5 grandes áreas médicas. Quem atinge a nota de corte estabelecida no edital avança para a 2ª etapa, formada por 10 estações práticas clínicas (OSCE — 2 por grande área) com avaliação por checklist padronizado.',
      },
      {
        question: 'No Revalida eu preciso competir por vagas com outros candidatos?',
        answer:
          'Não. O Revalida é um exame de proficiência com nota de corte definida pelo INEP. Todos os candidatos que alcançam ou superam a pontuação mínima exigida são aprovados na etapa, independentemente do desempenho dos demais participantes.',
      },
      {
        question: 'Por que estudar diretrizes brasileiras (MS/PCDT/PNI) é indispensável no Revalida?',
        answer:
          'Porque o objetivo do exame é validar a aptidão para atuar no Sistema Único de Saúde (SUS). Esquemas de tuberculose, sífilis, dengue, HIV, calendário vacinal e rotinas de pré-natal seguem estritamente os manuais oficiais do Ministério da Saúde.',
      },
      {
        question: 'Quem já foi aprovado na 1ª etapa precisa refazê-la se reprovar na 2ª etapa?',
        answer:
          'As edições recentes do Revalida preveem reaproveitamento da aprovação na 1ª etapa por um número limitado de edições subsequentes conforme as regras do edital vigente, permitindo ao candidato focar diretamente no preparo das 10 estações práticas.',
      },
    ],
    relatedBancas: ['enare', 'ses-pe', 'psu-ba', 'sus-sp'],
    relatedGuias: [
      'fsrs-6-vs-revisoes-fixas-residencia-medica',
      'caderno-de-erros-inteligente-residencia-medica',
      'simulados-provas-na-integra-nota-de-corte',
    ],
  },
];

export function getBancaBySlug(slug: string): BancaSeoEntry | undefined {
  const normalized = slug.trim().toLowerCase();
  return BANCAS_SEO.find((banca) => banca.slug === normalized);
}

export function getBancasByRegion(region: BancaRegion): BancaSeoEntry[] {
  return BANCAS_SEO.filter((banca) => banca.region === region);
}

export function formatRegionLabel(region: BancaRegion): string {
  return region === 'Nacional' ? 'Abrangência Nacional' : `Região ${region}`;
}

export function getBancaArticles(banca: Pick<BancaSeoEntry, 'article'>): {
  art: 'o' | 'a';
  de: 'do' | 'da';
  em: 'no' | 'na';
} {
  return banca.article === 'o'
    ? { art: 'o', de: 'do', em: 'no' }
    : { art: 'a', de: 'da', em: 'na' };
}
