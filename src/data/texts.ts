import { Locale } from "@/types/i18n"

// Battle texts categorized by character ID and difficulty focus.
// Unicode-safe, carefully calibrated for typing speed, accuracy, combo, and focus.

export const BATTLE_TEXTS_EN: Record<string, string[]> = {
  // 1. NARUTO — Balanced / Fundamentals (16 texts)
  naruto: [
    "The ninja runs quickly through the hidden village at dawn.",
    "Hard work and determination are the keys to becoming hokage.",
    "Never give up no matter how difficult the path may seem.",
    "Believe in yourself and your friends will always be there for you.",
    "The will of fire burns bright in every leaf village ninja.",
    "A true ninja never abandons their comrades in battle.",
    "Training every day builds strength that cannot be taken away.",
    "Protect what matters most with every fiber of your being.",
    "The path to greatness is paved with failures and lessons learned.",
    "Shadow clone jutsu is the ultimate technique of perseverance.",
    "To forge your own ninja way requires unwavering conviction.",
    "Courage is not the absence of fear but the triumph over it.",
    "Stand firm when the storm rages and never look back.",
    "True strength comes from protecting those who cannot fight.",
    "Every step taken forward brings you closer to your dream.",
    "My ninja way is simple: I never go back on my word.",
  ],

  // 2. SAKURA — Accuracy / Precision Control (16 texts)
  sakura: [
    "Channel chakra to the precise point of impact before striking.",
    "Medical ninjutsu requires delicate precision and extreme calm.",
    "A single wasted motion can compromise an entire surgical procedure.",
    "Control your breathing to synchronize mind and fingers perfectly.",
    "Precision always precedes power on the path of self master.",
    "Focus your chakra into your fingertips with total concentration.",
    "Deliberate practice transforms clumsy movements into deadly grace.",
    "Observe the enemy weak points and strike without hesitation.",
    "Inner strength develops quietly through countless patient drills.",
    "Do not hurry your keystrokes when surgical accuracy is required.",
    "Refining technique produces greater results than raw brute force.",
    "Steady hands and focused intent unlock extraordinary breakthroughs.",
    "Calibrate each finger to find its exact resting spot on the keys.",
    "Mastering chakra control demands relentless mental discipline.",
    "Patience in positioning creates unstoppable momentum in combat.",
    "Precision is the sharpest blade in a medical warrior arsenal.",
  ],

  // 3. ROCK LEE — Speed Check / Eight Gates (16 texts)
  "rock-lee": [
    "Run until your legs burn and then run ten miles further.",
    "A drop of sweat today prevents a river of tears tomorrow.",
    "Sprint forward with pure passion and never slacken your speed.",
    "Hard work can surpass natural genius through sheer persistence.",
    "Unlock the first gate and unleash the full power of youth.",
    "Faster fingers create relentless rhythm that shatters every barrier.",
    "Push through physical limits to discover boundless inner energy.",
    "Velocity is born from intense repetition and unwavering resolve.",
    "Strike like lightning before the opponent can even blink.",
    "The primary lotus requires lightning speed and fearless execution.",
    "Burn with youthful passion and push your typing cadence higher.",
    "Every single millisecond saved is a step toward unmatched mastery.",
    "When speed meets discipline no defense can remain unbroken.",
    "Exceed the speed of sight with thunderous key combinations.",
    "Keep moving forward with burning determination in your chest.",
    "A passionate heart can run faster than any wind that blows.",
  ],

  // 4. KAKASHI — Consistency / Copy Ninja (16 texts)
  kakashi: [
    "Those who break the rules are scum but those who abandon comrades are worse.",
    "Read the battlefield calmly and adjust your pace to the tactical rhythm.",
    "Consistency in execution separates master shinobi from amateurs.",
    "Maintain uniform speed across all characters to prevent errors.",
    "A true leader remains composed even amidst chaotic battlefield storms.",
    "Copy the movements of masters until they become second nature.",
    "Balance offense and defense with seamless transitions between words.",
    "Steady flow state yields far higher output than sudden frantic bursts.",
    "Anticipate the next combination while completing the current sequence.",
    "The lightning blade strikes true only when wielded with steady intent.",
    "Patience and timing dictate the outcome of high level encounters.",
    "Disciplined cadence conserves stamina over extended typing trials.",
    "Observe carefully before committing your hands to rapid motion.",
    "A calm spirit allows the mind to react without unnecessary panic.",
    "Seamless consistency turns difficult sentences into effortless art.",
    "True tactical mastery lies in repeating brilliance without mistake.",
  ],

  // 5. SASUKE — Combo Scaling / Flow Mastery (16 texts)
  sasuke: [
    "Focus your gaze through the sharingan to track each coming strike.",
    "A single break in your combo exposes you to devastating counter attacks.",
    "Channel dark lightning through every fingertip in fluid succession.",
    "Unbroken rhythm creates an overwhelming surge of kinetic momentum.",
    "Perfection is not an option when vengeance guides your resolve.",
    "Connect phrase to phrase without pausing to maintain supreme pressure.",
    "The sharingan perceives keystrokes long before the hand makes contact.",
    "Chain your strikes together until the adversary has no room to breathe.",
    "Flawless execution turns separate strikes into a raging storm.",
    "Hesitation is fatal against an opponent who never misses a beat.",
    "Let the current of electricity flow uninterrupted through your hands.",
    "A master swordsman connects fifty cuts without resetting his stance.",
    "Hold the streak alive through difficult clusters and complex words.",
    "The chidori hums with relentless power when the flow is sustained.",
    "Break through limits by maintaining unbreakable combo strings.",
    "My eyes see through all deception; strike without breaking stride.",
  ],

  // 6. ITACHI — Precision & Focus / Genjutsu (21 texts with punctuation, apostrophes, capitals, semicolons)
  itachi: [
    "People live their lives bound by what they accept as correct and true.",
    "Those who cannot acknowledge themselves; they are the ones who will fail.",
    "We do not know what kind of people we truly are, until the moment before death.",
    "Reality is merely an illusion; what you see isn't always what exists.",
    "Even the strongest opponent always has a weakness; you only need to look closely.",
    "It is not wise to judge others based on your own preconceptions.",
    "True victory isn't about defeating others; it's about conquering your own mind.",
    "Self-sacrifice is the hallmark of an unheralded shinobi who guards from shadows.",
    "Behind every calm gaze lies a mind that has weighed ten thousand possibilities.",
    "Don't lose your focus when punctuation disrupts your familiar keystroke pattern.",
    "Every solitary leaf carried by the autumn wind; it has its own quiet path.",
    "A heart clouded by arrogance cannot perceive the truth of the world.",
    "The sharingan sees through illusions; can your fingers see through hesitation?",
    "Knowledge and awareness are vague, and perhaps better called illusions.",
    "Never forget: the village isn't protected by words, but by silent sacrifices.",
    "Balance each keystroke with care; haste is the parent of foolish mistakes.",
    "You focus so much on the darkness ahead, you fail to see the light beside you.",
    "To accept pain without bitterness is the highest mark of spiritual discipline.",
    "Commas, periods, and capitals; each symbol demands your complete respect.",
    "The moon reflects cold sorrow upon the lake, yet the water remains still.",
    "No matter how dark the night seems; dawn will always pierce through the veil.",
  ],

  // 7. PAIN — Endurance / Six Paths (21 texts with deep endurance length)
  pain: [
    "Those who do not understand true pain can never understand true peace.",
    "Justice is a concept born from subjective vengeance masquerading as virtue.",
    "To bring order to this fractured world requires enduring trials beyond mortal measure.",
    "Endurance is the quiet forge where raw spirit is hammered into unbreakable steel.",
    "When you experience the agony of loss, only then do you comprehend another's suffering.",
    "The world is caught in an endless cycle of hatred that only profound sacrifice can break.",
    "Keep typing through the fatigue, for true fortitude reveals itself in the final moments.",
    "Six paths converge upon a single destiny; maintain your rhythm through every trial.",
    "Almighty push repels all shallow effort; only persistent mastery can withstand this weight.",
    "Even the most majestic towers crumble if their foundations are built upon impatient clay.",
    "Learn to embrace discomfort, because growth never occurs within the shelter of ease.",
    "The rain falls ceaselessly upon the Hidden Rain village, washing away tears of the fallen.",
    "Long sentences test whether your concentration can outlast the burning in your forearms.",
    "A leader must bear the collective sorrow of his people without flinching from duty.",
    "Do not break your posture when exhaustion whispers that you have already done enough.",
    "Through relentless practice, what once felt impossible becomes natural as drawing breath.",
    "Faith without disciplined action is nothing more than wishful thinking in the dark.",
    "Every keystroke typed with intent is a brick in the foundation of your personal mastery.",
    "The path of peace is steep and treacherous, demanding unwavering focus at every turn.",
    "Endure the storm with steady hands; the clouds must eventually part before the sun.",
    "Feel pain, contemplate pain, accept pain, know pain, and let your fingers rise above it.",
  ],

  // 8. MADARA — Final Boss / Calamity (26 texts: short, medium, long, complex)
  madara: [
    "Wake up to reality!",
    "In this world, wherever there is light, there are always shadows to be found.",
    "As long as the concept of winners exists, there must also be losers.",
    "The selfish desire to maintain peace causes wars, and hatred is born to protect love.",
    "Would you like these clones to use Susanoo or not?",
    "Power is not will; it is the phenomenon of physically making things happen.",
    "Do not misunderstand: this is not power of your creation, but the result of my design.",
    "The concept of hope is nothing more than giving up; a word that holds no true meaning.",
    "A shinobi's worth is proven in the heat of catastrophic battle, not in peaceful dreams.",
    "When a man learns to love, he must bear the risk of hatred; such is the curse of our blood.",
    "He who hesitates at the precipice of greatness shall be swallowed by the yawning abyss.",
    "Meteorites fall from the heavens not by chance, but by the command of absolute willpower.",
    "Speed alone cannot save you from the blade of a warrior who anticipated your arrival.",
    "Accuracy without stamina is a candle in a gale; it gutters out when tested by real storms.",
    "I have witnessed empires rise and crumble into dust; your keystrokes are but fleeting sparks.",
    "Let the celestial chakra envelop the battlefield and test the limits of mortal resolve.",
    "Two halves of the sage's power reunited at last: the divine tree shall bloom once more.",
    "Do you truly believe your fragile mortal fingers can match the cadence of a god?",
    "Every keystroke must carry weight; trivial speed without precision is meaningless noise.",
    "The perfect Susanoo stands as an insurmountable wall between ambition and reality.",
    "Stand tall amidst the falling sky, or be crushed into dust beneath the heavens.",
    "Ten-Tails Jinchuriki awakening; the ultimate trial of human perseverance has begun.",
    "Surpass your previous self with every keystroke, or be swept aside by the storm.",
    "Infinite Tsukuyomi casts its eternal glow upon those who surrendered their resolve.",
    "True legends are not born in comfort; they are forged in the crucible of impossible battles.",
    "Forge your destiny now: strike with supreme speed, flawless precision, and unbreakable spirit!",
  ],

  default: [
    "The quick brown fox jumps over the lazy dog with great speed.",
    "Practice makes perfect when you dedicate time every single day.",
    "Focus on each character and let your fingers find their rhythm.",
    "Typing fast requires both accuracy and consistent daily practice.",
    "Every expert was once a beginner who refused to give up.",
  ],
}

export const BATTLE_TEXTS_PT_BR: Record<string, string[]> = {
  // 1. NARUTO — Equilibrado / Fundamentos (16 textos)
  naruto: [
    "O ninja corre velozmente pela aldeia oculta ao amanhecer.",
    "Trabalho duro e determinação são as chaves para se tornar hokage.",
    "Nunca desista, não importa o quão difícil o caminho possa parecer.",
    "Acredite em si mesmo e seus amigos sempre estarão ao seu lado.",
    "A vontade do fogo queima intensamente em cada ninja da aldeia da folha.",
    "Um verdadeiro ninja nunca abandona seus companheiros de batalha.",
    "Treinar todos os dias constrói uma força que ninguém pode tirar.",
    "Proteja o que mais importa com cada fibra do seu ser.",
    "O caminho para a grandeza é pavimentado com falhas e lições aprendidas.",
    "O jutsu clone das sombras é a técnica definitiva da perseverança.",
    "Forjar seu próprio caminho ninja exige uma convicção inabalável.",
    "Coragem não é a ausência de medo, mas o triunfo sobre ele.",
    "Fique firme quando a tempestade rugir e nunca olhe para trás.",
    "A verdadeira força vem de proteger aqueles que não podem lutar.",
    "Cada passo dado para a frente aproxima você do seu grande sonho.",
    "Meu jeito ninja é simples: eu nunca volto atrás com a minha palavra.",
  ],

  // 2. SAKURA — Precisão e Controle Cirúrgico (16 textos)
  sakura: [
    "Canalize o chakra para o ponto exato de impacto antes de golpear.",
    "O ninjutsu médico exige extrema precisão e serenidade absoluta.",
    "Um único movimento desperdiçado pode comprometer todo o procedimento cirúrgico.",
    "Controle sua respiração para sincronizar mente e dedos com perfeição.",
    "A precisão sempre precede o poder no caminho do autoaperfeiçoamento.",
    "Concentre seu chakra nas pontas dos dedos com concentração total.",
    "A prática deliberada transforma movimentos desajeitados em graça mortal.",
    "Observe os pontos fracos do inimigo e ataque sem qualquer hesitação.",
    "A força interior se desenvolve silenciosamente através de treinos pacientes.",
    "Não tenha pressa nas teclas quando a exatidão cirúrgica for exigida.",
    "Refinar a técnica produz resultados muito maiores que a força bruta.",
    "Mãos firmes e intenção focada desbloqueiam avanços extraordinários.",
    "Calibre cada dedo para encontrar sua posição de repouso perfeita nas teclas.",
    "Dominar o controle de chakra exige uma disciplina mental implacável.",
    "A paciência no posicionamento cria um ritmo invencível em combate.",
    "A precisão é a lâmina mais afiada no arsenal de um guerreiro médico.",
  ],

  // 3. ROCK LEE — Velocidade e Portões Internos (16 textos)
  "rock-lee": [
    "Corra até suas pernas queimarem e depois corra mais dez quilômetros.",
    "Uma gota de suor hoje evita um rio de lágrimas no dia de amanhã.",
    "Avance velozmente com pura paixão e nunca diminua sua velocidade.",
    "O trabalho duro pode superar o talento natural com persistência pura.",
    "Abra o primeiro portão e liberte todo o poder da juventude.",
    "Dedos mais rápidos criam um ritmo implacável que destrói qualquer barreira.",
    "Ultrapasse os limites físicos para descobrir uma energia interna sem fim.",
    "A velocidade nasce da repetição intensa e da determinação inabalável.",
    "Golpeie como um raio antes que o oponente consiga piscar os olhos.",
    "A lótus primária exige velocidade fulminante e execução sem medo.",
    "Queime com o ardor da juventude e eleve sua cadência de digitação ao máximo.",
    "Cada milissegundo economizado é um passo em direção à maestria absoluta.",
    "Quando a velocidade encontra a disciplina, nenhuma defesa permanece em pé.",
    "Supere a velocidade da visão com combinações estrondosas de teclas.",
    "Continue se movendo para frente com determinação ardente em seu peito.",
    "Um coração apaixonado consegue correr mais rápido que qualquer vendaval.",
  ],

  // 4. KAKASHI — Consistência Tática e Ninja Copiador (16 textos)
  kakashi: [
    "Aqueles que quebram as regras são lixo, mas quem abandona companheiros é pior.",
    "Leia o campo de batalha calmamente e ajuste seu ritmo à estratégia.",
    "A consistência na execução separa os mestres shinobi dos aprendizes.",
    "Mantenha uma velocidade uniforme em todos os caracteres para evitar erros.",
    "Um verdadeiro líder permanece sereno mesmo no caos da tempestade.",
    "Copie os movimentos dos grandes mestres até que se tornem sua segunda natureza.",
    "Equilibre ataque e defesa com transições suaves e contínuas entre as palavras.",
    "O estado de fluxo constante produz muito mais rendimento que impulsos frenéticos.",
    "Antecipe a próxima combinação enquanto completa a sequência atual.",
    "A lâmina de relâmpago atinge o alvo apenas quando empunhada com firmeza.",
    "Paciência e sincronia ditam o resultado dos confrontos de alto nível.",
    "Uma cadência disciplinada poupa estamina durante os longos desafios de digitação.",
    "Observe com cautela antes de comprometer suas mãos com movimentos velozes.",
    "Um espírito sereno permite que a mente reaja sem pânico desnecessário.",
    "A consistência perfeita transforma frases difíceis em pura arte sem esforço.",
    "A verdadeira maestria tática consiste em repetir o brilhantismo sem errar.",
  ],

  // 5. SASUKE — Combos Ininterruptos e Sharingan (16 textos)
  sasuke: [
    "Foque seu olhar através do sharingan para prever cada golpe que se aproxima.",
    "Uma única falha no combo expõe você a contra-ataques devastadores.",
    "Canalize o relâmpago sombrio pela ponta dos dedos em sucessão fluida.",
    "O ritmo ininterrupto gera uma onda avassaladora de energia cinética.",
    "A perfeição não é negociável quando a determinação guia seus passos.",
    "Conecte frase após frase sem pausas para manter uma pressão implacável.",
    "O sharingan percebe os toques nas teclas muito antes do contato da mão.",
    "Encadeie seus golpes até que o adversário não tenha espaço para respirar.",
    "A execução impecável transforma golpes isolados em uma tempestade furiosa.",
    "A hesitação é fatal contra um adversário que nunca perde o compasso.",
    "Deixe a corrente elétrica fluir sem interrupções através de suas mãos.",
    "Um mestre espadachim conecta cinquenta cortes sem desmanchar a postura.",
    "Mantenha a sequência viva através de padrões difíceis e palavras complexas.",
    "O chidori vibra com força implacável quando o fluxo se mantém estável.",
    "Rompa todos os limites sustentando combos inquebráveis até a vitória.",
    "Meus olhos enxergam através de qualquer ilusão; golpeie sem hesitar.",
  ],

  // 6. ITACHI — Precisão, Pontuação e Acentuação / Genjutsu (21 textos)
  itachi: [
    "As pessoas vivem suas vidas presas ao que aceitam como correto e verdadeiro.",
    "Aqueles que não conseguem reconhecer a si mesmos; são os que irão falhar.",
    "Não sabemos que tipo de pessoas realmente somos, até o instante que antecede a morte.",
    "A realidade é mera ilusão; aquilo que seus olhos veem nem sempre é o que existe.",
    "Mesmo o adversário mais poderoso possui uma fraqueza; basta observar com atenção.",
    "Não é prudente julgar os outros baseando-se apenas em seus próprios preconceitos.",
    "A verdadeira vitória não consiste em derrotar outros; reside em conquistar a própria mente.",
    "O auto-sacrifício é a marca registrada de um shinobi que protege a partir das sombras.",
    "Por trás de cada olhar sereno existe uma mente que avaliou dez mil possibilidades.",
    "Não perca o foco quando a pontuação romper o padrão habitual de seus movimentos.",
    "Cada folha solitária soprada pelo vento de outono; segue seu próprio destino silencioso.",
    "Um coração nublado pela arrogância não consegue contemplar a verdade do mundo.",
    "O sharingan enxerga através das ilusões; será que seus dedos enxergam além da hesitação?",
    "Conhecimento e percepção são conceitos vagos, talvez melhor definidos como ilusões.",
    "Nunca se esqueça: a aldeia não é protegida por palavras vãs, mas por sacrifícios calados.",
    "Equilibre cada toque com prudência; a pressa desmedida é a mãe dos erros tolos.",
    "Você foca tanto na escuridão à frente, que se esquece da luz que brilha ao seu redor.",
    "Aceitar a dor sem guardar rancor é a mais nobre demonstração de maturidade espiritual.",
    "Vírgulas, pontos e acentos; cada símbolo gráfico exige o seu mais profundo respeito.",
    "A lua reflete uma tristeza gélida sobre o lago límpido, mas as águas continuam imóveis.",
    "Não importa o quão densa pareça a noite; a aurora sempre rasgará o véu das trevas.",
  ],

  // 7. PAIN — Resistência e Seis Caminhos (21 textos)
  pain: [
    "Aqueles que não compreendem a verdadeira dor jamais poderão compreender a verdadeira paz.",
    "A justiça é um conceito frágil nascido de uma vingança pessoal disfarçada de virtude moral.",
    "Para restaurar a ordem neste mundo fragmentado é necessário suportar provações além dos limites mortais.",
    "A resistência é a forja silenciosa onde o espírito bruto é martelado até se transformar em aço inquebrável.",
    "Somente quando você vivencia a agonia da perda é que passa a compreender o sofrimento alheio.",
    "A humanidade está presa em um ciclo interminável de ódio que apenas um sacrifício profundo pode romper.",
    "Continue digitando apesar da fadiga muscular, pois a verdadeira fortaleza se revela nos momentos derradeiros.",
    "Seis caminhos distintos convergem para um único destino; sustente sua cadência através de cada provação.",
    "A força celestial do Shinra Tensei repele esforços superficiais; apenas a maestria constante resiste a esse peso.",
    "Mesmo as fortalezas mais imponentes desmoronam caso seus alicerces tenham sido erguidos sobre solo impaciente.",
    "Aprenda a acolher o desconforto, pois a evolução genuína jamais acontece sob a proteção do comodismo.",
    "A chuva torrencial cai incessantemente sobre a Aldeia da Chuva, lavando as lágrimas dos guerreiros tombados.",
    "Frases extensas testam se a sua concentração mental é capaz de superar a queimação nos braços e pulsos.",
    "Um verdadeiro líder deve carregar a dor coletiva de seu povo sem recuar diante de suas obrigações solenes.",
    "Não abandone sua postura quando a exaustão sussurrar aos seus ouvidos que você já realizou o suficiente.",
    "Através da repetição disciplinada, aquilo que antes parecia inalcançável torna-se tão natural quanto respirar.",
    "A fé desprovida de ação contínua não passa de uma ilusão ingênua alimentada na mais profunda escuridão.",
    "Cada caractere digitado com firmeza representa um tijolo sólido na construção do seu domínio pessoal.",
    "O caminho que conduz à serenidade é árduo e implacável, exigindo foco absoluto a cada instante do percurso.",
    "Suporte a tempestade com mãos inabaláveis; as nuvens carregadas fatalmente se dissiparão diante do sol.",
    "Sinta a dor, contemple a dor, aceite a dor, compreenda a dor, e faça seus dedos se elevarem acima de qualquer sofrimento.",
  ],

  // 8. MADARA — Calamidade Final (26 textos)
  madara: [
    "Acorde para a realidade!",
    "Neste mundo, onde quer que haja luz, sempre haverá sombras a serem encontradas.",
    "Enquanto o conceito de vencedores existir, também haverá perdedores condenados.",
    "O desejo egoísta de manter a paz provoca guerras, e o ódio nasce com o propósito de proteger o amor.",
    "Vocês gostariam que esses clones das sombras usassem o Susanoo ou não?",
    "Poder não é mera vontade; é o fenômeno inexorável de fazer as coisas acontecerem na realidade física.",
    "Não se engane: isto não é uma força concebida por você, mas a consequência direta do meu próprio plano.",
    "O conceito de esperança não passa de uma forma covarde de desistência; uma palavra sem significado real.",
    "O verdadeiro valor de um shinobi se prova no calor abrasador da guerra, não em sonhos pacíficos e vazios.",
    "Quando um ser humano aprende a amar, assume inevitavelmente o risco do ódio; tal é a maldição de nossa linhagem.",
    "Aquele que hesita diante do abismo da grandeza certamente será engolido pelas profundezas da mediocridade.",
    "Meteoros não despencam dos céus por simples coincidência, mas sob o comando irrevogável de uma vontade absoluta.",
    "A velocidade pura jamais salvará você da lâmina afiada de um guerreiro que já previa sua aproximação.",
    "A precisão sem resistência física é como uma vela exposta ao vendaval; ela se apaga na primeira tormenta real.",
    "Eu presenciei impérios colossais erguerem-se e virarem pó; suas batidas de tecla são apenas faíscas efêmeras.",
    "Deixe o chakra celestial cobrir o campo de combate e colocar à prova a firmeza da determinação mortal.",
    "As duas metades do poder supremo do Sábio reunidas enfim: a árvore divina florescerá mais uma vez sobre a terra.",
    "Você realmente acredita que seus dedos mortais e frágeis conseguem acompanhar o compasso implacável de um deus?",
    "Cada tecla pressionada precisa carregar convicção; velocidade vazia sem controle é apenas ruído sem valor.",
    "O Susanoo perfeito ergue-se como uma barreira intransponível entre a sua ambição cega e a dura realidade.",
    "Mantenha-se altivo enquanto o céu desaba ao seu redor, ou seja esmagado em definitivo sob o peso celestial.",
    "O despertar do Jinchuriki do Dez-Caudas começou; o teste supremo da perseverança humana acaba de ser deflagrado.",
    "Supere seus limites a cada sequência de digitação, ou será varrido impiedosamente para fora da história.",
    "O Tsukuyomi Infinito estende seu brilho perpétuo sobre todos aqueles que renunciaram à própria coragem.",
    "Lendas verdadeiras não são moldadas no conforto do repouso; elas são forjadas na fornalha de batalhas impossíveis.",
    "Forje seu próprio destino agora: ataque com velocidade suprema, precisão cirúrgica e espírito inquebrável!",
  ],

  default: [
    "A rápida raposa marrom pula sobre o cão preguiçoso com enorme agilidade.",
    "A prática constante leva à perfeição quando você se dedica todos os dias.",
    "Concentre-se em cada caractere e permita que seus dedos encontrem o ritmo.",
    "Digitar com velocidade exige precisão cirúrgica e treino diário dedicado.",
    "Todo grande mestre um dia foi um iniciante que se recusou a desistir.",
  ],
}

// Backward compatibility default
export const BATTLE_TEXTS = BATTLE_TEXTS_EN

/**
 * Retrieves the sentence pool for a given character and locale.
 * Falls back to default pool if character ID is not recognized.
 */
export function getTextsForCharacter(characterId: string, locale: Locale = "en"): string[] {
  const pool = locale === "pt-BR" ? BATTLE_TEXTS_PT_BR : BATTLE_TEXTS_EN
  return pool[characterId] ?? pool["default"] ?? BATTLE_TEXTS_EN["default"]
}

/**
 * Alias for getTextsForCharacter
 */
export const getTextsForEnemy = getTextsForCharacter

/**
 * Returns all texts across the pool for specific testing or training purposes.
 */
export function getAllBattleTexts(locale: Locale = "en"): string[] {
  const pool = locale === "pt-BR" ? BATTLE_TEXTS_PT_BR : BATTLE_TEXTS_EN
  const all: string[] = []
  for (const list of Object.values(pool)) {
    all.push(...list)
  }
  return all
}
