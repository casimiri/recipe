import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Share, TextInput } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useI18n } from '../../i18n';
import { trEnum } from '../../i18n/enums';
import { useApp } from '../../store/AppState';
import { useAuth } from '../../store/auth';
import { Paywall } from '../../components/Paywall';
import { Txt } from '../../components/Txt';
import { Icon } from '../../components/Icon';
import {
  Avatar, Dish, IconBtn, RatingBadge, SourceTag, StatChip, PrimaryButton, Sheet, Tag, Scrim,
} from '../../components/atoms';
import { listReviews, type Review } from '../../lib/repo';
import { fmtQty, convertUnit } from '../../utils/format';
import { recipeHtml, recipeUrl } from '../../lib/share';
import { aiTool } from '../../lib/ai';
import { IngredientIcon, useIngredientImage } from '../../components/IngredientImage';
import { DAYS } from '../../data/seed';
import type { Tokens } from '../../theme/tokens';
import type { Ingredient, MealSlot } from '../../data/types';

const MACROS = (n: { protein: number; carbs: number; fat: number }) => [
  { k: 'Protein', v: n.protein, c: '#E5743B' },
  { k: 'Carbs', v: n.carbs, c: '#5B8DEF' },
  { k: 'Fat', v: n.fat, c: '#F5B301' },
];

function AiChip({ t, icon, label, onPress, active }: { t: Tokens; icon: React.ReactNode; label: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{
      flexDirection: 'row', alignItems: 'center', gap: 7,
      borderWidth: 1.5, borderColor: active ? t.accent : t.border,
      backgroundColor: active ? t.accentSoft : t.surface,
      paddingVertical: 10, paddingHorizontal: 15, borderRadius: 999,
    }}>
      {icon}
      <Txt style={{ color: active ? t.accent : t.text, fontSize: 13, fontWeight: '700' }}>{label}</Txt>
    </Pressable>
  );
}

export default function RecipeDetail() {
  const { t } = useTheme();
  const { tr, lang } = useI18n();
  const { byId, recipes, isSaved, toggleSave, addToPlan, units, cookbooks, addToCookbook, createCookbook, canUseAi, recordAiUse, ratings, setRecipeRating, addReview, deleteReview, rawById, logView, addGroceryItems } = useApp();
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = byId(String(id)) || recipes[0];

  const [payOpen, setPayOpen] = useState(false);
  const [servings, setServings] = useState(r.servings);
  const [checked, setChecked] = useState<string[]>([]);
  const [easier, setEasier] = useState(false);
  const [easySteps, setEasySteps] = useState<{ t: string; d: string }[] | null>(null);
  const [sheet, setSheet] = useState<null | 'sub' | 'scale' | 'plan' | 'added' | 'planned' | 'share' | 'cookbook' | 'addedCb' | 'review' | 'image'>(null);
  const ingImg = useIngredientImage(() => setPayOpen(true));
  const [newCb, setNewCb] = useState('');
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [subItem, setSubItem] = useState<Ingredient | null>(null);
  const [subs, setSubs] = useState<string[] | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const url = recipeUrl(r.id);

  // Dispatch for the share-sheet actions. Cancellation/unsupported = silent no-op.
  const onShare = async (label: string) => {
    try {
      if (label === 'Copy link') {
        await Clipboard.setStringAsync(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
        return;
      }
      setSheet(null);
      if (label === 'Stories') {
        await Share.share({ message: `${r.title} — ${url}`, url });
      } else if (label === 'Print') {
        await Print.printAsync({ html: recipeHtml(r, units) });
      } else if (label === 'Save PDF') {
        const { uri } = await Print.printToFileAsync({ html: recipeHtml(r, units) });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
        }
      }
    } catch {
      // user dismissed the OS sheet or the action is unsupported on this platform
    }
  };

  const scale = servings / r.servings;
  const saved = isSaved(r.id);

  // Blend the loaded community reviews with the seed *baseline* (base_*, the
  // pre-review prior) — the same formula the server trigger uses, so the badge
  // matches the catalog and updates instantly when reviews change here. Falls
  // back to the catalog rating (server-aggregated, or guest-blended) otherwise.
  const base = rawById(r.id) ?? r;
  const baseRating = base.baseRating ?? base.rating;
  const baseReviews = base.baseReviews ?? base.reviews;
  const reviewCount = reviews?.length ?? 0;
  const shownRating = reviewCount
    ? Math.round(((baseRating * baseReviews + reviews!.reduce((s, rv) => s + rv.rating, 0)) / (baseReviews + reviewCount)) * 10) / 10
    : r.rating;
  const groups = [...new Set(r.ingredients.map((i) => i.g))];
  const macros = MACROS(r.nutrition);
  const macroTotal = macros.reduce((s, m) => s + m.v, 0);

  // Toggle "make easier" -> fetch simplified steps via AI (with offline fallback).
  const toggleEasier = async () => {
    if (!easier && !easySteps) {
      if (!canUseAi) { setPayOpen(true); return; }
      recordAiUse();
      setEasier(true);
      const res = await aiTool({ tool: 'simplify', recipe: r, lang });
      if (res.steps) setEasySteps(res.steps);
      return;
    }
    setEasier((e) => !e);
  };

  const openSub = async (ing: Ingredient | null) => {
    if (!canUseAi) { setPayOpen(true); return; }
    recordAiUse();
    setSubItem(ing);
    setSheet('sub');
    setSubs(null);
    setSubLoading(true);
    const res = await aiTool({ tool: 'substitute', recipe: r, ingredient: ing?.item, lang });
    setSubs(res.substitutions || []);
    setSubLoading(false);
  };

  // Load community reviews for this recipe.
  useEffect(() => {
    let active = true;
    setReviews(null);
    listReviews(r.id).then((rs) => { if (active) setReviews(rs); });
    return () => { active = false; };
  }, [r.id]);

  // Remember this recipe in the "recently viewed" rail (ref keeps the effect
  // keyed on the recipe id, not the per-render logView identity).
  const logViewRef = useRef(logView);
  logViewRef.current = logView;
  useEffect(() => { logViewRef.current(r.id); }, [r.id]);

  // The user's own review for this recipe, if they've written one.
  const myReview = reviews?.find((rv) => rv.userId === session?.user?.id) ?? null;

  const openReview = () => {
    // Editing keeps your prior rating + text; a fresh review seeds from your stars.
    setReviewStars(myReview?.rating ?? ratings[r.id] ?? 0);
    setReviewText(myReview?.body ?? '');
    setSheet('review');
  };

  const submitReview = async () => {
    if (!reviewStars) return;
    setReviewBusy(true);
    const ok = await addReview(r.id, reviewStars, reviewText.trim());
    setReviewBusy(false);
    if (!ok) return;
    setSheet(null);
    const rs = await listReviews(r.id);
    setReviews(rs);
  };

  const deleteMyReview = async () => {
    setReviewBusy(true);
    const ok = await deleteReview(r.id);
    setReviewBusy(false);
    if (!ok) return;
    setSheet(null);
    const rs = await listReviews(r.id);
    setReviews(rs);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View>
          <Dish src={r.img} alt={r.title} style={{ width: '100%', height: 300 }} />
          <View style={{ position: 'absolute', top: insets.top + 4, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconBtn t={t} glass onPress={() => router.back()}><Icon.back size={22} sw={2.2} color={t.text} /></IconBtn>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {r.imported ? (
                <IconBtn t={t} glass onPress={() => router.push({ pathname: '/edit-recipe', params: { id: r.id } })}><Icon.edit size={19} sw={2} color={t.text} /></IconBtn>
              ) : null}
              <IconBtn t={t} glass onPress={() => setSheet('share')}><Icon.shareIos size={20} sw={2} color={t.text} /></IconBtn>
              <IconBtn t={t} glass active={saved} onPress={() => toggleSave(r.id)}>
                {saved ? <Icon.bookmarkFill size={19} color={t.accentText} /> : <Icon.bookmark size={19} sw={2.2} color={t.text} />}
              </IconBtn>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={{ backgroundColor: t.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -28, paddingHorizontal: 20, paddingTop: 10 }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: t.borderStrong, alignSelf: 'center', marginBottom: 18 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <Txt style={{ flex: 1, fontWeight: '800', fontSize: 25, lineHeight: 30, color: t.text }}>{r.title}</Txt>
            <RatingBadge value={shownRating} t={t} style={{ marginTop: 4, paddingHorizontal: 11, paddingVertical: 7 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 18 }}>
            <Txt style={{ fontSize: 13.5, color: t.muted, fontWeight: '600' }}>{trEnum(r.cuisine, lang)}</Txt>
            <Txt style={{ color: t.faint }}>·</Txt>
            <SourceTag source={r.source} t={t} />
          </View>

          {/* Stat circles */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 22 }}>
            <StatChip vertical t={t} icon={<Icon.clock size={22} sw={2} color={t.accent} />} value={`${r.time}`} label="mins" />
            <StatChip vertical t={t} icon={<Icon.users size={22} sw={2} color={t.accent} />} value={String(servings).padStart(2, '0')} label="servings" />
            <StatChip vertical t={t} icon={<Icon.flame size={22} color={t.accent} />} value={Math.round(r.cal * scale)} label="cal" />
            <StatChip vertical t={t} icon={<Icon.layers size={22} sw={2} color={t.accent} />} label={trEnum(r.difficulty, lang)} />
          </View>

          {/* AI tools */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginBottom: 22 }} contentContainerStyle={{ gap: 9, paddingHorizontal: 20 }}>
            <AiChip t={t} icon={<Icon.scale size={16} sw={2} color={t.accent} />} label={tr((s) => s.recipe.scale)} onPress={() => setSheet('scale')} />
            <AiChip t={t} icon={<Icon.swap size={16} sw={2} color={t.accent} />} label={tr((s) => s.recipe.substitute)} onPress={() => openSub(null)} />
            <AiChip t={t} icon={<Icon.sparkle size={16} color={t.accent} />} label={easier ? tr((s) => s.recipe.simplified) : tr((s) => s.recipe.makeEasier)} active={easier} onPress={toggleEasier} />
          </ScrollView>

          <Txt style={{ fontSize: 14.5, lineHeight: 23, color: t.muted, marginBottom: 20 }}>{r.desc}</Txt>

          {/* Your rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <Txt style={{ fontSize: 14.5, fontWeight: '700', color: t.text }}>{tr((s) => s.recipe.yourRating)}</Txt>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} hitSlop={4} onPress={async () => {
                  await setRecipeRating(r.id, n === ratings[r.id] ? 0 : n);
                  setReviews(await listReviews(r.id)); // reflect the quick rating in the community list + badge
                }}>
                  <Icon.star size={24} color={n <= (ratings[r.id] ?? 0) ? t.star : t.border} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Ingredients */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Txt style={{ fontWeight: '800', fontSize: 20, color: t.text }}>{tr((s) => s.recipe.ingredients)}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.surface2, borderRadius: 999, padding: 4 }}>
              <StepBtn t={t} onPress={() => setServings((s) => Math.max(1, s - 1))}><Icon.minus size={16} sw={2.5} color={t.text} /></StepBtn>
              <Txt style={{ minWidth: 58, textAlign: 'center', fontSize: 13, fontWeight: '700', color: t.text }}>{servings} serv</Txt>
              <StepBtn t={t} onPress={() => setServings((s) => s + 1)}><Icon.plus size={16} sw={2.5} color={t.text} /></StepBtn>
            </View>
          </View>

          {groups.map((g) => (
            <View key={g} style={{ marginBottom: 8 }}>
              {groups.length > 1 ? <Txt style={{ fontSize: 12, fontWeight: '700', color: t.accent, marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{g}</Txt> : null}
              {r.ingredients.filter((i) => i.g === g).map((ing, idx) => {
                const key = g + idx;
                const on = checked.includes(key);
                const conv = convertUnit(ing.qty * scale, ing.unit, units);
                const q = fmtQty(conv.qty);
                return (
                  <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border }}>
                    <Pressable onPress={() => setChecked((c) => (on ? c.filter((x) => x !== key) : [...c, key]))} style={{
                      width: 24, height: 24, borderRadius: 8,
                      borderWidth: on ? 0 : 2, borderColor: t.borderStrong, backgroundColor: on ? t.accent : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {on ? <Icon.check size={14} sw={3} color={t.accentText} /> : null}
                    </Pressable>
                    <IngredientIcon item={ing.item} t={t} />
                    <Txt style={{ flex: 1, fontSize: 14.5, color: t.text, textDecorationLine: on ? 'line-through' : 'none', opacity: on ? 0.5 : 1 }}>
                      {q ? <Txt style={{ fontWeight: '700', fontSize: 14.5 }}>{q}{conv.unit ? ' ' + conv.unit : ''} </Txt> : null}{ing.item}
                    </Txt>
                    <Pressable onPress={() => ingImg.view(ing.item)} hitSlop={6} style={{ padding: 4 }}>
                      <Icon.eye size={18} sw={2} color={t.faint} />
                    </Pressable>
                    <Pressable onPress={() => openSub(ing)} hitSlop={6} style={{ padding: 4 }}>
                      <Icon.swap size={17} sw={2} color={t.faint} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}

          {/* Directions */}
          <Txt style={{ fontWeight: '800', fontSize: 20, color: t.text, marginTop: 32, marginBottom: 16 }}>
            {tr((s) => s.recipe.directions)}{easier ? <Txt style={{ fontSize: 12.5, color: t.accent, fontWeight: '700' }}>  · {tr((s) => s.recipe.simplifiedByAi)}</Txt> : null}
          </Txt>
          <View style={{ gap: 16 }}>
            {r.steps.map((s, i) => {
              const desc = easier && easySteps ? easySteps[i]?.d ?? s.d : s.d;
              return (
                <View key={i} style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt style={{ color: t.accent, fontWeight: '800', fontSize: 14 }}>{i + 1}</Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontWeight: '700', fontSize: 14.5, color: t.text, marginBottom: 3 }}>{s.t}</Txt>
                    <Txt style={{ fontSize: 14, lineHeight: 22, color: t.muted }}>{desc}</Txt>
                    {s.timer ? (
                      <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: t.surface2, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
                        <Icon.timer size={14} sw={2} color={t.text} />
                        <Txt style={{ color: t.text, fontSize: 12.5, fontWeight: '700' }}>{Math.round(s.timer / 60)} min timer</Txt>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Nutrition */}
          <Txt style={{ fontWeight: '800', fontSize: 20, color: t.text, marginTop: 32, marginBottom: 14 }}>
            {tr((s) => s.recipe.nutrition)} <Txt style={{ fontSize: 12.5, color: t.muted, fontWeight: '600' }}>{tr((s) => s.recipe.perServing)}</Txt>
          </Txt>
          <View style={{ backgroundColor: t.surface2, borderRadius: t.radius, padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
              <Txt style={{ fontSize: 32, fontWeight: '800', color: t.text }}>{r.nutrition.cal}</Txt>
              <Txt style={{ fontSize: 14, color: t.muted, fontWeight: '600' }}>calories</Txt>
            </View>
            <View style={{ flexDirection: 'row', height: 10, borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
              {macros.map((m) => <View key={m.k} style={{ width: `${(m.v / macroTotal) * 100}%`, backgroundColor: m.c }} />)}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {macros.map((m) => (
                <View key={m.k} style={{ alignItems: 'center', flex: 1 }}>
                  <Txt style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{m.v}g</Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: m.c }} />
                    <Txt style={{ fontSize: 12, color: t.muted }}>{m.k}</Txt>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 14 }}>
            <Txt style={{ fontWeight: '800', fontSize: 20, color: t.text }}>
              {tr((s) => s.recipe.reviews)}{reviews && reviews.length > 0 ? ` (${reviews.length})` : ''}
            </Txt>
            {session ? (
              <Pressable onPress={openReview} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon.edit size={15} sw={2} color={t.accent} />
                <Txt style={{ color: t.accent, fontWeight: '700', fontSize: 13.5 }}>{tr((s) => (myReview ? s.recipe.editYourReview : s.recipe.writeReview))}</Txt>
              </Pressable>
            ) : null}
          </View>
          {reviews === null ? (
            <ActivityIndicator color={t.accent} style={{ alignSelf: 'flex-start' }} />
          ) : reviews.length === 0 ? (
            <Txt style={{ fontSize: 13.5, color: t.muted }}>{tr((s) => s.recipe.noReviews)}</Txt>
          ) : (
            <View style={{ gap: 16 }}>
              {reviews.map((rv) => (
                <View key={rv.id} style={{ flexDirection: 'row', gap: 12 }}>
                  <Avatar src={rv.authorAvatar || undefined} size={38} t={t} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Txt style={{ fontWeight: '700', fontSize: 14, color: t.text }}>{rv.authorName}</Txt>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((n) => <Icon.star key={n} size={13} color={n <= rv.rating ? t.star : t.border} />)}
                      </View>
                    </View>
                    {rv.body ? <Txt style={{ fontSize: 13.5, color: t.muted, lineHeight: 20, marginTop: 3 }}>{rv.body}</Txt> : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Add to plan */}
          <Pressable onPress={() => setSheet('plan')} style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: t.radius, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.calendar size={20} sw={2} color={t.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '700', fontSize: 14.5, color: t.text }}>{tr((s) => s.recipe.addToMealPlan)}</Txt>
              <Txt style={{ fontSize: 12.5, color: t.muted }}>{tr((s) => s.recipe.scheduleSub)}</Txt>
            </View>
            <Icon.chevR size={20} sw={2} color={t.faint} />
          </Pressable>

          {/* Add to cookbook */}
          <Pressable onPress={() => setSheet('cookbook')} style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: t.radius, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.book size={20} sw={2} color={t.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '700', fontSize: 14.5, color: t.text }}>{tr((s) => s.recipe.addToCookbook)}</Txt>
              <Txt style={{ fontSize: 12.5, color: t.muted }}>{tr((s) => s.recipe.organizeSub)}</Txt>
            </View>
            <Icon.chevR size={20} sw={2} color={t.faint} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky action buttons */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingBottom: insets.bottom + 14, paddingTop: 24 }}>
        <Scrim colors={['transparent', t.surface]} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PrimaryButton t={t} ghost full icon={<Icon.cart size={18} sw={2} color={t.text} />} style={{ paddingVertical: 17, backgroundColor: t.accentSoft, borderWidth: 0 }}
            onPress={() => {
              const n = addGroceryItems(
                r.ingredients.map((ing) => {
                  const conv = convertUnit(ing.qty * scale, ing.unit, units);
                  const q = fmtQty(conv.qty);
                  return { name: ing.item, qty: q ? `${q}${conv.unit ? ' ' + conv.unit : ''}` : '' };
                }),
                r.title,
              );
              setAddedCount(n);
              setSheet('added');
            }}>
            {tr((s) => s.recipe.addAllToList)}
          </PrimaryButton>
          <PrimaryButton t={t} full icon={<Icon.play size={17} color={t.accentText} />} style={{ paddingVertical: 17 }}
            onPress={() => router.push({ pathname: '/cook/[id]', params: { id: r.id, servings } })}>
            {tr((s) => s.recipe.startCooking)}
          </PrimaryButton>
        </View>
      </View>

      {/* Substitute sheet */}
      <Sheet open={sheet === 'sub'} onClose={() => { setSheet(null); setSubItem(null); }} t={t} title={subItem ? tr((s) => s.recipe.swap, { item: subItem.item }) : tr((s) => s.recipe.smartSubs)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Icon.sparkle size={16} color={t.accent} />
          <Txt style={{ color: t.accent, fontSize: 13, fontWeight: '700' }}>{tr((s) => s.recipe.aiSuggestions)}</Txt>
        </View>
        {subLoading ? (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}><ActivityIndicator color={t.accent} /></View>
        ) : (
          <View style={{ gap: 8, marginBottom: 8 }}>
            {(subs || []).map((s, j) => (
              <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: t.surface2, borderRadius: t.radiusSm }}>
                <Icon.swap size={16} sw={2} color={t.accent} />
                <Txt style={{ flex: 1, fontSize: 14, color: t.text }}>{s}</Txt>
              </View>
            ))}
          </View>
        )}
      </Sheet>

      {/* Scale sheet */}
      <Sheet open={sheet === 'scale'} onClose={() => setSheet(null)} t={t} title={tr((s) => s.recipe.scaleRecipe)}>
        <View style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 20 }}>
          <Txt style={{ fontSize: 13, color: t.muted, marginBottom: 16, textAlign: 'center' }}>{tr((s) => s.recipe.adjustServings)}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22 }}>
            <StepBtn t={t} big onPress={() => setServings((s) => Math.max(1, s - 1))}><Icon.minus size={22} sw={2.5} color={t.text} /></StepBtn>
            <Txt style={{ fontSize: 48, fontWeight: '800', color: t.text, minWidth: 80, textAlign: 'center' }}>{servings}</Txt>
            <StepBtn t={t} big accent onPress={() => setServings((s) => s + 1)}><Icon.plus size={22} sw={2.5} color={t.accentText} /></StepBtn>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 22 }}>
            {[2, 4, 6, 8].map((n) => <Tag key={n} t={t} active={servings === n} onPress={() => setServings(n)}>{tr((s) => s.recipe.servingsN, { count: n })}</Tag>)}
          </View>
        </View>
        <PrimaryButton t={t} full onPress={() => setSheet(null)}>{tr((s) => s.common.done)}</PrimaryButton>
      </Sheet>

      {/* Plan sheet */}
      <Sheet open={sheet === 'plan'} onClose={() => setSheet(null)} t={t} title={tr((s) => s.recipe.addToMealPlan)}>
        <PlanPicker t={t} onPick={(day, meal) => { addToPlan(day, meal, r.id); setSheet('planned'); }} />
      </Sheet>

      {/* Confirms */}
      <ConfirmSheet open={sheet === 'added'} onClose={() => setSheet(null)} t={t} icon={<Icon.cart size={26} sw={2} color={t.accent} />}
        title={tr((s) => s.recipe.addedToList)} body={addedCount > 0 ? tr((s) => s.recipe.ingredientsAdded, { count: addedCount, title: r.title }) : tr((s) => s.recipe.alreadyOnList, { title: r.title })}
        cta={tr((s) => s.recipe.viewList)} onCta={() => router.push('/(tabs)/grocery')} />
      <ConfirmSheet open={sheet === 'planned'} onClose={() => setSheet(null)} t={t} icon={<Icon.calendar size={26} sw={2} color={t.accent} />}
        title={tr((s) => s.recipe.addedToPlan)} body={tr((s) => s.recipe.addedToPlanBody, { title: r.title })} cta={tr((s) => s.recipe.openPlan)} onCta={() => router.push('/(tabs)/planner')} />

      {/* Share */}
      <Sheet open={sheet === 'share'} onClose={() => { setSheet(null); setCopied(false); }} t={t} title={tr((s) => s.recipe.shareRecipe)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Dish src={r.img} alt="" radius={12} style={{ width: 54, height: 54 }} />
          <View>
            <Txt style={{ fontWeight: '700', color: t.text, fontSize: 15 }}>{r.title}</Txt>
            <Txt style={{ fontSize: 12.5, color: copied ? t.accent : t.muted, fontWeight: copied ? '700' : '400' }}>
              {copied ? tr((s) => s.recipe.linkCopied) : `recipe-snap.app/r/${r.id}`}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[
            { icon: <Icon.link size={22} sw={2} color={t.text} />, key: 'Copy link', label: tr((s) => s.recipe.copyLink) },
            { icon: <Icon.instagram size={22} sw={2} color={t.text} />, key: 'Stories', label: tr((s) => s.recipe.stories) },
            { icon: <Icon.printer size={22} sw={2} color={t.text} />, key: 'Print', label: tr((s) => s.recipe.print) },
            { icon: <Icon.download size={22} sw={2} color={t.text} />, key: 'Save PDF', label: tr((s) => s.recipe.savePdf) },
          ].map((o) => (
            <Pressable key={o.key} onPress={() => onShare(o.key)} style={{ alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>{o.icon}</View>
              <Txt style={{ fontSize: 12, color: t.muted, fontWeight: '600' }}>{o.label}</Txt>
            </Pressable>
          ))}
        </View>
      </Sheet>

      {/* Add to cookbook */}
      <Sheet open={sheet === 'cookbook'} onClose={() => { setSheet(null); setNewCb(''); }} t={t} title={tr((s) => s.recipe.addToCookbook)}>
        {cookbooks.length === 0 ? (
          <Txt style={{ fontSize: 13.5, color: t.muted, marginBottom: 16 }}>{tr((s) => s.recipe.noCookbooks)}</Txt>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {cookbooks.map((c) => {
              const inIt = c.recipeIds.includes(r.id);
              return (
                <Tag key={c.id} t={t} active={inIt} onPress={() => { if (!inIt) addToCookbook(c.id, r.id); setSheet('addedCb'); }}>
                  {inIt ? `${c.name} ✓` : c.name}
                </Tag>
              );
            })}
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TextInput value={newCb} onChangeText={setNewCb} placeholder={tr((s) => s.recipe.newCookbook)} placeholderTextColor={t.faint}
            style={{ flex: 1, backgroundColor: t.surface2, borderRadius: t.radiusSm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: t.text, fontFamily: t.body }} />
          <PrimaryButton t={t} disabled={!newCb.trim()} style={{ paddingHorizontal: 18, paddingVertical: 12 }}
            onPress={() => { const id = createCookbook(newCb); addToCookbook(id, r.id); setNewCb(''); setSheet('addedCb'); }}>
            {tr((s) => s.recipe.create)}
          </PrimaryButton>
        </View>
      </Sheet>
      <ConfirmSheet open={sheet === 'addedCb'} onClose={() => setSheet(null)} t={t} icon={<Icon.book size={26} sw={2} color={t.accent} />}
        title={tr((s) => s.recipe.addedToCookbook)} body={tr((s) => s.recipe.savedToCookbookBody, { title: r.title })}
        cta={tr((s) => s.recipe.viewCookbooks)} onCta={() => router.push('/(tabs)/cookbooks')} />

      {/* Write a review */}
      <Sheet open={sheet === 'review'} onClose={() => setSheet(null)} t={t} title={tr((s) => (myReview ? s.recipe.editYourReview : s.recipe.writeReview))}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 6, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} hitSlop={4} onPress={() => setReviewStars(n)}>
              <Icon.star size={34} color={n <= reviewStars ? t.star : t.border} />
            </Pressable>
          ))}
        </View>
        <TextInput
          value={reviewText} onChangeText={setReviewText} multiline
          placeholder={tr((s) => s.recipe.reviewPlaceholder)} placeholderTextColor={t.faint}
          style={{ backgroundColor: t.surface2, borderRadius: t.radiusSm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: t.text, fontFamily: t.body, minHeight: 90, textAlignVertical: 'top', borderWidth: 1, borderColor: t.border, marginBottom: 16 }}
        />
        <PrimaryButton t={t} full disabled={!reviewStars || reviewBusy} onPress={submitReview}>
          {reviewBusy ? tr((s) => s.auth.pleaseWait) : tr((s) => s.recipe.postReview)}
        </PrimaryButton>
        {myReview ? (
          <Pressable onPress={deleteMyReview} disabled={reviewBusy} hitSlop={6} style={{ alignItems: 'center', marginTop: 14 }}>
            <Txt style={{ color: t.danger, fontWeight: '700', fontSize: 14 }}>{tr((s) => s.recipe.deleteReview)}</Txt>
          </Pressable>
        ) : null}
      </Sheet>

      {ingImg.element}

      <Paywall open={payOpen} onClose={() => setPayOpen(false)} reachedLimit />
    </View>
  );
}

function StepBtn({ t, children, onPress, big, accent }: { t: Tokens; children: React.ReactNode; onPress: () => void; big?: boolean; accent?: boolean }) {
  const s = big ? 52 : 30;
  return (
    <Pressable onPress={onPress} style={{
      width: s, height: s, borderRadius: s / 2,
      backgroundColor: accent ? t.accent : (big ? t.surface2 : t.surface),
      alignItems: 'center', justifyContent: 'center',
    }}>{children}</Pressable>
  );
}

function PlanPicker({ t, onPick }: { t: Tokens; onPick: (day: string, meal: MealSlot) => void }) {
  const [day, setDay] = useState('Mon');
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }} style={{ marginBottom: 18 }}>
        {DAYS.map((d) => <Tag key={d} t={t} active={day === d} onPress={() => setDay(d)}>{d}</Tag>)}
      </ScrollView>
      <View style={{ gap: 10 }}>
        {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((m) => (
          <Pressable key={m} onPress={() => onPick(day, m)} style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingVertical: 15, paddingHorizontal: 18, borderRadius: t.radiusSm, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface,
          }}>
            <Txt style={{ textTransform: 'capitalize', fontSize: 15, fontWeight: '600', color: t.text }}>{m}</Txt>
            <Icon.plus size={18} sw={2.5} color={t.accent} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ConfirmSheet({ open, onClose, t, icon, title, body, cta, onCta }: {
  open: boolean; onClose: () => void; t: Tokens; icon: React.ReactNode; title: string; body: string; cta: string; onCta: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} t={t}>
      <View style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 10 }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{icon}</View>
        <Txt style={{ fontWeight: '800', fontSize: 21, color: t.text, marginBottom: 6 }}>{title}</Txt>
        <Txt style={{ fontSize: 14, color: t.muted, marginBottom: 22, lineHeight: 21, textAlign: 'center' }}>{body}</Txt>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PrimaryButton t={t} ghost full onPress={onClose}>Close</PrimaryButton>
          <PrimaryButton t={t} full onPress={() => { onClose(); onCta(); }}>{cta}</PrimaryButton>
        </View>
      </View>
    </Sheet>
  );
}
