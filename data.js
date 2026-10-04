/* ============================================================================
   VOTEZ BIEN ! — data.js
   Toutes les données du questionnaire : dimensions, questions, banque
   diagnostique, partis. Fichier séparé de la logique (scoring.js) et de
   l’affichage (app.js) pour rester facile à mettre à jour.

   CONVENTION DE SIGNE (unique dans tout le projet — voir PARTIE 8 du cahier
   des charges) :
     - Chaque question oppose une proposition A et une proposition B.
     - La réponse est un entier de -2 à +2 :
         -2 = « Beaucoup plus A »   -1 = « Plutôt A »   0 = « Entre les deux »
         +1 = « Plutôt B »          +2 = « Beaucoup plus B »
       (« Je ne sais pas » n’est PAS 0 : c’est une absence de valeur, exclue
       du calcul de moyenne — voir scoring.js.)
     - Pour CHAQUE dimension, la proposition A est TOUJOURS celle qui va vers
       labelLeft (le pôle conventionnellement associé à la gauche) et la
       proposition B TOUJOURS celle qui va vers labelRight (le pôle
       conventionnellement associé à la droite). Un score négatif = plus
       proche du pôle « gauche » ; un score positif = plus proche du pôle
       « droite ». C’est la seule convention utilisée partout (calcul,
       couleurs, curseur, textes).
     - Limite méthodologique assumée : sur les dimensions Autorité,
       Europe et Immigration, l’axe mesuré (libéral/autoritaire,
       intégration/souveraineté, ouverture/contrôle) ne recoupe pas
       toujours le clivage gauche-droite classique (ex. souverainisme de
       gauche et de droite). Voir le champ `note` de chaque dimension et
       l’écran « Méthode » de l’application.
   ========================================================================= */

const DIMENSIONS = {
  eco: {
    id: 'eco',
    name: 'Économie & redistribution',
    short: 'Économie',
    plain: 'Ce que l’État doit faire pour l’économie et les inégalités : impôts, aides, protection des salariés.',
    labelLeft: 'Intervention publique & redistribution',
    labelRight: 'Liberté économique',
    weight: 0.24,
    color: '#c2410c',
    note: null
  },
  soc: {
    id: 'soc',
    name: 'Société & libertés',
    short: 'Société',
    plain: 'Les règles de la vie en société : libertés individuelles, égalité, évolution des modes de vie.',
    labelLeft: 'Transformation sociale & libertés',
    labelRight: 'Continuité & règles communes',
    weight: 0.16,
    color: '#a21caf',
    note: null
  },
  auth: {
    id: 'auth',
    name: 'Autorité, sécurité & pouvoir',
    short: 'Autorité',
    plain: 'Sécurité, justice et équilibre des pouvoirs : jusqu’où l’État doit contrôler, sanctionner et décider vite.',
    labelLeft: 'Prévention & contre-pouvoirs',
    labelRight: 'Fermeté & pouvoir exécutif fort',
    weight: 0.16,
    color: '#0f172a',
    note: 'Cette dimension inclut des questions sur les institutions (contre-pouvoirs, pouvoirs exceptionnels). Elle mesure surtout un axe libéral / autoritaire, qui recoupe partiellement seulement le clivage gauche-droite classique.'
  },
  europe: {
    id: 'europe',
    name: 'Europe & souveraineté',
    short: 'Europe',
    plain: 'La place de l’Union européenne : décider à plusieurs pays, ou garder plus de décisions au niveau français (la souveraineté, c’est décider par soi-même).',
    labelLeft: 'Intégration européenne',
    labelRight: 'Souveraineté nationale',
    weight: 0.14,
    color: '#1d4ed8',
    note: 'Le souverainisme existe aussi bien à gauche (critique des traités européens) qu’à droite (Frexit) : un score « souveraineté » ne signifie pas la même chose selon le reste du profil.'
  },
  immig: {
    id: 'immig',
    name: 'Immigration & ouverture',
    short: 'Immigration',
    plain: 'Combien de personnes étrangères accueillir, dans quelles conditions, et comment les intégrer.',
    labelLeft: 'Ouverture & intégration',
    labelRight: 'Contrôle & restriction',
    weight: 0.14,
    color: '#0e7490',
    note: null
  },
  ecology: {
    id: 'ecology',
    name: 'Écologie & énergie',
    short: 'Écologie',
    plain: 'Comment et à quelle vitesse agir pour le climat et l’environnement, et avec quelles contraintes.',
    labelLeft: 'Transition accélérée',
    labelRight: 'Transition progressive',
    weight: 0.16,
    color: '#15803d',
    note: null
  }
};

const DIM_KEYS = Object.keys(DIMENSIONS);

/* ----------------------------------------------------------------------
   QUESTIONS PRINCIPALES — 21 questions, réparties pour ne pas favoriser
   une famille politique par un nombre de questions déséquilibré :
   Économie 4 · Société 3 · Autorité 4 · Europe 3 · Immigration 3 · Écologie 4
   ------------------------------------------------------------------- */
const QUESTIONS = [
  { id:'eco-1', dim:'eco', topic:'Impôts', plain:'Le patrimoine, c’est ce que l’on possède : logement, épargne, placements, entreprise…',
    a:'Les personnes ayant les revenus et patrimoines les plus élevés devraient contribuer davantage au financement collectif.',
    b:'Il faut plutôt limiter les prélèvements, y compris pour les plus hauts revenus.',
    why:'Cette question mesure votre préférence entre plus de redistribution et des impôts plus limités.' },
  { id:'eco-2', dim:'eco', topic:'Services publics', plain:'La dépense publique, c’est l’argent dépensé par l’État et les collectivités : santé, école, police, aides…',
    a:'Il faut augmenter les moyens des services publics (santé, école…), même si cela coûte plus cher.',
    b:'Il faut d’abord maîtriser la dépense publique et rechercher plus d’efficacité.',
    why:'Cette question mesure l’arbitrage entre renforcer les services publics et maîtriser la dépense.' },
  { id:'eco-3', dim:'eco', topic:'Travail', plain:'Protéger les salariés : par exemple des contrats stables et des règles de licenciement. Plus de souplesse : des règles plus légères pour embaucher ou licencier.',
    a:'Il faut mieux protéger les salariés, même si cela crée davantage de règles pour les entreprises.',
    b:'Il faut donner plus de souplesse aux entreprises pour faciliter l’embauche.',
    why:'Cette question mesure l’arbitrage entre protection des salariés et flexibilité du travail.' },
  { id:'eco-4', dim:'eco', topic:'Économie',
    a:'L’État doit intervenir activement pour orienter l’économie et réduire les inégalités.',
    b:'L’État doit surtout fixer des règles simples et laisser faire les entreprises et les individus.',
    why:'Cette question mesure la place que vous donnez à l’intervention publique dans l’économie.' },

  { id:'soc-1', dim:'soc', topic:'Égalité', plain:'Les territoires : quartiers, campagnes, villes moyennes, outre-mer…',
    a:'L’action publique doit réduire les écarts réels entre les groupes sociaux et les territoires.',
    b:'Elle doit surtout garantir les mêmes règles et les mêmes chances à chacun, sans viser un résultat précis.',
    why:'Il existe plusieurs façons de concevoir l’égalité : agir sur les résultats, ou garantir des règles communes.' },
  { id:'soc-2', dim:'soc', topic:'Société',
    a:'Les lois doivent pouvoir évoluer rapidement quand les modes de vie et les mentalités changent.',
    b:'Il vaut mieux préserver les repères et les traditions déjà établis.',
    why:'Cette question mesure votre préférence entre le changement social et la continuité.' },
  { id:'soc-3', dim:'soc', topic:'Libertés',
    a:'La liberté individuelle doit primer, sauf nécessité clairement établie.',
    b:'Une règle commune peut primer sur la liberté individuelle lorsqu’elle protège la cohésion collective.',
    why:'Cette question mesure le poids que vous donnez à l’autonomie individuelle face aux règles communes.' },

  { id:'auth-1', dim:'auth', topic:'Sécurité', plain:'La réinsertion, c’est aider une personne condamnée à retrouver une place dans la société (emploi, logement…).',
    a:'Pour réduire la délinquance, il faut d’abord prévenir, accompagner et favoriser la réinsertion.',
    b:'Pour réduire la délinquance, il faut d’abord renforcer les sanctions et la présence des forces de l’ordre.',
    why:'Cette question oppose deux priorités différentes en matière de sécurité.' },
  { id:'auth-2', dim:'auth', topic:'Libertés publiques', plain:'Pouvoirs de surveillance : écoutes, fichiers, caméras, accès aux données personnelles…',
    a:'Il faut limiter les pouvoirs de surveillance de l’État pour protéger les libertés, même si cela complique certains contrôles.',
    b:'Il faut accepter davantage de moyens de surveillance et de contrôle lorsqu’ils renforcent la sécurité.',
    why:'Cette question mesure l’arbitrage entre protection des libertés et pouvoirs de contrôle de l’État.' },
  { id:'auth-3', dim:'auth', topic:'Justice', plain:'La récidive, c’est commettre une nouvelle infraction après une première condamnation. Dissuader, c’est décourager d’autres personnes de le faire.',
    a:'Une peine doit d’abord viser à réduire le risque de récidive et permettre la réinsertion.',
    b:'Une peine doit d’abord sanctionner l’acte commis et dissuader fermement.',
    why:'Cette question distingue deux priorités possibles pour la politique pénale.' },
  { id:'auth-4', dim:'auth', topic:'Institutions',
    a:'Il faut renforcer les contre-pouvoirs (Parlement, justice, médias) face à l’exécutif, même si cela ralentit les décisions.',
    b:'Il faut permettre à un pouvoir exécutif élu de décider et d’agir plus rapidement, avec moins de contraintes.',
    why:'Cette question mesure votre préférence entre plus de contrôle sur l’exécutif et plus de rapidité d’action.',
    clarifyA:'« Contre-pouvoirs » : les institutions qui peuvent limiter ou contrôler l’action du gouvernement (Parlement, justice, presse…).' },

  { id:'europe-1', dim:'europe', topic:'Europe', plain:'Aujourd’hui, certaines décisions se prennent à Paris et d’autres à Bruxelles (règles de concurrence, monnaie, commerce…).',
    a:'Il faut transférer davantage de décisions et de moyens au niveau européen pour les sujets qui dépassent les frontières.',
    b:'Il faut garder davantage de décisions et de moyens au niveau français.',
    why:'Cette question mesure la place que vous donnez à l’intégration européenne.' },
  { id:'europe-2', dim:'europe', topic:'Souveraineté budgétaire', plain:'L’Union européenne fixe des limites au déficit (quand l’État dépense plus qu’il ne reçoit) et à la dette (ce qu’il a emprunté) de ses États membres.',
    a:'La France doit respecter les règles budgétaires européennes communes, même lorsque cela impose des efforts.',
    b:'La France doit pouvoir s’écarter des règles budgétaires européennes lorsque ses priorités nationales l’exigent.',
    why:'Cette question précise votre position sur la marge de manœuvre budgétaire de la France au sein de l’Union européenne.' },
  { id:'europe-3', dim:'europe', topic:'Défense', plain:'Cadres communs : par exemple l’Union européenne ou l’OTAN (une alliance militaire).',
    a:'La France doit agir prioritairement dans des cadres communs (Europe, alliances), même si cela suppose des compromis.',
    b:'La France doit pouvoir décider seule de ses priorités de défense et de politique étrangère.',
    why:'Cette question mesure le poids donné à l’action commune par rapport à l’autonomie nationale en défense et diplomatie.' },

  { id:'immig-1', dim:'immig', topic:'Immigration', plain:'Un titre de séjour est l’autorisation officielle, donnée à une personne étrangère, de vivre en France.',
    a:'La France doit maintenir un contrôle des frontières tout en facilitant l’accueil et l’intégration des personnes qui s’installent durablement.',
    b:'La France doit réduire fortement les entrées et durcir les conditions d’accès au séjour.',
    why:'Cette question mesure votre orientation générale sur la politique migratoire.' },
  { id:'immig-2', dim:'immig', topic:'Asile',
    a:'Le droit d’asile doit rester largement garanti, avec des moyens suffisants pour l’examiner rapidement.',
    b:'L’accès à l’asile doit être davantage restreint et conditionné.',
    why:'Cette question précise votre position sur le droit d’asile, distinct de l’immigration économique ou familiale.',
    clarifyA:'Le droit d’asile protège les personnes qui fuient une persécution ou un danger grave dans leur pays.' },
  { id:'immig-3', dim:'immig', topic:'Intégration', plain:'La nationalité française est le statut de citoyen français : elle donne notamment le droit de vote.',
    a:'L’accès à la nationalité française doit rester relativement accessible pour les personnes intégrées.',
    b:'L’accès à la nationalité française doit être rendu plus difficile et plus sélectif.',
    why:'Cette question précise votre position sur les conditions d’accès à la nationalité.' },

  { id:'ecology-1', dim:'ecology', topic:'Climat', plain:'La transition écologique, c’est passer d’une économie très dépendante du pétrole, du gaz et du charbon à une économie qui émet moins de gaz à effet de serre.',
    a:'Il faut accepter des changements et des contraintes plus importants pour accélérer la transition écologique.',
    b:'Il faut avancer plus progressivement pour limiter les contraintes économiques et sociales.',
    why:'Cette question mesure le rythme de transition écologique que vous privilégiez.' },
  { id:'ecology-2', dim:'ecology', topic:'Écologie', plain:'La compétitivité, c’est la capacité des entreprises françaises à vendre face à leurs concurrents étrangers.',
    a:'Il faut renforcer les obligations environnementales des entreprises, même si cela a un coût économique.',
    b:'Il faut limiter les nouvelles contraintes environnementales pour préserver la compétitivité.',
    why:'Cette question mesure l’arbitrage entre régulation environnementale et compétitivité économique.' },
  { id:'ecology-3', dim:'ecology', topic:'Agriculture',
    a:'Il faut accélérer la transformation des pratiques agricoles pour réduire leur impact environnemental.',
    b:'Il faut d’abord préserver la production et le revenu agricoles en limitant les nouvelles contraintes.',
    why:'Cette question mesure l’arbitrage entre transition écologique et continuité de la production agricole.' },
  { id:'ecology-4', dim:'ecology', topic:'Énergie & mobilités', plain:'La sobriété énergétique, c’est consommer moins d’énergie (chauffage, transports, appareils…).',
    a:'Il faut donner la priorité aux transports collectifs, au vélo et à la sobriété énergétique.',
    b:'Il faut d’abord garantir la liberté de déplacement individuel et un accès large à l’énergie.',
    why:'Cette question mesure votre priorité entre sobriété collective et liberté individuelle de déplacement.' }
];

/* ----------------------------------------------------------------------
   BANQUE DIAGNOSTIQUE — 36 questions (6 par dimension), utilisée pour la
   phase de précision (voir PARTIE 6). Jamais posées à tout le monde :
   scoring.js en sélectionne 8, sur les dimensions les plus
   incertaines et/ou jugées importantes par la personne. Sujets choisis
   pour ne jamais reformuler une question déjà posée dans QUESTIONS.
   ------------------------------------------------------------------- */
const BANK = [
  // — Économie (6) —
  { id:'bk-eco-1', dim:'eco', topic:'Succession', plain:'Une succession, ce sont les biens (argent, logement…) transmis aux héritiers après un décès.',
    a:'Il faut renforcer la taxation des successions les plus importantes.',
    b:'Il faut alléger la taxation des transmissions, y compris importantes.',
    why:'Cette question précise votre position sur la taxation du patrimoine transmis.' },
  { id:'bk-eco-2', dim:'eco', topic:'Salaire minimum',
    a:'Il faut revaloriser fortement le salaire minimum.',
    b:'Il faut limiter les hausses du salaire minimum pour ne pas freiner l’emploi.',
    why:'Cette question précise votre position sur le niveau du salaire minimum.' },
  { id:'bk-eco-3', dim:'eco', topic:'Aides aux entreprises',
    a:'Les aides publiques aux entreprises doivent être conditionnées à des engagements sociaux ou environnementaux.',
    b:'Les aides publiques aux entreprises doivent surtout soutenir l’investissement et l’emploi, sans condition supplémentaire.',
    why:'Cette question précise l’usage que vous privilégiez pour l’argent public versé aux entreprises.' },
  { id:'bk-eco-4', dim:'eco', topic:'Retraites', plain:'La durée de cotisation, c’est le nombre d’années de travail cotisées nécessaires pour toucher une retraite à taux plein.',
    a:'Pour financer les retraites, il faut d’abord chercher de nouvelles recettes plutôt que reculer l’âge de départ.',
    b:'Pour financer les retraites, il faut d’abord ajuster l’âge de départ ou la durée de cotisation.',
    why:'Cette question compare deux manières différentes de financer durablement les retraites.' },
  { id:'bk-eco-5', dim:'eco', topic:'Logement', plain:'Encadrer les loyers, c’est limiter par la loi le montant des loyers dans certaines zones. Le logement social est un logement à loyer réduit, réservé sous conditions de ressources.',
    a:'L’État doit renforcer la régulation du logement (encadrement des loyers, logement social).',
    b:'Il faut surtout faciliter la construction et l’investissement privés dans le logement.',
    why:'Cette question précise le rôle que vous voulez donner à l’État dans le logement.' },
  { id:'bk-eco-6', dim:'eco', topic:'Dette publique', plain:'La dette publique, c’est l’argent que l’État a emprunté. Le déficit, c’est quand il dépense plus qu’il ne reçoit sur une année.',
    a:'Il est acceptable d’augmenter temporairement la dette publique pour financer des priorités sociales ou d’investissement.',
    b:'Il faut réduire en priorité la dette et le déficit publics, même si cela limite certaines dépenses.',
    why:'Cette question précise votre arbitrage entre dette publique et priorités de dépense.' },

  // — Société (6) —
  { id:'bk-soc-1', dim:'soc', topic:'Laïcité', plain:'La laïcité, c’est la séparation de l’État et des religions : l’État est neutre et garantit à chacun la liberté de croire ou de ne pas croire.',
    a:'Dans l’espace public, la liberté de conscience doit primer, dans le respect de la loi.',
    b:'Certaines règles communes de neutralité doivent être renforcées dans l’espace public.',
    why:'Cette question précise votre rapport entre liberté de conscience et règles communes.' },
  { id:'bk-soc-2', dim:'soc', topic:'Fin de vie', plain:'Soins palliatifs : soins qui soulagent la douleur des personnes gravement malades en fin de vie. Aide active à mourir : permettre, sous conditions strictes, à une personne d’être aidée à mettre fin à sa vie.',
    a:'La loi doit permettre un accès plus large à une aide active à mourir, sous conditions strictes.',
    b:'La priorité doit d’abord aller au développement des soins palliatifs, avant d’élargir toute aide à mourir.',
    why:'Ce sujet fait l’objet d’un débat législatif actuel en France ; cette question mesure votre position sur cet équilibre.' },
  { id:'bk-soc-3', dim:'soc', topic:'Égalité femmes-hommes',
    a:'Il faut des mesures contraignantes (quotas, sanctions) pour accélérer l’égalité femmes-hommes.',
    b:'Il faut surtout garantir l’égalité des droits, sans mesures contraignantes supplémentaires.',
    why:'Cette question précise les moyens que vous privilégiez pour l’égalité femmes-hommes.' },
  { id:'bk-soc-4', dim:'soc', topic:'École', plain:'La carte scolaire affecte chaque élève à l’école, au collège ou au lycée de son secteur d’habitation. La mixité sociale, c’est la présence d’élèves de milieux différents dans une même classe.',
    a:'Il faut renforcer la mixité sociale dans les établissements scolaires, y compris en régulant davantage la carte scolaire.',
    b:'Il faut surtout laisser plus de liberté de choix aux familles dans l’orientation scolaire.',
    why:'Cette question précise votre position sur la mixité sociale à l’école.' },
  { id:'bk-soc-5', dim:'soc', topic:'Médias', plain:'Concentration des médias : quelques grands groupes possèdent une grande partie des journaux, chaînes de télévision et radios.',
    a:'Il faut renforcer les règles limitant la concentration des médias dans quelques grands groupes.',
    b:'Il faut surtout laisser le marché des médias s’organiser librement.',
    why:'Cette question précise votre position sur la régulation de la propriété des médias.' },
  { id:'bk-soc-6', dim:'soc', topic:'Discriminations', plain:'Le testing consiste à envoyer des candidatures identiques sous des noms ou profils différents pour repérer des discriminations.',
    a:'Il faut renforcer les dispositifs de lutte contre les discriminations (testing, sanctions).',
    b:'Les règles existantes contre les discriminations sont suffisantes.',
    why:'Cette question précise votre position sur les moyens de lutte contre les discriminations.' },

  // — Autorité (6) —
  { id:'bk-auth-1', dim:'auth', topic:'École & autorité',
    a:'L’autorité à l’école doit reposer d’abord sur le dialogue et l’accompagnement.',
    b:'L’autorité à l’école doit reposer d’abord sur des règles claires et des sanctions prévisibles.',
    why:'Cette question précise votre vision de l’autorité dans le cadre scolaire.' },
  { id:'bk-auth-2', dim:'auth', topic:'Vidéosurveillance', plain:'Vidéosurveillance algorithmique : des caméras dont les images sont analysées automatiquement par un logiciel (repérer un comportement, reconnaître un visage…).',
    a:'Il faut limiter le recours à la vidéosurveillance algorithmique et à la reconnaissance faciale dans l’espace public.',
    b:'Il faut développer ces outils pour renforcer la sécurité, sous contrôle des autorités.',
    why:'Cette question précise votre position sur les technologies de surveillance.' },
  { id:'bk-auth-3', dim:'auth', topic:'Détention', plain:'La détention provisoire, c’est l’emprisonnement d’une personne avant son jugement.',
    a:'Il faut réduire le recours à la détention provisoire et développer les alternatives à l’incarcération.',
    b:'Il faut construire davantage de places de prison et faciliter l’incarcération.',
    why:'Cette question précise votre position sur la politique carcérale.' },
  { id:'bk-auth-4', dim:'auth', topic:'Contrôles de police', plain:'Un récépissé est un document remis à la personne contrôlée, qui prouve qu’un contrôle a eu lieu.',
    a:'Il faut mieux encadrer les contrôles de police (récépissé, traçabilité) pour prévenir les abus.',
    b:'Il ne faut pas complexifier le travail des forces de l’ordre par des procédures supplémentaires.',
    why:'Cette question précise votre position sur l’encadrement des contrôles de police.' },
  { id:'bk-auth-5', dim:'auth', topic:'Pouvoirs exceptionnels', plain:'L’état d’urgence est un régime exceptionnel qui donne davantage de pouvoirs aux autorités (perquisitions, restrictions de circulation…) en cas de menace grave.',
    a:'Le recours à des pouvoirs exceptionnels ou à l’état d’urgence doit rester limité et strictement contrôlé par le Parlement.',
    b:'L’exécutif doit pouvoir recourir plus facilement à des pouvoirs exceptionnels face aux menaces.',
    why:'Cette question précise votre position sur l’équilibre des pouvoirs en temps de crise.' },
  { id:'bk-auth-6', dim:'auth', topic:'Drogues',
    a:'Il faut privilégier la prévention et le soin dans la lutte contre les drogues, plutôt que la seule répression.',
    b:'Il faut d’abord renforcer la répression du trafic et de la consommation de drogues.',
    why:'Cette question précise votre position sur la politique en matière de stupéfiants.' },

  // — Europe (6) —
  { id:'bk-europe-1', dim:'europe', topic:'Élargissement UE', plain:'Élargir l’Union européenne, c’est faire entrer de nouveaux pays (par exemple l’Ukraine ou des pays des Balkans).',
    a:'La France doit soutenir l’élargissement de l’Union européenne à de nouveaux pays.',
    b:'La France doit être prudente, voire s’opposer à de nouveaux élargissements de l’Union européenne.',
    why:'Cette question précise votre position sur l’élargissement de l’UE.' },
  { id:'bk-europe-2', dim:'europe', topic:'Zone euro', plain:'La zone euro, ce sont les pays qui utilisent l’euro. Une dette commune, c’est emprunter ensemble, au nom de plusieurs pays, plutôt que chacun de son côté.',
    a:'Il faut renforcer l’intégration budgétaire de la zone euro (budget commun, dette commune).',
    b:'Il faut limiter la mutualisation budgétaire entre pays de la zone euro.',
    why:'Cette question précise votre position sur l’intégration budgétaire européenne.' },
  { id:'bk-europe-3', dim:'europe', topic:'Commerce', plain:'Un accord commercial fixe les règles d’échanges (droits de douane, normes) entre des pays ou des groupes de pays.',
    a:'L’Union européenne doit négocier les accords commerciaux au nom de l’ensemble de ses membres.',
    b:'La France doit pouvoir peser davantage sur ses propres choix commerciaux, hors du cadre européen commun.',
    why:'Cette question précise votre position sur la politique commerciale.' },
  { id:'bk-europe-4', dim:'europe', topic:'Défense européenne',
    a:'Il faut construire une défense européenne commune, y compris une armée intégrée à terme.',
    b:'La défense doit rester d’abord une compétence nationale, articulée à des alliances choisies au cas par cas.',
    why:'Cette question précise votre position sur la construction d’une défense européenne commune.' },
  { id:'bk-europe-5', dim:'europe', topic:'Justice européenne', plain:'CJUE : la Cour de justice de l’Union européenne, qui interprète le droit de l’UE. CEDH : la Cour européenne des droits de l’homme (Conseil de l’Europe), qui juge le respect des droits fondamentaux.',
    a:'Les décisions des juridictions européennes (CJUE, CEDH) doivent continuer à s’imposer au droit français.',
    b:'La France doit pouvoir s’écarter des décisions des juridictions européennes lorsqu’elles contredisent des choix nationaux majeurs.',
    why:'Cette question précise votre position sur l’articulation entre droit français et droit européen.' },
  { id:'bk-europe-6', dim:'europe', topic:'Frontières Schengen', plain:'L’espace Schengen, c’est l’ensemble des pays européens où l’on franchit les frontières sans contrôle systématique.',
    a:'Il faut renforcer la gestion commune des frontières extérieures de l’Union européenne.',
    b:'Chaque pays doit retrouver un contrôle plus complet de ses propres frontières, y compris au sein de l’espace Schengen.',
    why:'Cette question précise votre position sur la gestion commune des frontières européennes.' },

  // — Immigration (6) —
  { id:'bk-immig-1', dim:'immig', topic:'Regroupement familial', plain:'Le regroupement familial permet à une personne étrangère installée légalement en France de faire venir son conjoint et ses enfants mineurs.',
    a:'Les conditions du regroupement familial doivent rester comme aujourd’hui, ou être assouplies.',
    b:'Les conditions du regroupement familial doivent être significativement durcies.',
    why:'Cette question précise votre position sur le regroupement familial.' },
  { id:'bk-immig-2', dim:'immig', topic:'Immigration de travail', plain:'Les secteurs en tension sont les métiers où les entreprises peinent à recruter.',
    a:'Il faut faciliter l’immigration de travail dans les secteurs qui manquent de main-d’œuvre.',
    b:'Il faut limiter l’immigration de travail même dans les secteurs en tension.',
    why:'Cette question précise votre position sur l’immigration liée à l’emploi.' },
  { id:'bk-immig-3', dim:'immig', topic:'Régularisations', plain:'Régulariser, c’est accorder un titre de séjour à une personne qui vit en France sans autorisation officielle (« sans-papiers »).',
    a:'Il faut permettre la régularisation des personnes sans papiers durablement installées et insérées.',
    b:'Il ne faut pas faciliter la régularisation des personnes en situation irrégulière.',
    why:'Cette question précise votre position sur la régularisation des personnes sans titre de séjour.' },
  { id:'bk-immig-4', dim:'immig', topic:'Expulsions', plain:'Une obligation de quitter le territoire est une décision administrative qui ordonne à une personne en situation irrégulière de partir de France.',
    a:'Les décisions d’expulsion doivent rester encadrées par des garanties individuelles fortes.',
    b:'Il faut faciliter et accélérer l’exécution des décisions d’expulsion.',
    why:'Cette question précise votre position sur l’exécution des obligations de quitter le territoire.' },
  { id:'bk-immig-5', dim:'immig', topic:'Droit du sol',
    a:'Le droit du sol (nationalité liée à la naissance en France) doit être maintenu tel quel.',
    b:'Le droit du sol doit être restreint ou davantage conditionné.',
    why:'Cette question précise votre position sur les règles d’accès à la nationalité par la naissance.' },
  { id:'bk-immig-6', dim:'immig', topic:'Étudiants étrangers', plain:'Frais différenciés : des frais d’inscription plus élevés pour les étudiants qui viennent de pays hors Union européenne.',
    a:'Il faut faciliter l’accueil des étudiants étrangers dans l’enseignement supérieur français.',
    b:'Il faut restreindre l’accès des étudiants étrangers, notamment via des frais différenciés plus élevés.',
    why:'Cette question précise votre position sur l’accueil des étudiants internationaux.' },

  // — Écologie (6) —
  { id:'bk-ecology-1', dim:'ecology', topic:'Énergie', plain:'Le mix énergétique, c’est la répartition des sources qui produisent l’électricité : nucléaire, éolien, solaire, hydraulique…',
    a:'Il faut donner la priorité au développement des énergies renouvelables plutôt qu’au nucléaire.',
    b:'Il faut donner au nucléaire une place centrale dans la stratégie énergétique française.',
    why:'Cette question précise votre position sur le choix du mix énergétique.' },
  { id:'bk-ecology-2', dim:'ecology', topic:'Pesticides',
    a:'Il faut interdire ou restreindre davantage les pesticides les plus controversés, même si cela complique certaines productions.',
    b:'Il faut éviter de nouvelles interdictions de pesticides tant que des solutions de remplacement ne sont pas prêtes.',
    why:'Cette question précise votre position sur la réglementation des pesticides.' },
  { id:'bk-ecology-3', dim:'ecology', topic:'Élevage',
    a:'Il faut renforcer fortement les règles de protection animale dans l’élevage, même si certaines pratiques doivent changer.',
    b:'Il faut privilégier des évolutions progressives pour limiter les contraintes sur les filières d’élevage.',
    why:'Cette question précise votre position sur la protection animale dans l’élevage.' },
  { id:'bk-ecology-4', dim:'ecology', topic:'Artificialisation des sols', plain:'Artificialiser un sol, c’est transformer une terre agricole ou naturelle en surface construite ou bétonnée (routes, lotissements, entrepôts…).',
    a:'Il faut limiter fortement l’artificialisation des sols, même si cela freine certains projets économiques.',
    b:'Il ne faut pas trop contraindre les projets économiques et de logement au nom de la limitation de l’artificialisation.',
    why:'Cette question précise votre position sur la limitation de l’artificialisation des sols.' },
  { id:'bk-ecology-5', dim:'ecology', topic:'Fiscalité carbone', plain:'Les gaz à effet de serre (CO₂, méthane…) sont les gaz qui contribuent au réchauffement climatique.',
    a:'Il faut renforcer la fiscalité sur les activités les plus émettrices de gaz à effet de serre.',
    b:'Il faut éviter d’alourdir la fiscalité environnementale sur les entreprises et les ménages.',
    why:'Cette question précise votre position sur la fiscalité environnementale.' },
  { id:'bk-ecology-6', dim:'ecology', topic:'Croissance', plain:'La croissance, c’est l’augmentation, d’une année sur l’autre, de la richesse produite par le pays (le PIB).',
    a:'Il faut accepter de repenser certains objectifs de croissance économique pour respecter les limites écologiques.',
    b:'La croissance économique doit rester un objectif prioritaire, à concilier avec les enjeux écologiques sans la remettre en cause.',
    why:'Cette question précise votre position sur le rapport entre croissance économique et limites écologiques.' }
];

/* ----------------------------------------------------------------------
   PARTIS — positions estimées sur chaque dimension (-2 à +2, même échelle
   que les réponses). CE SONT DES ESTIMATIONS ÉDITORIALES construites à
   partir des programmes et prises de position publiques identifiées,
   PAS des scores auto-déclarés par les partis. Voir la fiche de chaque
   parti dans l’application et la méthodologie pour le détail et les
   limites. Situation politique arrêtée en septembre 2026 (voir
   CHANGELOG / README pour les sources) : à vérifier avant toute
   publication, notamment les liens, à l’approche de la présidentielle
   d’avril 2027.

   VALEUR null : signifie « position non établie sur cette dimension » (le
   parti n’a pas de position identifiable sur ce thème, ou l’axe mesuré ne
   s’applique pas à sa logique — ex. l’axe intégration/souveraineté pour un
   parti internationaliste). Ce n’est JAMAIS un 0 : un 0 voudrait dire
   « position réellement modérée ». Une dimension null est exclue de la
   comparaison pour ce parti (comme une dimension à laquelle la personne
   n’a pas répondu), au lieu de rapprocher artificiellement ce parti de
   tous les profils centristes.
   ------------------------------------------------------------------- */
const PARTIES = [
  { id:'lfi', name:'La France insoumise', short:'LFI', family:'Gauche', color:'#7b5dc8',
    site:'https://lafranceinsoumise.fr/', program:'https://lafranceinsoumise.fr/programme/',
    status:'Candidature pressentie de Jean-Luc Mélenchon. Programme de référence : « L’Avenir en commun ». Positions actualisées par les votes et déclarations du mouvement en 2025-2026.',
    statusDate:'2026-09',
    positions:{ eco:-2, soc:-1.5, auth:-1, europe:0.8, immig:-1.5, ecology:-2 } },
  { id:'pcf', name:'Parti communiste français', short:'PCF', family:'Gauche', color:'#b5193f',
    site:'https://www.pcf.fr/', program:'https://www.pcf.fr/nos_propositions',
    status:'Fabien Roussel, candidat déclaré (annoncé le 6 septembre 2026). 40ᵉ congrès du parti en cours en 2026.',
    statusDate:'2026-09',
    positions:{ eco:-1.8, soc:-1, auth:-0.5, europe:0.5, immig:-1, ecology:-1 } },
  { id:'ps', name:'Parti socialiste', short:'PS', family:'Centre-gauche', color:'#df2160',
    site:'https://parti-socialiste.fr/', program:'https://parti-socialiste.fr/',
    status:'Olivier Faure, candidat à la primaire « Choisir 2027 » organisée avec Place publique (octobre 2026), aux côtés de Jérôme Guedj, Emmanuel Maurel et Ségolène Royal.',
    statusDate:'2026-09',
    positions:{ eco:-1, soc:-1.2, auth:-0.3, europe:-1.3, immig:-0.5, ecology:-0.8 } },
  { id:'pp', name:'Place publique', short:'PP', family:'Centre-gauche européen', color:'#6c53a4',
    site:'https://place-publique.eu/', program:'https://place-publique.eu/',
    status:'Raphaël Glucksmann, candidat à la primaire « Choisir 2027 » organisée avec le Parti socialiste (octobre 2026).',
    statusDate:'2026-09',
    positions:{ eco:-0.8, soc:-1.2, auth:-0.3, europe:-1.8, immig:-0.5, ecology:-1.3 } },
  { id:'ecolo', name:'Les Écologistes', short:'LE', family:'Écologie', color:'#1e9b58',
    site:'https://lesecologistes.fr/', program:'https://lesecologistes.fr/',
    status:'Marine Tondelier, secrétaire nationale (réélue en avril 2025) et candidate déclarée depuis octobre 2025 ; maintient sa candidature hors des primaires en cours (position réaffirmée en août 2026).',
    statusDate:'2026-09',
    positions:{ eco:-1.2, soc:-1.5, auth:-0.5, europe:-1.3, immig:-1, ecology:-2 } },
  { id:'renaissance', name:'Renaissance', short:'RE', family:'Centre', color:'#0b2d4f',
    site:'https://parti-renaissance.fr/', program:'https://parti-renaissance.fr/',
    status:'Gabriel Attal, secrétaire général depuis décembre 2024, candidature officialisée le 22 mai 2026.',
    statusDate:'2026-09',
    positions:{ eco:0.8, soc:-0.3, auth:0.3, europe:-1.5, immig:0.3, ecology:0 } },
  { id:'modem', name:'Mouvement Démocrate', short:'MD', family:'Centre', color:'#4c67c7',
    site:'https://www.mouvementdemocrate.fr/', program:'https://www.mouvementdemocrate.fr/',
    status:'Membre du « comité de liaison » du bloc central (Renaissance, Horizons, MoDem, UDI) constitué en 2026 en vue de la présidentielle.',
    statusDate:'2026-09',
    positions:{ eco:0.3, soc:-0.5, auth:0, europe:-1.8, immig:0, ecology:-0.3 } },
  { id:'udi', name:'Union des Démocrates et Indépendants', short:'UDI', family:'Centre-droit', color:'#0b5fae',
    site:'https://www.parti-udi.fr/', program:'https://www.parti-udi.fr/',
    status:'Membre du « comité de liaison » du bloc central constitué en 2026.',
    statusDate:'2026-09',
    positions:{ eco:0.8, soc:-0.2, auth:0.3, europe:-1.3, immig:0.3, ecology:-0.2 } },
  { id:'horizons', name:'Horizons', short:'H', family:'Centre-droit', color:'#111827',
    site:'https://horizonsleparti.fr/', program:'https://horizonsleparti.fr/le-manifeste/',
    status:'Édouard Philippe, président du parti et candidat déclaré, réélu maire du Havre en mars 2026.',
    statusDate:'2026-09',
    positions:{ eco:1, soc:-0.2, auth:0.5, europe:-1, immig:0.5, ecology:-0.2 } },
  { id:'lr', name:'Les Républicains', short:'LR', family:'Droite', color:'#1d4f91',
    site:'https://republicains.fr/', program:'https://republicains.fr/nos-propositions/',
    status:'Bruno Retailleau, président du parti depuis mai 2025, désigné candidat par un vote des adhérents (environ 74 %) en février 2026. Tension interne persistante avec Laurent Wauquiez.',
    statusDate:'2026-09',
    positions:{ eco:1.5, soc:0.8, auth:1.3, europe:0.3, immig:1.5, ecology:1 } },
  { id:'udr', name:'Union des droites pour la République', short:'UDR', family:'Droite nationale', color:'#203552',
    site:'https://www.udr.fr/', program:'https://www.udr.fr/',
    status:'Éric Ciotti, parti fondé en 2024 après sa rupture avec Les Républicains ; groupe parlementaire (UDDPLR) formé en septembre 2025, allié du Rassemblement national.',
    statusDate:'2026-09',
    positions:{ eco:1.3, soc:1.3, auth:1.8, europe:1.3, immig:1.8, ecology:1.3 } },
  { id:'rn', name:'Rassemblement National', short:'RN', family:'Droite nationale', color:'#173f70',
    site:'https://rassemblementnational.fr/', program:'https://rassemblementnational.fr/programme/',
    status:'Marine Le Pen, candidature officialisée le 7 juillet 2026 après réduction en appel de sa peine d’inéligibilité (pourvoi en cassation en cours). Jordan Bardella, président du parti, pressenti pour Matignon en cas de victoire.',
    statusDate:'2026-09',
    positions:{ eco:0.3, soc:1.3, auth:1.8, europe:1.3, immig:2, ecology:0.8 } },
  { id:'reconquete', name:'Reconquête', short:'R', family:'Droite nationale', color:'#a93f4b',
    site:'https://www.parti-reconquete.fr/', program:'https://www.parti-reconquete.fr/programme',
    status:'Éric Zemmour, président et candidat déclaré (annoncé le 17 septembre 2026).',
    statusDate:'2026-09',
    positions:{ eco:1, soc:1.8, auth:2, europe:1.8, immig:2, ecology:0.8 } },
  { id:'dlf', name:'Debout la France', short:'DLF', family:'Droite souverainiste', color:'#1683b5',
    site:'https://www.debout-la-france.fr/', program:'https://www.debout-la-france.fr/notre-projet/',
    status:'Nicolas Dupont-Aignan, président et candidat déclaré (officialisé le 19 septembre 2026), campagne centrée sur la sortie de l’Union européenne (« Frexit »).',
    statusDate:'2026-09',
    positions:{ eco:0.5, soc:0.8, auth:1.3, europe:2, immig:1.5, ecology:0.5 } },
  { id:'upr', name:'Union populaire républicaine', short:'UPR', family:'Souverainiste', color:'#25518a',
    site:'https://upr.fr/', program:'https://upr.fr/notre-programme',
    status:'Parti structuré presque exclusivement autour de la sortie de l’Union européenne, de l’euro et de l’OTAN ; pas de position établie sur les autres sujets. Il n’est donc comparé que sur l’Europe, et n’affiche pas de pourcentage.',
    statusDate:'2026-09',
    positions:{ eco:null, soc:null, auth:null, europe:2, immig:null, ecology:null } },
  { id:'lo', name:'Lutte Ouvrière', short:'LO', family:'Extrême gauche', color:'#c81f1f',
    site:'https://www.lutte-ouvriere.org/', program:'https://www.lutte-ouvriere.org/',
    status:'Nathalie Arthaud, porte-parole historique, testée dans les enquêtes d’intentions de vote pour 2027. Parti internationaliste : sa position ne se lit pas sur l’axe « intégration européenne / souveraineté nationale », cette dimension n’est donc pas comparée.',
    statusDate:'2026-09',
    positions:{ eco:-2, soc:-1, auth:-1, europe:null, immig:-1.5, ecology:-0.5 } }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DIMENSIONS, DIM_KEYS, QUESTIONS, BANK, PARTIES };
} else if (typeof window !== 'undefined') {
  // Dans le navigateur, ces `const` de haut niveau sont bien visibles par
  // nom depuis les balises <script> suivantes (portée lexicale partagée),
  // mais ne deviennent PAS des propriétés de `window` (contrairement à
  // `var`). scoring.js y accède via `window.DIMENSIONS` etc. : on les y
  // attache donc explicitement pour que ce module reste indépendant de
  // l'ordre exact d'exécution et inspectable facilement (console/débogage).
  window.DIMENSIONS = DIMENSIONS; window.DIM_KEYS = DIM_KEYS;
  window.QUESTIONS = QUESTIONS; window.BANK = BANK; window.PARTIES = PARTIES;
}
