// recipes.ts — per-language overlay for the seed catalog's free-text fields.
// localizeRecipe() returns a copy with title/desc/ingredients/steps replaced for
// the active language, falling back to the authored English for anything missing
// — so imported recipes and untranslated fields just stay as written. Enum-ish
// fields (cuisine, meal, difficulty, tags) are NOT touched here: they drive
// filtering/category logic and must stay English; localize them at render time
// with trEnum() instead.
//
// ingredients/steps are index-aligned with the seed recipe (same order/length).
import type { Recipe } from '../data/types';
import type { Lang } from './index';

interface RecipeOverlay {
  title: string;
  desc: string;
  ingredients?: { item: string; g: string }[];
  steps?: { t: string; d: string }[];
}

type Overlays = Record<string, RecipeOverlay>;

const fr: Overlays = {
  crepes: {
    title: 'Crêpes à l’orange et au miel',
    desc: 'De délicates crêpes françaises pliées sur des oranges chaudes au miel. Un brunch lumineux et acidulé, prêt en une seule poêle.',
    ingredients: [
      { item: 'œufs', g: 'Pâte' },
      { item: 'farine tout usage', g: 'Pâte' },
      { item: 'lait entier', g: 'Pâte' },
      { item: 'beurre fondu', g: 'Pâte' },
      { item: 'sel', g: 'Pâte' },
      { item: 'oranges, en quartiers', g: 'Pour finir' },
      { item: 'miel', g: 'Pour finir' },
      { item: 'sucre glace', g: 'Pour finir' },
    ],
    steps: [
      { t: 'Préparer la pâte', d: 'Dans un grand bol, fouettez la farine, les œufs et le sel. Versez peu à peu le lait et l’eau en fouettant jusqu’à obtenir une pâte lisse. Incorporez le beurre fondu et laissez reposer 10 minutes.' },
      { t: 'Chauffer la poêle', d: 'Posez une poêle antiadhésive sur feu moyen et beurrez-la légèrement. Versez une fine couche de pâte en tournant pour napper le fond.' },
      { t: 'Cuire la crêpe', d: 'Cuisez 1 à 2 minutes jusqu’à ce que les bords se soulèvent, puis retournez et cuisez 30 secondes de plus. Répétez avec le reste de la pâte.' },
      { t: 'Réchauffer les oranges', d: 'Réchauffez doucement les quartiers d’orange avec le miel jusqu’à ce qu’ils soient brillants et parfumés, environ 2 minutes.' },
      { t: 'Dresser et servir', d: 'Pliez chaque crêpe en quatre, nappez des oranges au miel et saupoudrez de sucre glace.' },
    ],
  },
  curry: {
    title: 'Curry de poulet doré',
    desc: 'Un curry de coco doré et parfumé, avec du poulet tendre, du gingembre frais et une pointe de curcuma. Pensé pour la semaine, savoureux comme le week-end.',
    ingredients: [
      { item: 'cuisses de poulet, en dés', g: 'Principal' },
      { item: 'lait de coco', g: 'Principal' },
      { item: 'pâte de curry jaune', g: 'Principal' },
      { item: 'oignon, émincé', g: 'Aromates' },
      { item: 'ail, haché', g: 'Aromates' },
      { item: 'gingembre frais, râpé', g: 'Aromates' },
      { item: 'curcuma', g: 'Épice' },
      { item: 'riz jasmin', g: 'Pour servir' },
    ],
    steps: [
      { t: 'Saisir le poulet', d: 'Faites dorer les dés de poulet dans une cocotte huilée bien chaude sur toutes les faces. Réservez.' },
      { t: 'Préparer la base', d: 'Faites suer l’oignon, l’ail et le gingembre, puis ajoutez la pâte de curry et le curcuma jusqu’à ce que ce soit parfumé.' },
      { t: 'Mijoter', d: 'Versez le lait de coco, remettez le poulet et laissez mijoter doucement jusqu’à épaississement et cuisson complète.' },
      { t: 'Servir', d: 'Servez sur du riz jasmin vapeur et terminez avec de la coriandre fraîche et du citron vert.' },
    ],
  },
  salmon: {
    title: 'Saumon laqué au miel',
    desc: 'Saumon à la peau croustillante laqué d’un glaçage ail-miel-soja qui caramélise en quelques minutes. Digne d’un restaurant, sans effort.',
    ingredients: [
      { item: 'filets de saumon', g: 'Principal' },
      { item: 'miel', g: 'Glaçage' },
      { item: 'sauce soja', g: 'Glaçage' },
      { item: 'ail, haché', g: 'Glaçage' },
      { item: 'jus de citron', g: 'Glaçage' },
      { item: 'huile d’olive', g: 'Principal' },
    ],
    steps: [
      { t: 'Préparer le glaçage', d: 'Fouettez le miel, le soja, l’ail et le jus de citron dans un petit bol.' },
      { t: 'Saisir côté peau', d: 'Saisissez le saumon dans l’huile chaude, côté peau, jusqu’à ce que la peau soit croustillante, environ 4 minutes.' },
      { t: 'Laquer et terminer', d: 'Retournez, versez le glaçage et arrosez le poisson jusqu’à ce qu’il soit épais et brillant, 2 à 3 minutes.' },
      { t: 'Reposer et servir', d: 'Laissez reposer 2 minutes, puis servez avec des légumes verts et la sauce de la poêle.' },
    ],
  },
  pasta: {
    title: 'Spaghetti Pomodoro',
    desc: 'Les pâtes à la tomate des puristes : San Marzano sucrées, bonne huile d’olive, basilic déchiré. Cinq ingrédients, réconfort infini.',
    ingredients: [
      { item: 'spaghetti', g: 'Principal' },
      { item: 'tomates San Marzano', g: 'Sauce' },
      { item: 'ail, émincé', g: 'Sauce' },
      { item: 'huile d’olive', g: 'Sauce' },
      { item: 'basilic frais', g: 'Pour finir' },
    ],
    steps: [
      { t: 'Cuire les pâtes', d: 'Cuisez les spaghetti dans une eau bien salée jusqu’à al dente. Réservez une tasse d’eau de cuisson.' },
      { t: 'Démarrer la sauce', d: 'Faites revenir doucement l’ail dans l’huile d’olive, puis ajoutez les tomates concassées et laissez mijoter.' },
      { t: 'Mélanger', d: 'Mélangez les pâtes à la sauce avec un peu d’eau de cuisson jusqu’à ce que ce soit nappant. Terminez avec le basilic.' },
    ],
  },
  bowl: {
    title: 'Bol Green Goddess',
    desc: 'Verdure croquante, avocat crémeux et une sauce aux herbes. Le déjeuner qui donne l’impression d’avoir sa vie en main.',
    ingredients: [
      { item: 'mélange de jeunes pousses', g: 'Bol' },
      { item: 'avocat, en tranches', g: 'Bol' },
      { item: 'quinoa cuit', g: 'Bol' },
      { item: 'sauce green goddess', g: 'Sauce' },
      { item: 'graines de courge', g: 'Bol' },
    ],
    steps: [
      { t: 'Préparer la base', d: 'Disposez les pousses et le quinoa dans un grand bol.' },
      { t: 'Garnir', d: 'Disposez l’avocat en éventail et parsemez de graines de courge.' },
      { t: 'Assaisonner et déguster', d: 'Arrosez généreusement de sauce et mélangez à table.' },
    ],
  },
  pizza: {
    title: 'Pizza Margherita',
    desc: 'Croûte boursouflée, sauce San Marzano, mozzarella fraîche et basilic. Toute la raison d’avoir un four.',
    ingredients: [
      { item: 'pâte à pizza', g: 'Base' },
      { item: 'sauce tomate', g: 'Garniture' },
      { item: 'mozzarella fraîche', g: 'Garniture' },
      { item: 'basilic frais', g: 'Garniture' },
      { item: 'huile d’olive', g: 'Garniture' },
    ],
    steps: [
      { t: 'Préchauffer à fond', d: 'Chauffez le four et une plaque à pizza au maximum, au moins 30 minutes.' },
      { t: 'Étaler et garnir', d: 'Étirez la pâte, étalez finement la sauce et parsemez de mozzarella déchirée.' },
      { t: 'Cuire', d: 'Cuisez jusqu’à ce que la croûte soit dorée et le fromage bouillonnant, 6 à 8 minutes.' },
      { t: 'Finir', d: 'Garnissez de basilic frais et d’un filet d’huile d’olive.' },
    ],
  },
  tacos: {
    title: 'Tacos de rue',
    desc: 'Viande marinée et grillée glissée dans des tortillas de maïs chaudes avec oignon, coriandre et un trait de citron vert. Serviettes obligatoires.',
    ingredients: [
      { item: 'bavette de bœuf', g: 'Principal' },
      { item: 'tortillas de maïs', g: 'Principal' },
      { item: 'oignon blanc, en dés', g: 'Garnitures' },
      { item: 'coriandre', g: 'Garnitures' },
      { item: 'citrons verts', g: 'Garnitures' },
    ],
    steps: [
      { t: 'Saisir la viande', d: 'Saisissez fortement la viande, laissez reposer puis coupez en bouchées.' },
      { t: 'Réchauffer les tortillas', d: 'Faites griller les tortillas directement sur la flamme jusqu’à ce qu’elles soient souples et tachetées.' },
      { t: 'Assembler', d: 'Garnissez de viande, ajoutez l’oignon et la coriandre, terminez avec le citron vert.' },
    ],
  },
  oats: {
    title: 'Overnight oats aux fruits rouges',
    desc: 'Préparez-les ce soir, attrapez-les demain. Flocons crémeux, chia et une cascade de fruits rouges — le petit-déjeuner en pilote automatique.',
    ingredients: [
      { item: 'flocons d’avoine', g: 'Base' },
      { item: 'lait d’amande', g: 'Base' },
      { item: 'graines de chia', g: 'Base' },
      { item: 'fruits rouges mélangés', g: 'Dessus' },
      { item: 'sirop d’érable', g: 'Base' },
    ],
    steps: [
      { t: 'Mélanger', d: 'Mélangez les flocons, le lait, le chia et le sirop d’érable dans un bocal.' },
      { t: 'Réfrigérer une nuit', d: 'Couvrez et réfrigérez au moins 4 heures, idéalement toute la nuit.' },
      { t: 'Garnir et filer', d: 'Garnissez de fruits rouges le matin et dégustez froid.' },
    ],
  },
  lassi: {
    title: 'Lassi à la mangue',
    desc: 'Froid, crémeux et doré — mangue mûre mixée avec du yaourt et une pincée de cardamome.',
    ingredients: [
      { item: 'mangue mûre', g: 'À mixer' },
      { item: 'yaourt', g: 'À mixer' },
      { item: 'lait', g: 'À mixer' },
      { item: 'cardamome', g: 'À mixer' },
    ],
    steps: [
      { t: 'Mixer', d: 'Mixez le tout jusqu’à obtenir un mélange parfaitement lisse.' },
      { t: 'Servir', d: 'Versez sur de la glace et saupoudrez de cardamome.' },
    ],
  },
  lava: {
    title: 'Fondant au chocolat',
    desc: 'Bords moelleux, cœur coulant. Mélangez dans un bol, enfournez douze minutes et passez pour un génie.',
    ingredients: [
      { item: 'chocolat noir', g: 'Pâte' },
      { item: 'beurre', g: 'Pâte' },
      { item: 'œufs', g: 'Pâte' },
      { item: 'sucre', g: 'Pâte' },
      { item: 'farine', g: 'Pâte' },
    ],
    steps: [
      { t: 'Faire fondre', d: 'Faites fondre ensemble le chocolat et le beurre jusqu’à ce que ce soit brillant.' },
      { t: 'Mélanger', d: 'Incorporez les œufs et le sucre au fouet, puis ajoutez la farine.' },
      { t: 'Cuire', d: 'Cuisez dans des ramequins beurrés jusqu’à ce que les bords soient pris mais le centre tremblotant, 11 à 12 min.' },
      { t: 'Démouler', d: 'Laissez reposer 1 minute, démoulez sur une assiette et servez aussitôt.' },
    ],
  },
  matcha: {
    title: 'Latte matcha glacé',
    desc: 'Matcha cérémonial fouetté sur du lait froid et des glaçons. Plus calme que le café, et plus joli.',
    ingredients: [
      { item: 'poudre de matcha', g: 'Boisson' },
      { item: 'eau chaude', g: 'Boisson' },
      { item: 'lait d’avoine', g: 'Boisson' },
      { item: 'sirop d’érable', g: 'Boisson' },
    ],
    steps: [
      { t: 'Fouetter', d: 'Fouettez le matcha avec l’eau chaude jusqu’à ce que ce soit mousseux et sans grumeaux.' },
      { t: 'Verser', d: 'Versez sur le lait glacé et sucrez selon le goût.' },
    ],
  },
  roast: {
    title: 'Poulet rôti au citron et aux herbes',
    desc: 'Peau dorée et croustillante, beurre d’herbes citronné sous chaque centimètre. Le dîner du dimanche qui règne sur la table.',
    ingredients: [
      { item: 'poulet entier', g: 'Principal' },
      { item: 'beurre, ramolli', g: 'Beurre aux herbes' },
      { item: 'citron, coupé en deux', g: 'Principal' },
      { item: 'thym', g: 'Beurre aux herbes' },
      { item: 'tête d’ail', g: 'Principal' },
    ],
    steps: [
      { t: 'Assaisonner', d: 'Enduisez le poulet de beurre aux herbes, partout et sous la peau ; salez généreusement.' },
      { t: 'Rôtir', d: 'Rôtissez à feu vif, en arrosant une fois, jusqu’à ce que le jus soit clair, environ 75 minutes.' },
      { t: 'Reposer', d: 'Laissez reposer 15 minutes avant de découper pour que le jus se répartisse.' },
    ],
  },
};

const es: Overlays = {
  crepes: {
    title: 'Crepes con naranja y miel',
    desc: 'Delicadas crepes francesas dobladas sobre naranjas calientes con miel. Un brunch luminoso y cítrico que se hace en una sola sartén.',
    ingredients: [
      { item: 'huevos', g: 'Masa' },
      { item: 'harina común', g: 'Masa' },
      { item: 'leche entera', g: 'Masa' },
      { item: 'mantequilla derretida', g: 'Masa' },
      { item: 'sal', g: 'Masa' },
      { item: 'naranjas, en gajos', g: 'Para terminar' },
      { item: 'miel', g: 'Para terminar' },
      { item: 'azúcar glas', g: 'Para terminar' },
    ],
    steps: [
      { t: 'Preparar la masa', d: 'En un bol grande, bate la harina, los huevos y la sal. Vierte poco a poco la leche y el agua sin dejar de batir hasta que quede lisa. Añade la mantequilla derretida y deja reposar 10 minutos.' },
      { t: 'Calentar la sartén', d: 'Pon una sartén antiadherente a fuego medio y úntala con un poco de mantequilla. Vierte una capa fina de masa girando para cubrir la base.' },
      { t: 'Cocinar la crepe', d: 'Cocina 1 o 2 minutos hasta que los bordes se levanten, luego da la vuelta y cocina 30 segundos más. Repite con el resto de la masa.' },
      { t: 'Calentar las naranjas', d: 'Calienta suavemente los gajos de naranja con la miel hasta que estén brillantes y aromáticos, unos 2 minutos.' },
      { t: 'Emplatar y servir', d: 'Dobla cada crepe en cuatro, cúbrela con las naranjas a la miel y espolvorea con azúcar glas.' },
    ],
  },
  curry: {
    title: 'Curry de pollo dorado',
    desc: 'Un curry de coco dorado y aromático con muslos de pollo tiernos, jengibre fresco y un toque de cúrcuma. Pensado para entre semana, sabe a fin de semana.',
    ingredients: [
      { item: 'muslos de pollo, en dados', g: 'Principal' },
      { item: 'leche de coco', g: 'Principal' },
      { item: 'pasta de curry amarillo', g: 'Principal' },
      { item: 'cebolla, en rodajas', g: 'Aromáticos' },
      { item: 'ajo, picado', g: 'Aromáticos' },
      { item: 'jengibre fresco, rallado', g: 'Aromáticos' },
      { item: 'cúrcuma', g: 'Especia' },
      { item: 'arroz jazmín', g: 'Para servir' },
    ],
    steps: [
      { t: 'Dorar el pollo', d: 'Dora los dados de pollo en una olla caliente con aceite por todos lados. Retira y reserva.' },
      { t: 'Hacer la base', d: 'Pocha la cebolla, el ajo y el jengibre, luego añade la pasta de curry y la cúrcuma hasta que sea aromático.' },
      { t: 'Hervir a fuego lento', d: 'Vierte la leche de coco, devuelve el pollo y cuece a fuego lento hasta que espese y esté hecho.' },
      { t: 'Servir', d: 'Sirve sobre arroz jazmín al vapor y termina con cilantro fresco y lima.' },
    ],
  },
  salmon: {
    title: 'Salmón glaseado con miel',
    desc: 'Salmón de piel crujiente lacado con un glaseado de ajo, miel y soja que carameliza en minutos. De restaurante, sin complicaciones.',
    ingredients: [
      { item: 'filetes de salmón', g: 'Principal' },
      { item: 'miel', g: 'Glaseado' },
      { item: 'salsa de soja', g: 'Glaseado' },
      { item: 'ajo, picado', g: 'Glaseado' },
      { item: 'zumo de limón', g: 'Glaseado' },
      { item: 'aceite de oliva', g: 'Principal' },
    ],
    steps: [
      { t: 'Mezclar el glaseado', d: 'Bate la miel, la soja, el ajo y el zumo de limón en un bol pequeño.' },
      { t: 'Sellar con la piel abajo', d: 'Sella el salmón en aceite caliente, con la piel hacia abajo, hasta que la piel esté crujiente, unos 4 minutos.' },
      { t: 'Glasear y terminar', d: 'Da la vuelta, vierte el glaseado y báñalo sobre el pescado hasta que esté espeso y brillante, 2 o 3 minutos.' },
      { t: 'Reposar y servir', d: 'Deja reposar 2 minutos y sirve con verduras y la salsa de la sartén.' },
    ],
  },
  pasta: {
    title: 'Espaguetis Pomodoro',
    desc: 'La pasta de tomate de los puristas: San Marzano dulces, buen aceite de oliva, albahaca troceada. Cinco ingredientes, consuelo infinito.',
    ingredients: [
      { item: 'espaguetis', g: 'Principal' },
      { item: 'tomates San Marzano', g: 'Salsa' },
      { item: 'ajo, en láminas', g: 'Salsa' },
      { item: 'aceite de oliva', g: 'Salsa' },
      { item: 'albahaca fresca', g: 'Para terminar' },
    ],
    steps: [
      { t: 'Hervir la pasta', d: 'Cuece los espaguetis en agua bien salada hasta que estén al dente. Reserva una taza del agua de cocción.' },
      { t: 'Empezar la salsa', d: 'Sofríe suavemente el ajo en aceite de oliva, luego añade los tomates triturados y deja hervir a fuego lento.' },
      { t: 'Mezclar', d: 'Mezcla la pasta con la salsa y un chorrito del agua de cocción hasta que quede sedosa. Termina con albahaca.' },
    ],
  },
  bowl: {
    title: 'Bowl Green Goddess',
    desc: 'Verduras crujientes, aguacate cremoso y un aliño de hierbas. El almuerzo que te hace sentir que tienes la vida resuelta.',
    ingredients: [
      { item: 'mezcla de hojas verdes', g: 'Bol' },
      { item: 'aguacate, en rodajas', g: 'Bol' },
      { item: 'quinoa cocida', g: 'Bol' },
      { item: 'aliño green goddess', g: 'Aliño' },
      { item: 'pipas de calabaza', g: 'Bol' },
    ],
    steps: [
      { t: 'Montar la base', d: 'Coloca las hojas verdes y la quinoa en un bol ancho.' },
      { t: 'Coronar', d: 'Distribuye el aguacate en abanico y esparce las pipas de calabaza.' },
      { t: 'Aliñar y comer', d: 'Rocía generosamente con el aliño y mezcla en la mesa.' },
    ],
  },
  pizza: {
    title: 'Pizza Margarita',
    desc: 'Masa con ampollas, salsa San Marzano, mozzarella fresca y albahaca. El motivo de tener un horno.',
    ingredients: [
      { item: 'masa de pizza', g: 'Base' },
      { item: 'salsa de tomate', g: 'Cobertura' },
      { item: 'mozzarella fresca', g: 'Cobertura' },
      { item: 'albahaca fresca', g: 'Cobertura' },
      { item: 'aceite de oliva', g: 'Cobertura' },
    ],
    steps: [
      { t: 'Precalentar al máximo', d: 'Calienta el horno y una piedra para pizza lo más fuerte posible, al menos 30 minutos.' },
      { t: 'Estirar y cubrir', d: 'Estira la masa, extiende una capa fina de salsa y reparte la mozzarella troceada.' },
      { t: 'Hornear', d: 'Hornea hasta que la masa esté tostada y el queso burbujee, 6 a 8 minutos.' },
      { t: 'Terminar', d: 'Cubre con albahaca fresca y un chorrito de aceite de oliva.' },
    ],
  },
  tacos: {
    title: 'Tacos callejeros',
    desc: 'Carne marinada y a la brasa en tortillas de maíz calientes con cebolla, cilantro y un chorrito de lima. Servilletas obligatorias.',
    ingredients: [
      { item: 'falda de res', g: 'Principal' },
      { item: 'tortillas de maíz', g: 'Principal' },
      { item: 'cebolla blanca, en dados', g: 'Coberturas' },
      { item: 'cilantro', g: 'Coberturas' },
      { item: 'limas', g: 'Coberturas' },
    ],
    steps: [
      { t: 'Sellar la carne', d: 'Sella la carne a fuego fuerte, déjala reposar y córtala en trozos pequeños.' },
      { t: 'Calentar las tortillas', d: 'Tuesta las tortillas directamente sobre la llama hasta que estén suaves y con manchas.' },
      { t: 'Montar', d: 'Coloca la carne, añade cebolla y cilantro, y termina con lima.' },
    ],
  },
  oats: {
    title: 'Avena nocturna con frutos rojos',
    desc: 'Remueve esta noche, cógela mañana. Avena cremosa, chía y un montón de frutos rojos — el desayuno en piloto automático.',
    ingredients: [
      { item: 'copos de avena', g: 'Base' },
      { item: 'leche de almendras', g: 'Base' },
      { item: 'semillas de chía', g: 'Base' },
      { item: 'frutos rojos variados', g: 'Encima' },
      { item: 'sirope de arce', g: 'Base' },
    ],
    steps: [
      { t: 'Combinar', d: 'Mezcla la avena, la leche, la chía y el sirope en un tarro.' },
      { t: 'Enfriar toda la noche', d: 'Tapa y refrigera al menos 4 horas, idealmente toda la noche.' },
      { t: 'Coronar y listo', d: 'Por la mañana cubre con los frutos rojos y come frío.' },
    ],
  },
  lassi: {
    title: 'Lassi de mango',
    desc: 'Frío, cremoso y dorado — mango maduro batido con yogur y una pizca de cardamomo.',
    ingredients: [
      { item: 'mango maduro', g: 'Para batir' },
      { item: 'yogur', g: 'Para batir' },
      { item: 'leche', g: 'Para batir' },
      { item: 'cardamomo', g: 'Para batir' },
    ],
    steps: [
      { t: 'Batir', d: 'Bate todo hasta que quede completamente suave.' },
      { t: 'Servir', d: 'Vierte sobre hielo y espolvorea con cardamomo.' },
    ],
  },
  lava: {
    title: 'Coulant de chocolate',
    desc: 'Bordes esponjosos, centro fundido. Mezcla en un bol, hornea doce minutos y parece cosa de genios.',
    ingredients: [
      { item: 'chocolate negro', g: 'Masa' },
      { item: 'mantequilla', g: 'Masa' },
      { item: 'huevos', g: 'Masa' },
      { item: 'azúcar', g: 'Masa' },
      { item: 'harina', g: 'Masa' },
    ],
    steps: [
      { t: 'Fundir', d: 'Funde juntos el chocolate y la mantequilla hasta que brillen.' },
      { t: 'Mezclar', d: 'Bate los huevos y el azúcar, luego incorpora la harina.' },
      { t: 'Hornear', d: 'Hornea en moldes untados hasta que los bordes cuajen pero el centro tiemble, 11 a 12 min.' },
      { t: 'Desmoldar', d: 'Deja reposar 1 minuto, vuelca sobre un plato y sirve de inmediato.' },
    ],
  },
  matcha: {
    title: 'Latte de matcha helado',
    desc: 'Matcha ceremonial batido sobre leche fría y hielo. Más tranquilo que el café, y más bonito.',
    ingredients: [
      { item: 'polvo de matcha', g: 'Bebida' },
      { item: 'agua caliente', g: 'Bebida' },
      { item: 'leche de avena', g: 'Bebida' },
      { item: 'sirope de arce', g: 'Bebida' },
    ],
    steps: [
      { t: 'Batir', d: 'Bate el matcha con el agua caliente hasta que esté espumoso y sin grumos.' },
      { t: 'Verter', d: 'Vierte sobre la leche con hielo y endulza al gusto.' },
    ],
  },
  roast: {
    title: 'Pollo asado al limón y hierbas',
    desc: 'Piel dorada y crujiente, mantequilla de hierbas al limón bajo cada centímetro. La cena de domingo que manda en la mesa.',
    ingredients: [
      { item: 'pollo entero', g: 'Principal' },
      { item: 'mantequilla, ablandada', g: 'Mantequilla de hierbas' },
      { item: 'limón, partido', g: 'Principal' },
      { item: 'tomillo', g: 'Mantequilla de hierbas' },
      { item: 'cabeza de ajo', g: 'Principal' },
    ],
    steps: [
      { t: 'Sazonar', d: 'Unta el pollo por todas partes y bajo la piel con la mantequilla de hierbas; sala generosamente.' },
      { t: 'Asar', d: 'Asa a fuego fuerte, rociando una vez, hasta que los jugos salgan claros, unos 75 minutos.' },
      { t: 'Reposar', d: 'Deja reposar 15 minutos antes de trinchar para que se asienten los jugos.' },
    ],
  },
};

const de: Overlays = {
  crepes: {
    title: 'Crêpes mit Orange & Honig',
    desc: 'Zarte französische Crêpes über warmen, honiggetränkten Orangen. Ein helles, zitroniges Brunch aus nur einer Pfanne.',
    ingredients: [
      { item: 'Eier', g: 'Teig' },
      { item: 'Allzweckmehl', g: 'Teig' },
      { item: 'Vollmilch', g: 'Teig' },
      { item: 'geschmolzene Butter', g: 'Teig' },
      { item: 'Salz', g: 'Teig' },
      { item: 'Orangen, filetiert', g: 'Zum Abschluss' },
      { item: 'Honig', g: 'Zum Abschluss' },
      { item: 'Puderzucker', g: 'Zum Abschluss' },
    ],
    steps: [
      { t: 'Teig anrühren', d: 'Mehl, Eier und Salz in einer großen Schüssel verquirlen. Milch und Wasser nach und nach unterrühren, bis der Teig glatt ist. Die geschmolzene Butter unterrühren und 10 Minuten ruhen lassen.' },
      { t: 'Pfanne erhitzen', d: 'Eine beschichtete Pfanne bei mittlerer Hitze leicht einfetten. Eine dünne Schicht Teig hineingeben und schwenken, bis der Boden bedeckt ist.' },
      { t: 'Crêpe backen', d: '1–2 Minuten backen, bis sich die Ränder lösen, dann wenden und 30 Sekunden weiterbacken. Mit dem restlichen Teig wiederholen.' },
      { t: 'Orangen erwärmen', d: 'Die Orangenfilets mit dem Honig sanft erwärmen, bis sie glänzen und duften, etwa 2 Minuten.' },
      { t: 'Anrichten & servieren', d: 'Jede Crêpe vierteln, mit den Honigorangen belegen und mit Puderzucker bestäuben.' },
    ],
  },
  curry: {
    title: 'Goldenes Hähnchencurry',
    desc: 'Ein duftendes, goldenes Kokoscurry mit zarten Hähnchenschenkeln, frischem Ingwer und einem Hauch Kurkuma. Für unter der Woche, schmeckt nach Wochenende.',
    ingredients: [
      { item: 'Hähnchenschenkel, gewürfelt', g: 'Hauptzutaten' },
      { item: 'Kokosmilch', g: 'Hauptzutaten' },
      { item: 'gelbe Currypaste', g: 'Hauptzutaten' },
      { item: 'Zwiebel, in Scheiben', g: 'Aromaten' },
      { item: 'Knoblauch, gehackt', g: 'Aromaten' },
      { item: 'frischer Ingwer, gerieben', g: 'Aromaten' },
      { item: 'Kurkuma', g: 'Gewürz' },
      { item: 'Jasminreis', g: 'Zum Servieren' },
    ],
    steps: [
      { t: 'Hähnchen anbraten', d: 'Die Hähnchenwürfel in einem heißen, geölten Topf rundum goldbraun braten. Herausnehmen und beiseitestellen.' },
      { t: 'Basis zubereiten', d: 'Zwiebel, Knoblauch und Ingwer andünsten, dann Currypaste und Kurkuma einrühren, bis es duftet.' },
      { t: 'Köcheln', d: 'Kokosmilch angießen, das Hähnchen zurückgeben und sanft köcheln, bis alles eingedickt und gar ist.' },
      { t: 'Servieren', d: 'Über gedämpftem Jasminreis anrichten und mit frischem Koriander und Limette abschließen.' },
    ],
  },
  salmon: {
    title: 'Honigglasierter Lachs',
    desc: 'Lachs mit knuspriger Haut, lackiert mit einer Knoblauch-Honig-Soja-Glasur, die in Minuten karamellisiert. Restaurantreif, ganz ohne Aufwand.',
    ingredients: [
      { item: 'Lachsfilets', g: 'Hauptzutaten' },
      { item: 'Honig', g: 'Glasur' },
      { item: 'Sojasauce', g: 'Glasur' },
      { item: 'Knoblauch, gehackt', g: 'Glasur' },
      { item: 'Zitronensaft', g: 'Glasur' },
      { item: 'Olivenöl', g: 'Hauptzutaten' },
    ],
    steps: [
      { t: 'Glasur anrühren', d: 'Honig, Soja, Knoblauch und Zitronensaft in einer kleinen Schüssel verquirlen.' },
      { t: 'Auf der Haut anbraten', d: 'Den Lachs in heißem Öl auf der Hautseite anbraten, bis die Haut knusprig ist, etwa 4 Minuten.' },
      { t: 'Glasieren & abschließen', d: 'Wenden, die Glasur angießen und über den Fisch löffeln, bis sie dick und glänzend ist, 2–3 Minuten.' },
      { t: 'Ruhen & servieren', d: '2 Minuten ruhen lassen, dann mit Grünzeug und der Pfannensauce servieren.' },
    ],
  },
  pasta: {
    title: 'Spaghetti Pomodoro',
    desc: 'Die Tomatenpasta für Puristen: süße San-Marzano-Tomaten, gutes Olivenöl, gezupftes Basilikum. Fünf Zutaten, endloser Genuss.',
    ingredients: [
      { item: 'Spaghetti', g: 'Hauptzutaten' },
      { item: 'San-Marzano-Tomaten', g: 'Soße' },
      { item: 'Knoblauch, in Scheiben', g: 'Soße' },
      { item: 'Olivenöl', g: 'Soße' },
      { item: 'frisches Basilikum', g: 'Zum Abschluss' },
    ],
    steps: [
      { t: 'Pasta kochen', d: 'Die Spaghetti in gut gesalzenem Wasser al dente kochen. Eine Tasse Nudelwasser zurückbehalten.' },
      { t: 'Soße ansetzen', d: 'Den Knoblauch sanft in Olivenöl andünsten, dann die zerdrückten Tomaten zugeben und köcheln lassen.' },
      { t: 'Vermengen', d: 'Die Pasta mit etwas Nudelwasser in der Soße schwenken, bis sie sämig ist. Mit Basilikum abschließen.' },
    ],
  },
  bowl: {
    title: 'Green-Goddess-Bowl',
    desc: 'Knackiges Grün, cremige Avocado und ein Kräuterdressing. Das Mittagessen, das dir das Gefühl gibt, alles im Griff zu haben.',
    ingredients: [
      { item: 'gemischte Blattsalate', g: 'Bowl' },
      { item: 'Avocado, in Scheiben', g: 'Bowl' },
      { item: 'gekochte Quinoa', g: 'Bowl' },
      { item: 'Green-Goddess-Dressing', g: 'Dressing' },
      { item: 'Kürbiskerne', g: 'Bowl' },
    ],
    steps: [
      { t: 'Basis aufbauen', d: 'Die Blattsalate und die Quinoa in eine weite Schüssel schichten.' },
      { t: 'Belegen', d: 'Die Avocado fächerförmig auflegen und mit Kürbiskernen bestreuen.' },
      { t: 'Anmachen & essen', d: 'Großzügig mit Dressing beträufeln und am Tisch durchmischen.' },
    ],
  },
  pizza: {
    title: 'Pizza Margherita',
    desc: 'Blasiger Teigrand, San-Marzano-Sauce, frischer Mozzarella und Basilikum. Der ganze Sinn eines Backofens.',
    ingredients: [
      { item: 'Pizzateig', g: 'Basis' },
      { item: 'Tomatensauce', g: 'Belag' },
      { item: 'frischer Mozzarella', g: 'Belag' },
      { item: 'frisches Basilikum', g: 'Belag' },
      { item: 'Olivenöl', g: 'Belag' },
    ],
    steps: [
      { t: 'Heiß vorheizen', d: 'Ofen und Pizzastein so heiß wie möglich vorheizen, mindestens 30 Minuten.' },
      { t: 'Ausziehen & belegen', d: 'Den Teig ausziehen, die Sauce dünn aufstreichen und mit gezupftem Mozzarella belegen.' },
      { t: 'Backen', d: 'Backen, bis der Rand gebräunt ist und der Käse Blasen wirft, 6–8 Minuten.' },
      { t: 'Abschließen', d: 'Mit frischem Basilikum und einem Schuss Olivenöl garnieren.' },
    ],
  },
  tacos: {
    title: 'Tacos im Streetfood-Stil',
    desc: 'Mariniertes, gegrilltes Fleisch in warmen Maistortillas mit Zwiebel, Koriander und einem Spritzer Limette. Servietten Pflicht.',
    ingredients: [
      { item: 'Flanksteak', g: 'Hauptzutaten' },
      { item: 'Maistortillas', g: 'Hauptzutaten' },
      { item: 'weiße Zwiebel, gewürfelt', g: 'Toppings' },
      { item: 'Koriander', g: 'Toppings' },
      { item: 'Limetten', g: 'Toppings' },
    ],
    steps: [
      { t: 'Steak anbraten', d: 'Das Steak scharf anbraten, ruhen lassen und in mundgerechte Stücke schneiden.' },
      { t: 'Tortillas erwärmen', d: 'Die Tortillas direkt über der Flamme rösten, bis sie weich und fleckig sind.' },
      { t: 'Zusammensetzen', d: 'Mit Fleisch füllen, mit Zwiebel und Koriander belegen und mit Limette abschließen.' },
    ],
  },
  oats: {
    title: 'Overnight Oats mit Beeren',
    desc: 'Heute Abend rühren, morgen mitnehmen. Cremige Haferflocken, Chia und eine Ladung Beeren — Frühstück auf Autopilot.',
    ingredients: [
      { item: 'Haferflocken', g: 'Basis' },
      { item: 'Mandelmilch', g: 'Basis' },
      { item: 'Chiasamen', g: 'Basis' },
      { item: 'gemischte Beeren', g: 'Oben' },
      { item: 'Ahornsirup', g: 'Basis' },
    ],
    steps: [
      { t: 'Verrühren', d: 'Haferflocken, Milch, Chia und Ahornsirup in einem Glas verrühren.' },
      { t: 'Über Nacht kühlen', d: 'Abgedeckt mindestens 4 Stunden kühlen, am besten über Nacht.' },
      { t: 'Belegen & los', d: 'Morgens mit Beeren belegen und kalt genießen.' },
    ],
  },
  lassi: {
    title: 'Mango-Lassi',
    desc: 'Kalt, cremig und goldgelb — reife Mango mit Joghurt und einer Prise Kardamom gemixt.',
    ingredients: [
      { item: 'reife Mango', g: 'Mixen' },
      { item: 'Joghurt', g: 'Mixen' },
      { item: 'Milch', g: 'Mixen' },
      { item: 'Kardamom', g: 'Mixen' },
    ],
    steps: [
      { t: 'Mixen', d: 'Alles cremig glatt mixen.' },
      { t: 'Servieren', d: 'Über Eis gießen und mit Kardamom bestäuben.' },
    ],
  },
  lava: {
    title: 'Schokoladen-Lavakuchen',
    desc: 'Kuchige Ränder, flüssiger Kern. In einer Schüssel anrühren, zwölf Minuten backen und wie ein Genie dastehen.',
    ingredients: [
      { item: 'Zartbitterschokolade', g: 'Teig' },
      { item: 'Butter', g: 'Teig' },
      { item: 'Eier', g: 'Teig' },
      { item: 'Zucker', g: 'Teig' },
      { item: 'Mehl', g: 'Teig' },
    ],
    steps: [
      { t: 'Schmelzen', d: 'Schokolade und Butter zusammen glänzend schmelzen.' },
      { t: 'Verrühren', d: 'Eier und Zucker unterrühren, dann das Mehl unterheben.' },
      { t: 'Backen', d: 'In gebutterten Förmchen backen, bis die Ränder fest sind, die Mitte aber noch wackelt, 11–12 Min.' },
      { t: 'Stürzen', d: '1 Minute ruhen lassen, auf einen Teller stürzen und sofort servieren.' },
    ],
  },
  matcha: {
    title: 'Eis-Matcha-Latte',
    desc: 'Aufgeschlagener Zeremonien-Matcha über kalter Milch und Eis. Ruhiger als Kaffee, und hübscher.',
    ingredients: [
      { item: 'Matchapulver', g: 'Getränk' },
      { item: 'heißes Wasser', g: 'Getränk' },
      { item: 'Hafermilch', g: 'Getränk' },
      { item: 'Ahornsirup', g: 'Getränk' },
    ],
    steps: [
      { t: 'Aufschlagen', d: 'Matcha mit heißem Wasser schaumig und klümpchenfrei aufschlagen.' },
      { t: 'Eingießen', d: 'Über die eisgekühlte Milch gießen und nach Geschmack süßen.' },
    ],
  },
  roast: {
    title: 'Zitronen-Kräuter-Brathähnchen',
    desc: 'Goldene, knusprige Haut und zitronige Kräuterbutter unter jedem Zentimeter. Das Sonntagsessen, das den Tisch beherrscht.',
    ingredients: [
      { item: 'ganzes Hähnchen', g: 'Hauptzutaten' },
      { item: 'Butter, weich', g: 'Kräuterbutter' },
      { item: 'Zitrone, halbiert', g: 'Hauptzutaten' },
      { item: 'Thymian', g: 'Kräuterbutter' },
      { item: 'Knoblauchknolle', g: 'Hauptzutaten' },
    ],
    steps: [
      { t: 'Würzen', d: 'Das Hähnchen rundum und unter der Haut mit Kräuterbutter einreiben; großzügig salzen.' },
      { t: 'Braten', d: 'Bei hoher Hitze braten, einmal begießen, bis der Saft klar austritt, etwa 75 Minuten.' },
      { t: 'Ruhen', d: 'Vor dem Tranchieren 15 Minuten ruhen lassen, damit sich der Saft verteilt.' },
    ],
  },
};

const OVERLAYS: Record<Lang, Overlays> = { en: {}, fr, es, de };

/** Return the recipe with free-text fields localized for `lang` (English passes through). */
export function localizeRecipe(recipe: Recipe, lang: Lang): Recipe {
  if (lang === 'en') return recipe;
  const o = OVERLAYS[lang][recipe.id];
  if (!o) return recipe;
  return {
    ...recipe,
    title: o.title ?? recipe.title,
    desc: o.desc ?? recipe.desc,
    ingredients: o.ingredients
      ? recipe.ingredients.map((ing, i) => ({ ...ing, item: o.ingredients![i]?.item ?? ing.item, g: o.ingredients![i]?.g ?? ing.g }))
      : recipe.ingredients,
    steps: o.steps
      ? recipe.steps.map((st, i) => ({ ...st, t: o.steps![i]?.t ?? st.t, d: o.steps![i]?.d ?? st.d }))
      : recipe.steps,
  };
}
